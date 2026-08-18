"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui/ds";
import { Wordmark } from "@/components/ui/nav";

const STEPS = [
  { title: "Welcome aboard", sub: "Let's build your personal path to a higher score — it only takes a minute." },
  { title: "First, the basics", sub: "A couple of details so 800Path feels like yours." },
  { title: "Aim high", sub: "Your target score shapes every practice set we choose." },
  { title: "Where you're starting", sub: "A starting point just helps us calibrate — no pressure." },
  { title: "What's getting in the way?", sub: "Knowing your struggles helps us shape a plan that actually sticks." },
  { title: "Your 30-day plan", sub: "Twenty days of English, ten of Math — one steady day at a time." },
  { title: "You're all set", sub: "Your 30-day path is built and Day 1 is waiting." },
];

const GRADES = ["9", "10", "11", "12", "Other"];
const STRUGGLE_OPTIONS = [
  "Low attention span", "Not knowing what to study", "Running out of time",
  "Test anxiety", "Forgetting what I learned", "Losing motivation",
];

const LAST_STEP = 6;
const PCT_BY_STEP = [0, 17, 33, 50, 67, 83, 100];

function chipStyle(active: boolean): React.CSSProperties {
  return {
    position: "relative", padding: "14px 20px",
    border: `1px solid ${active ? "var(--text-strong)" : "var(--border-strong)"}`,
    background: "transparent", borderRadius: "var(--radius-md)", fontFamily: "var(--font-serif)",
    fontSize: 17, color: "var(--text-body)", cursor: "pointer",
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

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("11");
  const [target, setTarget] = useState(1450);
  const [testDate, setTestDate] = useState("");
  const [baseline, setBaseline] = useState("");
  const [noScore, setNoScore] = useState(false);
  const [struggles, setStruggles] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function guard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }
      if (user.user_metadata?.onboarding_complete) { router.replace("/dashboard"); }
    }
    guard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function next() { setStep((s) => Math.min(LAST_STEP, s + 1)); }
  function back() { setStep((s) => Math.max(0, s - 1)); }
  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  async function finish() {
    setSaving(true);
    await supabase.auth.updateUser({
      data: {
        display_name: name || undefined,
        grade,
        target_score: target,
        test_date: testDate || null,
        baseline_score: noScore ? null : (baseline || null),
        struggles,
        plan_start_date: startDate || null,
        onboarding_complete: true,
      },
    });
    router.push("/plan");
  }

  const currentStep = STEPS[step];
  const barPct = PCT_BY_STEP[step];
  const stepLabel = step === 0 ? "Getting started" : step >= 1 && step <= 5 ? `Step ${step} of 5` : "Done";

  const planPreview = Array.from({ length: 9 }, (_, i) => (i + 1) % 3 === 0);

  const summary = [
    { label: "30-day plan", value: startDate ? `Day 1 · ${startDate}` : "20 English · 10 Math" },
    { label: "Target score", value: String(target) },
    { label: "Current score", value: noScore ? "Not taken yet" : (baseline || "Not set") },
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
        <div style={{ position: "relative", display: "inline-flex" }}>
          <Wordmark dark />
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

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div>
              <h1 style={{ fontWeight: 400, fontSize: 50, lineHeight: 1.04, letterSpacing: "-0.026em", color: "var(--text-strong)", margin: "0 0 16px" }}>Welcome to 800Path</h1>
              <p style={{ fontSize: 17, color: "var(--text-muted)", margin: "0 0 40px", lineHeight: 1.62, maxWidth: "46ch" }}>
                Seven short questions, about a minute of your time, and your thirty days are set.
              </p>
              <div style={{ display: "flex", flexDirection: "column", marginBottom: 40, borderTop: "1px solid var(--border)" }}>
                {[
                  "A sequence built around the skills you miss",
                  "Twelve questions a day, timed like the test",
                  "An explanation for every answer, right or wrong",
                ].map((text) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 17, color: "var(--text-body)" }}>{text}</span>
                  </div>
                ))}
              </div>
              <Button full size="lg" onClick={next}>Begin</Button>
            </div>
          )}

          {/* Step 1: About you */}
          {step === 1 && (
            <div>
              <h2 style={{ fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "0 0 40px" }}>First, the basics</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
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
            </div>
          )}

          {/* Step 2: Target score + test date */}
          {step === 2 && (
            <div>
              <h2 style={{ fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "0 0 40px" }}>Aim high</h2>
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

          {/* Step 3: Baseline */}
          {step === 3 && (
            <div>
              <h2 style={{ fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "0 0 40px" }}>Where you&apos;re starting</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <Input
                  label="What's your current score? A guess is totally fine."
                  type="number" placeholder="e.g. 1080"
                  value={baseline}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setBaseline(e.target.value); setNoScore(false); }}
                  disabled={noScore}
                />
                <button onClick={() => { setNoScore((v) => !v); setBaseline(""); }} style={{ ...chipStyle(noScore), alignSelf: "flex-start" }}>
                  <ActiveMark active={noScore} />
                  <span style={{ position: "relative" }}>I haven&apos;t taken one yet</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Struggles */}
          {step === 4 && (
            <div>
              <h2 style={{ fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "0 0 40px" }}>What&apos;s getting in the way?</h2>
              <div>
                <p style={eyebrow}>
                  What&apos;s something that bothers you while studying? <span style={{ color: "var(--text-faint)" }}>(pick any)</span>
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {STRUGGLE_OPTIONS.map((s) => {
                    const active = struggles.includes(s);
                    return (
                      <button key={s} onClick={() => toggle(struggles, setStruggles, s)} style={chipStyle(active)}>
                        <ActiveMark active={active} />
                        <span style={{ position: "relative" }}>{s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Your 30-day plan */}
          {step === 5 && (
            <div>
              <h2 style={{ fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "0 0 40px" }}>Your 30-day plan</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                <Input label="When does Day 1 begin?" type="date" value={startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} />
                <div>
                  <p style={eyebrow}>Your rhythm — two English days, one Math day, repeating:</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {planPreview.map((isMath, i) => (
                      <span key={i} style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 42, height: 42, borderRadius: "var(--radius-sm)", fontFamily: "var(--font-sans)", fontSize: 12,
                        border: `1px solid ${isMath ? "var(--text-strong)" : "var(--border-strong)"}`,
                        background: isMath ? "var(--text-strong)" : "transparent",
                        color: isMath ? "var(--canvas)" : "var(--text-muted)",
                      }}>{isMath ? "M" : "E"}</span>
                    ))}
                    <span style={{ fontSize: 17, color: "var(--text-faint)", paddingLeft: 8 }}>… to Day 30</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 16, color: "var(--text-body)", margin: 0, padding: "14px 0", borderBottom: "1px solid var(--border)" }}><strong>20 English days, 10 Math days</strong> — each a warm-up plus a short timed module.</p>
                  <p style={{ fontSize: 16, color: "var(--text-body)", margin: 0, padding: "14px 0", borderBottom: "1px solid var(--border)" }}>Days open <strong>one at a time, in order</strong> — one day per day, no cramming ahead.</p>
                  <p style={{ fontSize: 16, color: "var(--text-body)", margin: 0, padding: "14px 0", borderBottom: "1px solid var(--border)" }}>Life happens — <strong>one grace day per week</strong> keeps a missed day from breaking your streak.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Done */}
          {step === 6 && (
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontWeight: 400, fontSize: 52, lineHeight: 1.06, letterSpacing: "-0.022em", color: "var(--text-strong)", margin: "0 0 16px" }}>
                You&apos;re all set{name ? `, ${name}` : ""}!
              </h1>
              <p style={{ fontSize: 17, color: "var(--text-muted)", margin: "0 0 40px", lineHeight: 1.68 }}>
                Your 30-day path is built and Day 1 is waiting. Here&apos;s the shape of it:
              </p>
              <div style={{ display: "flex", flexDirection: "column", textAlign: "left", marginBottom: 40, borderTop: "1px solid var(--border)" }}>
                {summary.map((s) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 16, color: "var(--text-muted)" }}>{s.label}</span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)" }}>{s.value}</span>
                  </div>
                ))}
              </div>
              <Button full size="lg" onClick={finish} disabled={saving}>
                {saving ? "Saving…" : "See my 30-day path →"}
              </Button>
              <div style={{ marginTop: 16 }}>
                <button onClick={() => setStep(0)} style={{ background: "none", border: "none", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", cursor: "pointer", textDecoration: "underline" }}>
                  Start over
                </button>
              </div>
            </div>
          )}

          {/* Nav (steps 1–5) */}
          {step >= 1 && step <= 5 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 44 }}>
              <Button variant="ghost" onClick={back}>← Back</Button>
              <Button onClick={next}>{step === 5 ? "Finish" : "Continue →"}</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
