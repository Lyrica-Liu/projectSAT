"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui/ds";

/** Content text throughout this page is scaled 1.3x over the base type scale for readability. */
const SCALE = 1.3;
const T = {
  xs: `${12 * SCALE}px`,
  sm: `${14 * SCALE}px`,
  base: `${16 * SCALE}px`,
  md: `${18 * SCALE}px`,
  lg: `${22 * SCALE}px`,
  xl: `${28 * SCALE}px`,
  "2xl": `${36 * SCALE}px`,
  "3xl": `${48 * SCALE}px`,
};

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
  "😵‍💫 Low attention span", "❓ Not knowing what to study", "⏳ Running out of time",
  "😰 Test anxiety", "🔁 Forgetting what I learned", "🥱 Losing motivation",
];

const LAST_STEP = 6;
const PCT_BY_STEP = [0, 17, 33, 50, 67, 83, 100];

const panel: React.CSSProperties = {
  position: "relative", flex: "0 0 42%", minWidth: 340, maxWidth: 560,
  overflow: "hidden", display: "flex", flexDirection: "column",
  justifyContent: "space-between", padding: "var(--space-12) var(--space-10)",
  color: "#fff", boxSizing: "border-box",
};

const card: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-2xl)", boxShadow: "var(--shadow-lg)",
  padding: "var(--space-16) var(--space-12)", boxSizing: "border-box",
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    position: "relative", padding: "13px 17px",
    border: `1.5px solid ${active ? "var(--brand)" : "var(--border)"}`,
    background: active ? "var(--brand-soft)" : "var(--surface)",
    borderRadius: "var(--radius-pill)", fontFamily: "inherit",
    fontSize: T.md, fontWeight: 600,
    color: active ? "var(--brand-ink)" : "var(--text-body)", cursor: "pointer",
    boxShadow: active ? "0 0 0 3px var(--focus-ring)" : "none",
    transition: "all var(--dur-base) var(--ease-out)",
  };
}

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
    { emoji: "🗓️", label: "30-day plan", value: startDate ? `Day 1 · ${startDate}` : "20 English · 10 Math" },
    { emoji: "🎯", label: "Target score", value: String(target) },
    { emoji: "📊", label: "Current score", value: noScore ? "Not taken yet" : (baseline || "Not set") },
    { emoji: "📅", label: "Test day", value: testDate || "Not set" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--canvas)", fontFamily: "var(--font-sans)", boxSizing: "border-box" }}>
      {/* Bumps text size inside the shared Input component, which doesn't expose a size prop */}
      <style>{`
        .ob-input label, .ob-input input { font-size: ${T.md} !important; }
      `}</style>

      {/* Left brand panel */}
      <aside style={panel}>
        <span style={{ position: "absolute", inset: 0, background: "var(--dark-900)" }} />
        <span style={{ position: "absolute", top: -120, right: -100, width: 340, height: 340, borderRadius: "50%", background: "var(--gradient-radiant-soft)", opacity: 0.16, filter: "blur(6px)" }} />
        <span style={{ position: "absolute", bottom: -80, left: -60, width: 220, height: 220, borderRadius: "50%", background: "var(--gradient-radiant-soft)", opacity: 0.1, filter: "blur(6px)" }} />

        {/* Logo */}
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17, color: "var(--text-on-dark)" }}>8</span>
          <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: "var(--tracking-tight)", color: "var(--text-on-dark)" }}>800Path</span>
        </div>

        {/* Step heading */}
        <div style={{ position: "relative" }}>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500,
            fontSize: T["3xl"], lineHeight: 1.1, letterSpacing: "var(--tracking-snug)", margin: "0 0 var(--space-3)", color: "var(--text-on-dark)",
          }}>{currentStep.title}</h2>
          <p style={{ fontSize: T.md, lineHeight: "var(--leading-relaxed)", color: "var(--text-on-dark-muted)", margin: 0, maxWidth: 360 }}>{currentStep.sub}</p>
        </div>

        {/* Progress */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
            <span style={{ fontSize: T.xs, fontWeight: 700, letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--text-on-dark-faint)" }}>
              {stepLabel}
            </span>
            <span style={{ fontSize: T.xs, fontWeight: 700, color: "var(--gold-400)" }}>{barPct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", borderRadius: 99, background: "linear-gradient(90deg, var(--gold-400), var(--gold-500))", width: `${barPct}%`, transition: "width 0.3s var(--ease-out)" }} />
          </div>
        </div>
      </aside>

      {/* Right main */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-16) var(--space-8)", boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: 640, boxSizing: "border-box", ...card }}>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div>
              <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 20 }}>🎉</div>
              <h1 style={{
                fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500,
                fontSize: T["3xl"], color: "var(--text-strong)", margin: "0 0 12px", letterSpacing: "var(--tracking-snug)",
              }}>Welcome to 800Path</h1>
              <p style={{ fontSize: T.md, color: "var(--text-muted)", margin: "0 0 36px", lineHeight: "var(--leading-relaxed)" }}>
                A few quick questions and we&apos;ll build a practice plan that&apos;s genuinely yours. Takes about a minute. 💜
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 40 }}>
                {[
                  ["🧠", "A plan built around your weak spots"],
                  ["📈", "Questions that adapt to your level"],
                  ["⚡", "Real SAT items with instant feedback"],
                ].map(([emoji, text]) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 26 }}>{emoji}</span>
                    <span style={{ fontSize: T.md, color: "var(--text-body)" }}>{text}</span>
                  </div>
                ))}
              </div>
              <Button full size="lg" onClick={next}>Let&apos;s go →</Button>
            </div>
          )}

          {/* Step 1: About you */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: T["2xl"], color: "var(--text-strong)", margin: "0 0 36px" }}>First, the basics</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
                <div className="ob-input">
                  <Input label="What's your first name?" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Maya" />
                </div>
                <div>
                  <p style={{ fontSize: T.md, fontWeight: 600, color: "var(--text-body)", margin: "0 0 14px" }}>What grade are you in?</p>
                  <div style={{ display: "flex", gap: 10 }}>
                    {GRADES.map((g) => (
                      <button
                        key={g}
                        onClick={() => setGrade(g)}
                        style={{
                          flex: 1, padding: "13px 0", border: `1.5px solid ${grade === g ? "var(--brand)" : "var(--border)"}`,
                          background: grade === g ? "var(--brand-soft)" : "var(--surface)",
                          borderRadius: "var(--radius-md)", fontFamily: "inherit",
                          fontSize: T.md, fontWeight: 700,
                          color: grade === g ? "var(--brand-ink)" : "var(--text-body)", cursor: "pointer",
                          boxShadow: grade === g ? "0 0 0 3px var(--focus-ring)" : "none",
                          transition: "all var(--dur-base) var(--ease-out)",
                        }}
                      >{g}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Target score + test date */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: T["2xl"], color: "var(--text-strong)", margin: "0 0 36px" }}>Aim high</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
                <div>
                  <p style={{ fontSize: T.md, fontWeight: 600, color: "var(--text-body)", margin: "0 0 24px" }}>What score are you aiming for?</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 22 }}>
                    <span style={{ fontWeight: 800, fontSize: 62, lineHeight: 1, color: "var(--brand-ink)", fontFamily: "var(--font-mono)", letterSpacing: -1 }}>{target}</span>
                    <span style={{ fontSize: T.md, color: "var(--text-faint)" }}>/ 1600</span>
                  </div>
                  <input
                    type="range" min={1300} max={1600} step={10} value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--brand)", cursor: "pointer" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                    <span style={{ fontSize: T.sm, color: "var(--text-faint)" }}>1300</span>
                    <span style={{ fontSize: T.sm, color: "var(--text-faint)" }}>1600</span>
                  </div>
                </div>
                <div className="ob-input">
                  <Input label="When's test day?" type="date" value={testDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestDate(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Baseline */}
          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: T["2xl"], color: "var(--text-strong)", margin: "0 0 36px" }}>Where you&apos;re starting</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div className="ob-input">
                  <Input
                    label="What's your current score? A guess is totally fine."
                    type="number" placeholder="e.g. 1080"
                    value={baseline}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setBaseline(e.target.value); setNoScore(false); }}
                    disabled={noScore}
                  />
                </div>
                <button
                  onClick={() => { setNoScore((v) => !v); setBaseline(""); }}
                  style={chipStyle(noScore)}
                >
                  🤷 I haven&apos;t taken one yet
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Struggles */}
          {step === 4 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: T["2xl"], color: "var(--text-strong)", margin: "0 0 36px" }}>What&apos;s getting in the way?</h2>
              <div>
                <p style={{ fontSize: T.md, fontWeight: 600, color: "var(--text-body)", margin: "0 0 16px" }}>
                  What&apos;s something that bothers you while studying? <span style={{ color: "var(--text-faint)", fontWeight: 500 }}>(pick any)</span>
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {STRUGGLE_OPTIONS.map((s) => (
                    <button key={s} onClick={() => toggle(struggles, setStruggles, s)} style={chipStyle(struggles.includes(s))}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Your 30-day plan */}
          {step === 5 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: T["2xl"], color: "var(--text-strong)", margin: "0 0 36px" }}>Your 30-day plan</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
                <div className="ob-input">
                  <Input label="When does Day 1 begin?" type="date" value={startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <p style={{ fontSize: T.md, fontWeight: 600, color: "var(--text-body)", margin: "0 0 16px" }}>Your rhythm — two English days, one Math day, repeating:</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    {planPreview.map((isMath, i) => (
                      <span key={i} style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 46, height: 46, borderRadius: "var(--radius-md)", fontWeight: 800, fontSize: T.md,
                        background: isMath ? "var(--peach-surface)" : "var(--mint-surface)",
                        color: isMath ? "var(--peach-ink)" : "var(--mint-ink)",
                      }}>{isMath ? "M" : "E"}</span>
                    ))}
                    <span style={{ fontSize: T.md, color: "var(--text-faint)", paddingLeft: 10 }}>… to Day 30</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, background: "var(--surface-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 22 }}>
                  <p style={{ fontSize: T.sm, color: "var(--text-body)", margin: 0 }}>📖 <strong>20 English days, 10 Math days</strong> — each a warm-up plus a short timed module.</p>
                  <p style={{ fontSize: T.sm, color: "var(--text-body)", margin: 0 }}>🔒 Days open <strong>one at a time, in order</strong> — one day per day, no cramming ahead.</p>
                  <p style={{ fontSize: T.sm, color: "var(--text-body)", margin: 0 }}>🌿 Life happens: <strong>one grace day per week</strong> keeps a missed day from breaking your streak.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Done */}
          {step === 6 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 18 }}>🚀</div>
              <h1 style={{
                fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500,
                fontSize: T["3xl"], color: "var(--text-strong)", margin: "0 0 12px", letterSpacing: "var(--tracking-snug)",
              }}>
                You&apos;re all set{name ? `, ${name}` : ""}!
              </h1>
              <p style={{ fontSize: T.md, color: "var(--text-muted)", margin: "0 0 36px", lineHeight: "var(--leading-relaxed)" }}>
                Your 30-day path is built and Day 1 is waiting. Here&apos;s the shape of it:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "left", marginBottom: 40 }}>
                {summary.map((s) => (
                  <div key={s.label} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
                    background: "var(--surface-sunken)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)", padding: "17px 20px",
                  }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 12, fontSize: T.md, color: "var(--text-muted)" }}>
                      <span style={{ fontSize: 20 }}>{s.emoji}</span>{s.label}
                    </span>
                    <span style={{ fontSize: T.md, fontWeight: 700, color: "var(--text-strong)" }}>{s.value}</span>
                  </div>
                ))}
              </div>
              <Button full size="lg" onClick={finish} disabled={saving}>
                {saving ? "Saving…" : "See my 30-day path →"}
              </Button>
              <div style={{ marginTop: 16 }}>
                <button onClick={() => setStep(0)} style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: T.xs, color: "var(--text-faint)", cursor: "pointer", textDecoration: "underline" }}>
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
