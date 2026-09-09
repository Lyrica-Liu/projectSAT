"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Badge } from "@/components/ui/ds";
import { Wordmark } from "@/components/ui/nav";
import type { CategoryResult } from "@/lib/diagnostic-scoring";

const STEPS = [
  { title: "Welcome aboard", sub: "Let's build your personal path to a higher score — it only takes a minute." },
  { title: "Where you stand", sub: "A recent score, if you have one, gives the diagnostic a head start." },
  { title: "Aim high", sub: "Your target score shapes every practice set we choose." },
  { title: "How it works", sub: "Every day follows the same shape — see it before you dive in." },
  { title: "Quick diagnostic", sub: "About 48 questions, mixed difficulty, so the plan starts calibrated instead of guessing." },
  { title: "Your results", sub: "Strong, medium, or weak — see exactly where you stand before anything's decided." },
  { title: "You're all set", sub: "Your 30-day path is built and Day 1 is waiting." },
];

const GRADES = ["9", "10", "11", "12", "Other"];

const LAST_STEP = 6;
const PCT_BY_STEP = [0, 17, 33, 50, 67, 83, 100];

const DRAFT_KEY = "onboarding-draft-v2";

interface OnboardingDraft {
  step: number;
  name: string;
  grade: string;
  mathScore: string;
  noMathScore: boolean;
  englishScore: string;
  noEnglishScore: boolean;
  target: number;
  testDate: string;
}

function metadataFor(d: {
  name: string; grade: string; mathScore: string; noMathScore: boolean;
  englishScore: string; noEnglishScore: boolean; target: number; testDate: string;
}) {
  return {
    display_name: d.name || undefined,
    grade: d.grade,
    target_score: d.target,
    test_date: d.testDate || null,
    math_baseline_score: d.noMathScore || !d.mathScore ? null : Number(d.mathScore),
    english_baseline_score: d.noEnglishScore || !d.englishScore ? null : Number(d.englishScore),
  };
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    position: "relative", padding: "14px 20px",
    border: `1px solid ${active ? "var(--text-strong)" : "var(--border-strong)"}`,
    background: "transparent", borderRadius: "var(--radius-md)", fontFamily: "var(--font-serif)",
    fontSize: 17, color: "var(--text-body)", cursor: "pointer",
  };
}

function miniChipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "5px 11px", border: `1px solid ${active ? "var(--text-strong)" : "var(--border-strong)"}`,
    background: active ? "var(--surface-sunken)" : "transparent", borderRadius: "var(--radius-sm)",
    fontFamily: "var(--font-sans)", fontSize: 11, color: active ? "var(--text-strong)" : "var(--text-faint)", cursor: "pointer",
  };
}

function ActiveMark({ active }: { active: boolean }) {
  if (!active) return null;
  return <span style={{ position: "absolute", inset: -1, borderRadius: "var(--radius-md)", border: "1px solid var(--text-strong)", background: "var(--surface-sunken)" }} />;
}

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 12, letterSpacing: "0.14em",
  textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 20px",
};

