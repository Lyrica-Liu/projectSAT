"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, SegmentedControl } from "@/components/ui/ds";

const STEPS = [
  { title: "Welcome aboard 🎉", sub: "Let's build your personal path to a higher score — it only takes a minute." },
  { title: "First, the basics 👋", sub: "A couple of details so 800Path feels like yours." },
  { title: "Aim high 🎯", sub: "Your target score shapes every practice set we choose." },
  { title: "Where you're starting 📍", sub: "A starting point just helps us calibrate — no pressure." },
  { title: "Your focus 🧭", sub: "Tell us what matters most and we'll weight your plan." },
  { title: "You're all set 🚀", sub: "Your personalized plan is ready and waiting." },
];

const GRADES = ["9", "10", "11", "12", "Other"];
const GOAL_OPTIONS = ["🎯 A specific score", "📅 Build a study habit", "😌 Beat test anxiety", "⏱️ Get faster", "🧠 Master weak skills"];

const pct = [0, 20, 40, 60, 80, 100];

const panel: React.CSSProperties = {
  position: "relative", flex: "0 0 42%", minWidth: 340, maxWidth: 560,
  overflow: "hidden", display: "flex", flexDirection: "column",
  justifyContent: "space-between", padding: "44px 42px",
  color: "#fff", boxSizing: "border-box",
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
  const [rw, setRw] = useState("Balanced");
  const [goals, setGoals] = useState<string[]>([]);
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

  function next() { setStep((s) => Math.min(5, s + 1)); }
  function back() { setStep((s) => Math.max(0, s - 1)); }
  function toggleGoal(g: string) {
    setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
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
        rw_preference: rw,
        goals,
        onboarding_complete: true,
      },
    });
    router.push("/dashboard");
  }

  const currentStep = STEPS[step];
  const barPct = pct[step];

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--canvas)", fontFamily: "var(--font-sans)", boxSizing: "border-box" }}>

      {/* Left brand panel */}
      <aside style={panel}>
        <span style={{ position: "absolute", inset: 0, background: "var(--gradient-radiant)" }} />
        <span style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
        <span style={{ position: "absolute", bottom: -60, left: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />

        {/* Logo */}
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.22)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17 }}>8</span>
          <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: "var(--tracking-tight)" }}>800Path</span>
        </div>

        {/* Step heading */}
        <div style={{ position: "relative" }}>
          <h2 style={{ fontWeight: 800, fontSize: 34, lineHeight: 1.15, letterSpacing: "var(--tracking-snug)", margin: "0 0 12px" }}>{currentStep.title}</h2>
          <p style={{ fontSize: "var(--text-md)", lineHeight: "var(--leading-relaxed)", opacity: 0.92, margin: 0, maxWidth: 340 }}>{currentStep.sub}</p>
        </div>

        {/* Progress */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", opacity: 0.85 }}>
              {step === 0 ? "Getting started" : step >= 5 ? "Done" : `Step ${step} of 4`}
            </span>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, opacity: 0.85 }}>{barPct}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", borderRadius: 99, background: "#fff", width: `${barPct}%`, transition: "width 0.3s var(--ease-out)" }} />
          </div>
        </div>
      </aside>

      {/* Right main */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "44px 24px", boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: 520, boxSizing: "border-box" }}>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div>
              <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 16 }}>🎉</div>
              <h1 style={{ fontWeight: 800, fontSize: "var(--text-xl)", color: "var(--text-strong)", margin: "0 0 8px", letterSpacing: "var(--tracking-snug)" }}>Welcome to 800Path</h1>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "0 0 28px", lineHeight: "var(--leading-relaxed)" }}>
                A few quick questions and we'll build a practice plan that's genuinely yours. Takes about a minute. 💜
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
                {[
                  ["🧠", "A plan built around your weak spots"],
                  ["📈", "Questions that adapt to your level"],
                  ["⚡", "Real SAT items with instant feedback"],
                ].map(([emoji, text]) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{emoji}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--text-body)" }}>{text}</span>
                  </div>
                ))}
              </div>
              <Button full size="lg" onClick={next}>Let's go →</Button>
            </div>
          )}

          {/* Step 1: About you */}
          {step === 1 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--text-strong)", margin: "0 0 28px" }}>First, the basics 👋</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <Input label="What's your first name?" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Maya" />
                <div>
                  <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-body)", margin: "0 0 10px" }}>What grade are you in?</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {GRADES.map((g) => (
                      <button
                        key={g}
                        onClick={() => setGrade(g)}
                        style={{
                          flex: 1, padding: "11px 0", border: `1.5px solid ${grade === g ? "var(--brand)" : "var(--border)"}`,
                          background: grade === g ? "var(--brand-soft)" : "var(--surface)",
                          borderRadius: "var(--radius-md)", fontFamily: "inherit",
                          fontSize: "var(--text-sm)", fontWeight: 700,
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
              <h2 style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--text-strong)", margin: "0 0 28px" }}>Aim high 🎯</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
                <div>
                  <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-body)", margin: "0 0 20px" }}>What score are you aiming for?</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 18 }}>
                    <span style={{ fontWeight: 800, fontSize: 48, lineHeight: 1, color: "var(--brand-ink)", fontFamily: "var(--font-mono)", letterSpacing: -1 }}>{target}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--text-faint)" }}>/ 1600</span>
                  </div>
                  <input
                    type="range" min={1300} max={1600} step={10} value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--brand)", cursor: "pointer" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>1300</span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>1600</span>
                  </div>
                </div>
                <Input label="When's test day?" type="date" value={testDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestDate(e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 3: Baseline */}
          {step === 3 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--text-strong)", margin: "0 0 28px" }}>Where you're starting 📍</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Input
                  label="What did you last score? A guess is totally fine."
                  type="number" placeholder="e.g. 1080"
                  value={baseline}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setBaseline(e.target.value); setNoScore(false); }}
                  disabled={noScore}
                />
                <button
                  onClick={() => { setNoScore((v) => !v); setBaseline(""); }}
                  style={{
                    position: "relative", alignSelf: "flex-start", padding: "9px 15px",
                    border: `1.5px solid ${noScore ? "var(--brand)" : "var(--border)"}`,
                    background: noScore ? "var(--brand-soft)" : "var(--surface)",
                    borderRadius: "var(--radius-pill)", fontFamily: "inherit",
                    fontSize: "var(--text-sm)", fontWeight: 600,
                    color: noScore ? "var(--brand-ink)" : "var(--text-body)", cursor: "pointer",
                    boxShadow: noScore ? "0 0 0 3px var(--focus-ring)" : "none",
                    transition: "all var(--dur-base) var(--ease-out)",
                  }}
                >
                  🤷 I haven't taken one yet
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Focus */}
          {step === 4 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--text-strong)", margin: "0 0 28px" }}>Your focus 🧭</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <div>
                  <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-body)", margin: "0 0 10px" }}>Which do you want to lean toward?</p>
                  <SegmentedControl options={["Reading", "Balanced", "Writing"]} value={rw} onChange={setRw} />
                </div>
                <div>
                  <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-body)", margin: "0 0 12px" }}>
                    What are you here for? <span style={{ color: "var(--text-faint)", fontWeight: 500 }}>(pick any)</span>
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                    {GOAL_OPTIONS.map((g) => {
                      const active = goals.includes(g);
                      return (
                        <button
                          key={g}
                          onClick={() => toggleGoal(g)}
                          style={{
                            padding: "9px 14px", border: `1.5px solid ${active ? "var(--brand)" : "var(--border)"}`,
                            background: active ? "var(--brand-soft)" : "var(--surface)",
                            borderRadius: "var(--radius-pill)", fontFamily: "inherit",
                            fontSize: "var(--text-sm)", fontWeight: 600,
                            color: active ? "var(--brand-ink)" : "var(--text-body)", cursor: "pointer",
                            boxShadow: active ? "0 0 0 3px var(--focus-ring)" : "none",
                            transition: "all var(--dur-base) var(--ease-out)",
                          }}
                        >{g}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Done */}
          {step === 5 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 14 }}>🚀</div>
              <h1 style={{ fontWeight: 800, fontSize: "var(--text-xl)", color: "var(--text-strong)", margin: "0 0 8px", letterSpacing: "var(--tracking-snug)" }}>
                You're all set{name ? `, ${name}` : ""}!
              </h1>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "0 0 28px", lineHeight: "var(--leading-relaxed)" }}>
                Your personalized plan is ready. Here's where we'll start you:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left", marginBottom: 32 }}>
                {[
                  { emoji: "🎯", label: "Target score", value: String(target) },
                  { emoji: "📅", label: "Test day", value: testDate || "Not set" },
                  { emoji: "🧭", label: "Focus", value: rw },
                ].map((s) => (
                  <div key={s.label} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                    background: "var(--surface-sunken)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)", padding: "13px 16px",
                  }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                      <span style={{ fontSize: 17 }}>{s.emoji}</span>{s.label}
                    </span>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-strong)" }}>{s.value}</span>
                  </div>
                ))}
              </div>
              <Button full size="lg" onClick={finish} disabled={saving}>
                {saving ? "Saving…" : "Go to my dashboard →"}
              </Button>
              <div style={{ marginTop: 12 }}>
                <button onClick={() => setStep(0)} style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: "var(--text-xs)", color: "var(--text-faint)", cursor: "pointer", textDecoration: "underline" }}>
                  Start over
                </button>
              </div>
            </div>
          )}

          {/* Nav (steps 1–4) */}
          {step >= 1 && step <= 4 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 36 }}>
              <Button variant="ghost" onClick={back}>← Back</Button>
              <Button onClick={next}>{step === 4 ? "Finish 🎉" : "Continue →"}</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