const TIER_TONE: Record<string, "mint" | "butter" | "rose"> = { strong: "mint", medium: "butter", weak: "rose" };

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("11");
  const [mathScore, setMathScore] = useState("");
  const [noMathScore, setNoMathScore] = useState(false);
  const [englishScore, setEnglishScore] = useState("");
  const [noEnglishScore, setNoEnglishScore] = useState(false);
  const [target, setTarget] = useState(1450);
  const [testDate, setTestDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [diagnosticSessionId, setDiagnosticSessionId] = useState<string | null>(null);
  const [diagnosticCompleted, setDiagnosticCompleted] = useState(false);
  const [diagnosticSkipped, setDiagnosticSkipped] = useState(false);
  const [diagnosticStarting, setDiagnosticStarting] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);

  const [results, setResults] = useState<CategoryResult[] | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [skipCategories, setSkipCategories] = useState<string[]>([]);
  const [reduceCategories, setReduceCategories] = useState<string[]>([]);

  // A real plan (plan_days rows) only exists once onboarding has actually finished once before
  // — a true first-timer has none yet, so this is only ever true on a second-or-later pass
  // (via "Redo onboarding" on the Account page). Gates the "Quit" escape hatch below: a
  // first-timer has nowhere meaningful to quit *to* yet (no plan, no dashboard worth seeing),
  // while a redoer already has one they can safely bail back out to.
  const [hasExistingPlan, setHasExistingPlan] = useState(false);
  const [quitting, setQuitting] = useState(false);

  // Guards the draft-save effect so it doesn't overwrite a real saved draft with fresh
  // defaults before the restore pass (below) has had a chance to run.
  const restoredRef = useRef(false);

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  }

  useEffect(() => {
    async function guard() {
      let draft: OnboardingDraft | null = null;
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) draft = JSON.parse(raw);
      } catch { /* ignore malformed draft */ }

      if (draft) {
        setName(draft.name ?? "");
        setGrade(draft.grade ?? "11");
        setMathScore(draft.mathScore ?? "");
        setNoMathScore(draft.noMathScore ?? false);
        setEnglishScore(draft.englishScore ?? "");
        setNoEnglishScore(draft.noEnglishScore ?? false);
        setTarget(draft.target ?? 1450);
        setTestDate(draft.testDate ?? "");
        if (draft.step != null) setStep(draft.step);
      }

      // No account needed to work through the wizard — a user stays anonymous through their
      // whole 30-day plan unless they separately convert from the dashboard, so an anonymous
      // account with a finished plan is the *normal* case, not an edge case. Redirect away on
      // onboarding_complete alone (regardless of account type) — an anonymous, already-onboarded
      // user landing back here (bookmark, browser back, a stale link) must never be allowed to
      // re-submit the results/override step and re-trigger generate-plan, which is destructive
      // mid-plan: it overwrites subcategory/difficulty for every day (including completed ones)
      // and resets category_progress back to raw diagnostic-tier starting difficulties, wiping
      // out all adaptive progress made since.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        restoredRef.current = true;
        return;
      }
      if (user.user_metadata?.onboarding_complete) {
        router.replace("/dashboard");
        return;
      }

      const { count } = await supabase.from("plan_days").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      setHasExistingPlan((count ?? 0) > 0);

      // The diagnostic is optional — the interstitial and the diagnostic session itself (via
      // its Exit button on /practice) both let a user skip it, persisted here so a refresh
      // doesn't undo that choice and drag them back into "resume the diagnostic." A skip is
      // authoritative over any in-progress session: skip straight to the finish step rather
      // than reopening results for a diagnostic they explicitly chose not to take.
      if (user.user_metadata?.diagnostic_skipped) {
        setDiagnosticSkipped(true);
        setStep(6);
      } else {
        // The diagnostic's completion state is authoritative over whatever step number happens
        // to be sitting in the local draft — always resume (or return to results) from there.
        const sessionId = user.user_metadata?.diagnostic_session_id as string | undefined;
        if (sessionId) {
          setDiagnosticSessionId(sessionId);
          const { data: sessionRow } = await supabase
            .from("sessions").select("completed_at").eq("id", sessionId).eq("user_id", user.id).maybeSingle();
          if (sessionRow?.completed_at) {
            setDiagnosticCompleted(true);
            setStep(5);
          } else {
            setStep(4);
          }
        }
      }

      restoredRef.current = true;
    }
    guard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep a local draft so progress survives a refresh.
  useEffect(() => {
    if (!restoredRef.current) return;
    const draft: OnboardingDraft = { step, name, grade, mathScore, noMathScore, englishScore, noEnglishScore, target, testDate };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
  }, [step, name, grade, mathScore, noMathScore, englishScore, noEnglishScore, target, testDate]);

  // Fetch diagnostic results once the results/override step becomes active.
  useEffect(() => {
    if (step !== 5 || results !== null || resultsLoading) return;
    async function loadResults() {
      setResultsLoading(true);
      setResultsError(null);
      try {
        const res = await fetch("/api/diagnostic-results", { method: "POST" });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Could not load your results.");
        setResults(body.results);
      } catch (err) {
        setResultsError(err instanceof Error ? err.message : "Could not load your results.");
      } finally {
        setResultsLoading(false);
      }
    }
    loadResults();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function next() { setStep((s) => Math.min(LAST_STEP, s + 1)); }
  function back() { setStep((s) => Math.max(0, s - 1)); }

  function toggleOverride(category: string, kind: "skip" | "reduce") {
    if (kind === "skip") {
      setSkipCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
      setReduceCategories((prev) => prev.filter((c) => c !== category));
    } else {
      setReduceCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
      setSkipCategories((prev) => prev.filter((c) => c !== category));
    }
  }

  // No account exists yet at this point — the diagnostic needs *some* real identity to save
  // its questions/session against, so a quiet anonymous one is created here. It behaves
  // exactly like a normal signed-in user until it's turned into a real account later, from
  // the dashboard, once the plan has been seen in action.
  async function enterDiagnostic() {
    setSaving(true);
    setSaveError(null);

    let { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        setSaving(false);
        setSaveError("Couldn't get started just now. Please try again.");
        return;
      }
      user = data.user;
    }

    const { error: updateErr } = await supabase.auth.updateUser({
      data: metadataFor({ name, grade, mathScore, noMathScore, englishScore, noEnglishScore, target, testDate }),
    });
    if (updateErr) {
      setSaving(false);
      setSaveError("Couldn't save your answers just now. Please try again.");
      return;
    }

    setSaving(false);
    setStep(4);
  }

  async function beginDiagnostic() {
    setDiagnosticStarting(true);
    setDiagnosticError(null);
    try {
      const res = await fetch("/api/start-diagnostic", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not start the diagnostic.");
      router.push(`/practice/${body.sessionId}`);
    } catch (err) {
      setDiagnosticError(err instanceof Error ? err.message : "Could not start the diagnostic.");
      setDiagnosticStarting(false);
    }
  }

  function resumeDiagnostic() {
    if (diagnosticSessionId) router.push(`/practice/${diagnosticSessionId}`);
  }

  // The diagnostic is optional. Skipping means the plan below can't be personalized by
  // performance — every category ends up on equal footing instead of extra time where it's
  // actually needed — so this is a deliberate opt-out, not a silent default; the plan is still
  // fully generated (via generate-plan's neutral fallback), just evenly paced.
  async function skipDiagnostic() {
    setSaving(true);
    setDiagnosticError(null);
    const { error } = await supabase.auth.updateUser({ data: { diagnostic_skipped: true } });
    setSaving(false);
    if (error) {
      setDiagnosticError("Couldn't skip just now. Please try again.");
      return;
    }
    setDiagnosticSkipped(true);
    setStep(6);
  }

  // Only reachable when hasExistingPlan is true — abandons this redo attempt and restores
  // onboarding_complete so the user lands back on their existing, untouched plan exactly as it
  // was. generate-plan is never called here, so nothing about that plan changes; any diagnostic
  // session started during this redo attempt is simply left unfinished (harmless — same as any
  // other abandoned session) rather than cleaned up.
  async function quitOnboarding() {
    setQuitting(true);
    await supabase.auth.updateUser({ data: { onboarding_complete: true } });
    router.push("/dashboard");
  }

  async function finish() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skip: skipCategories, reduce: reduceCategories }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not generate your plan.");
      clearDraft();
      router.push("/plan");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not generate your plan. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const currentStep = STEPS[step];
  const barPct = PCT_BY_STEP[step];
  const stepLabel = step === 0 ? "Getting started" : step >= 1 && step <= 5 ? `Step ${step} of 5` : "Done";

  const planPreview = Array.from({ length: 9 }, (_, i) => (i + 1) % 3 === 0);

  const currentScoreLabel = (() => {
    const parts: string[] = [];
    if (!noMathScore && mathScore) parts.push(`Math ${mathScore}`);
    if (!noEnglishScore && englishScore) parts.push(`R&W ${englishScore}`);
    return parts.length > 0 ? parts.join(" · ") : "Not taken yet";
  })();

  const summary = [
    { label: "30-day plan", value: "20 English · 10 Math" },
    { label: "Diagnostic", value: diagnosticSkipped ? "Skipped — evenly paced" : "Personalized to your results" },
    { label: "Target score", value: String(target) },
    { label: "Current score", value: currentScoreLabel },
    { label: "Test day", value: testDate || "Not set" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)" }}>

      {/* Left brand panel */}
      <aside style={{
        position: "relative", flex: "0 0 40%", minWidth: 340, maxWidth: 520,
        overflow: "hidden", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "44px 48px", background: "var(--dark-900)",
      }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <Wordmark dark />
          {hasExistingPlan && (
            <button
              onClick={quitOnboarding}
              disabled={quitting}
              style={{
                border: "1px solid var(--dark-700)", background: "none", fontFamily: "var(--font-sans)",
                fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-on-dark-faint)",
                cursor: quitting ? "default" : "pointer", padding: "6px 12px", borderRadius: "var(--radius-md)",
                opacity: quitting ? 0.6 : 1,
              }}
            >
              {quitting ? "Quitting…" : "Quit"}
            </button>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-on-dark-faint)", margin: "0 0 24px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 26, height: 1, background: "var(--dark-700)" }} />
            Setting your path
          </p>
          <h2 style={{ fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.024em", color: "var(--text-on-dark)", margin: "0 0 14px", textWrap: "pretty" }}>{currentStep.title}</h2>
          <p style={{ fontSize: 16, lineHeight: 1.66, color: "var(--text-on-dark-muted)", margin: 0, maxWidth: "34ch", textWrap: "pretty" }}>{currentStep.sub}</p>
        </div>

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-on-dark-faint)" }}>{stepLabel}</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-on-dark-muted)", fontVariantNumeric: "tabular-nums" }}>{barPct}%</span>
          </div>
          <div style={{ height: 2, background: "var(--dark-border)", overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", background: "var(--text-on-dark)", width: `${barPct}%`, transition: "width 0.3s var(--ease-out)" }} />
          </div>
        </div>
      </aside>

      {/* Right main */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "72px 56px" }}>
        <div style={{ width: "100%", maxWidth: 620 }}>

          {/* Step 0: Who's studying */}
          {step === 0 && (
            <div>
              <h1 style={{ fontWeight: 400, fontSize: 50, lineHeight: 1.04, letterSpacing: "-0.026em", color: "var(--text-strong)", margin: "0 0 16px" }}>Who&apos;s studying?</h1>
              <p style={{ fontSize: 17, color: "var(--text-muted)", margin: "0 0 40px", lineHeight: 1.62, maxWidth: "46ch" }}>
                Just enough to make this feel like yours. No account needed to start.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 32, marginBottom: 40 }}>
                <Input label="What's your first name?" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Maya" />
                <div>
                  <p style={eyebrow}>What grade are you in?</p>
                  <div style={{ display: "flex", gap: 12 }}>
                    {GRADES.map((g) => {
                      const active = grade === g;
                      return (
                        <button key={g} onClick={() => setGrade(g)} style={{
                          position: "relative", flex: 1, padding: "16px 0", border: "1px solid var(--border-strong)",
                          background: "transparent", borderRadius: "var(--radius-md)", fontFamily: "var(--font-serif)",
                          fontSize: 17, color: "var(--text-body)", cursor: "pointer",
                        }}>
                          <ActiveMark active={active} />
                          <span style={{ position: "relative" }}>{g}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <Button full size="lg" onClick={next}>Continue →</Button>
            </div>
          )}

          {/* Step 1: Current score (split Math / English, both skippable) */}
          {step === 1 && (
            <div>
              <h2 style={{ fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "0 0 40px" }}>Have you taken it before?</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
                <div>
                  <Input
                    label="Math score (200-800)" type="number" placeholder="e.g. 650"
                    value={mathScore} disabled={noMathScore}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setMathScore(e.target.value); setNoMathScore(false); }}
                  />
                  <button onClick={() => { setNoMathScore((v) => !v); setMathScore(""); }} style={{ ...chipStyle(noMathScore), marginTop: 14, fontSize: 13, padding: "9px 16px" }}>
                    <ActiveMark active={noMathScore} />
                    <span style={{ position: "relative" }}>Haven&apos;t taken the Math section</span>
                  </button>
                </div>
                <div>
                  <Input
                    label="Reading & Writing score (200-800)" type="number" placeholder="e.g. 620"
                    value={englishScore} disabled={noEnglishScore}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setEnglishScore(e.target.value); setNoEnglishScore(false); }}
                  />
                  <button onClick={() => { setNoEnglishScore((v) => !v); setEnglishScore(""); }} style={{ ...chipStyle(noEnglishScore), marginTop: 14, fontSize: 13, padding: "9px 16px" }}>
                    <ActiveMark active={noEnglishScore} />
                    <span style={{ position: "relative" }}>Haven&apos;t taken the R&amp;W section</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Target score + test date */}
          {step === 2 && (
            <div>
              <h2 style={{ fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "0 0 40px" }}>Set your target score</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
                <div>
                  <p style={eyebrow}>What score are you aiming for?</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 24 }}>
                    <span style={{ fontWeight: 400, fontSize: 72, lineHeight: 1, color: "var(--text-strong)", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{target}</span>
                    <span style={{ fontSize: 17, color: "var(--text-faint)" }}>/ 1600</span>
                  </div>
                  <input
                    type="range" min={1300} max={1600} step={10} value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--brand)", cursor: "pointer" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                    <span style={{ fontSize: 17, color: "var(--text-faint)" }}>1300</span>
                    <span style={{ fontSize: 17, color: "var(--text-faint)" }}>1600</span>
                  </div>
                </div>
                <Input label="When's test day?" type="date" value={testDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestDate(e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 3: What a day looks like (relocated preview, leads into the diagnostic) */}
          {step === 3 && (
            <div>
              <h2 style={{ fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "0 0 16px" }}>Here&apos;s what a day looks like</h2>
              <p style={{ fontSize: 17, color: "var(--text-muted)", margin: "0 0 32px", lineHeight: 1.62, maxWidth: "46ch" }}>
                Every sitting follows the same shape, so there&apos;s nothing new to figure out once you begin. First, a quick diagnostic — about 48 questions across Math and Reading &amp; Writing — so the plan starts calibrated instead of guessing.
              </p>

              {/* Mini reading-desk mockup — timed, one question at a time */}
              <div style={{ background: "var(--dark-900)", borderRadius: "var(--radius-xl)", padding: 8, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px 10px", fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--text-on-dark-faint)" }}>
                  <span style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Day 4 · English</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>7 / 20</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-on-dark)" }}>18:42</span>
                  </span>
                </div>
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-md)", padding: "16px 18px" }}>
                  <p style={{ fontSize: 14, lineHeight: 1.45, color: "var(--text-strong)", margin: "0 0 12px" }}>
                    Which choice best supports the claim that early field guides favored brevity?
                  </p>
                  <div style={{ display: "grid" }}>
                    {[
                      { l: "A", t: "They cited more authorities than rival volumes." },
                      { l: "B", t: "They omitted nearly everything a rival volume included.", correct: true },
                      { l: "C", t: "They were reprinted more often than competing guides." },
                      { l: "D", t: "They favored technical vocabulary over plain language." },
                    ].map((o) => (
                      <div key={o.l} style={{
                        display: "flex", gap: 10, padding: "8px 9px", borderTop: "1px solid var(--border)",
                        borderLeft: o.correct ? "2px solid var(--success)" : "2px solid transparent",
                        background: o.correct ? "var(--moss-50)" : "transparent", fontSize: 13,
                        color: o.correct ? "var(--text-strong)" : "var(--text-body)",
                      }}>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, color: o.correct ? "var(--success)" : "var(--text-faint)", width: 9, paddingTop: 3 }}>{o.l}</span>
                        <span>{o.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", margin: "0 0 24px" }}>
                Twenty questions a day, timed like the real thing.
              </p>

              {/* Mini insights strip — the plan tracks what you miss */}
              <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 18px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", marginBottom: 12 }}>
                <div style={{ position: "relative", width: 54, height: 54, flexShrink: 0 }}>
                  <svg width={54} height={54} viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx={50} cy={50} r={42} fill="none" stroke="var(--surface-2)" strokeWidth={9} />
                    <circle cx={50} cy={50} r={42} fill="none" stroke="var(--accent)" strokeWidth={9} strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - 0.74)} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--text-strong)" }}>74%</span>
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                  {[{ l: "Command of Evidence", v: 82 }, { l: "Boundaries", v: 58 }].map((s) => (
                    <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-body)", width: 132, flexShrink: 0 }}>{s.l}</span>
                      <div style={{ flex: 1, height: 3, background: "var(--surface-2)" }}>
                        <div style={{ width: `${s.v}%`, height: "100%", background: "var(--text-strong)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", margin: "0 0 24px" }}>
                A sequence built around the skills you miss, with an explanation for every answer, right or wrong.
              </p>
              {saveError && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", margin: "0 0 8px" }}>{saveError}</p>}
            </div>
          )}

          {/* Step 4: Diagnostic interstitial */}
          {step === 4 && (
            <div>
              <h2 style={{ fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "0 0 16px" }}>Ready for the diagnostic?</h2>
              <p style={{ fontSize: 17, color: "var(--text-muted)", margin: "0 0 40px", lineHeight: 1.62, maxWidth: "46ch" }}>
                About 48 questions across Math and Reading &amp; Writing, mixed difficulty. Answer honestly — it just sets your starting point.
              </p>
              {diagnosticError && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", margin: "0 0 20px" }}>{diagnosticError}</p>}
              <Button
                full size="lg" disabled={diagnosticStarting || saving}
                onClick={diagnosticCompleted ? () => setStep(5) : diagnosticSessionId ? resumeDiagnostic : beginDiagnostic}
              >
                {diagnosticStarting ? "Preparing…" : diagnosticCompleted ? "See your results →" : diagnosticSessionId ? "Resume diagnostic →" : "Begin diagnostic →"}
              </Button>
              {!diagnosticCompleted && (
                <div style={{ marginTop: 20, textAlign: "center" }}>
                  <button onClick={skipDiagnostic} disabled={saving} style={{ background: "none", border: "none", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", cursor: "pointer", textDecoration: "underline" }}>
                    {saving ? "Skipping…" : "Skip the diagnostic"}
                  </button>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", margin: "8px 0 0", lineHeight: 1.5 }}>
                    Without it, every skill gets equal time in the plan instead of extra time where you actually need it.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Results + manual override */}
          {step === 5 && (
            <div>
              <h2 style={{ fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "0 0 16px" }}>Here&apos;s where you stand</h2>
              <p style={{ fontSize: 17, color: "var(--text-muted)", margin: "0 0 32px", lineHeight: 1.62, maxWidth: "50ch" }}>
                Reduce or skip anything marked strong — everything else is automatic.
              </p>

              {resultsLoading && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>Scoring your diagnostic…</p>
              )}
              {resultsError && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)" }}>{resultsError}</p>
              )}

              {results && (["english", "math"] as const).map((subject) => (
                <div key={subject} style={{ marginBottom: 28 }}>
                  <p style={eyebrow}>{subject === "english" ? "Reading & Writing" : "Math"}</p>
                  <div style={{ borderTop: "1px solid var(--border)" }}>
                    {results.filter((r) => r.subject === subject).map((r) => (
                      <div key={r.category} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "13px 0", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ fontSize: 15, color: "var(--text-body)" }}>{r.category}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                          <Badge tone={TIER_TONE[r.tier]} size="sm">{r.tier}</Badge>
                          {r.tier === "strong" && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => toggleOverride(r.category, "reduce")} style={miniChipStyle(reduceCategories.includes(r.category))}>
                                {reduceCategories.includes(r.category) ? "Reducing" : "Reduce"}
                              </button>
                              <button onClick={() => toggleOverride(r.category, "skip")} style={miniChipStyle(skipCategories.includes(r.category))}>
                                {skipCategories.includes(r.category) ? "Skipping" : "Skip"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 6: Done */}
          {step === 6 && (
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontWeight: 400, fontSize: 52, lineHeight: 1.06, letterSpacing: "-0.022em", color: "var(--text-strong)", margin: "0 0 16px" }}>
                Day one is loaded{name ? `, ${name}` : ""}.
              </h1>
              <p style={{ fontSize: 17, color: "var(--text-muted)", margin: "0 0 40px", lineHeight: 1.68 }}>
                Here&apos;s what we&apos;ve got so far:
              </p>
              <div style={{ display: "flex", flexDirection: "column", textAlign: "left", marginBottom: 40, borderTop: "1px solid var(--border)" }}>
                {summary.map((s) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 16, color: "var(--text-muted)" }}>{s.label}</span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)" }}>{s.value}</span>
                  </div>
                ))}
              </div>
              {saveError && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", margin: "0 0 20px" }}>{saveError}</p>}
              <Button full size="lg" onClick={finish} disabled={saving}>
                {saving ? "Building your plan…" : "See my 30-day path →"}
              </Button>
              <div style={{ marginTop: 16 }}>
                <button onClick={() => { clearDraft(); setStep(0); }} style={{ background: "none", border: "none", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", cursor: "pointer", textDecoration: "underline" }}>
                  Start over
                </button>
              </div>
            </div>
          )}

          {/* Nav (steps 1–5, except 4 which has its own dedicated action button) */}
          {step >= 1 && step <= 5 && step !== 4 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 44 }}>
              <Button variant="ghost" onClick={back} disabled={saving}>← Back</Button>
              {step === 3 ? (
                <Button onClick={enterDiagnostic} disabled={saving}>{saving ? "Preparing…" : "Continue →"}</Button>
              ) : (
                <Button onClick={next} disabled={step === 5 && (!results || resultsLoading)}>
                  {step === 5 ? "Finish" : "Continue →"}
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
