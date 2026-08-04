"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppNav, LoadingScreen } from "@/components/ui/nav";
import { Card, Input, Button, Avatar, SegmentedControl } from "@/components/ui/ds";

const GRADES = ["9", "10", "11", "12", "Other"];
const GOAL_OPTIONS = ["A specific score", "Build a study habit", "Beat test anxiety", "Get faster", "Master weak skills"];

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: 700,
  letterSpacing: "var(--tracking-caps)", textTransform: "uppercase",
  color: "var(--text-faint)", margin: "0 0 8px", display: "block",
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    position: "relative", padding: "9px 14px",
    border: `1.5px solid ${active ? "var(--brand)" : "var(--border)"}`,
    background: active ? "var(--brand-soft)" : "var(--surface)",
    borderRadius: "var(--radius-pill)", fontFamily: "inherit",
    fontSize: "var(--text-sm)", fontWeight: 600,
    color: active ? "var(--brand-ink)" : "var(--text-body)", cursor: "pointer",
    boxShadow: active ? "0 0 0 3px var(--focus-ring)" : "none",
    transition: "all var(--dur-base) var(--ease-out)",
  };
}

interface FormState {
  displayName: string;
  email: string;
  grade: string;
  currentScore: number;
  noScore: boolean;
  targetScore: number;
  testDate: string;
  rw: string;
  goals: string[];
}

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());
  const [form, setForm] = useState<FormState | null>(null);
  const [saved, setSaved] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [redoingOnboarding, setRedoingOnboarding] = useState(false);
  const [redoError, setRedoError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }

      const meta = user.user_metadata ?? {};
      const initial: FormState = {
        displayName: meta.display_name ?? meta.full_name ?? "",
        email: user.email ?? "",
        grade: meta.grade ?? "11",
        currentScore: typeof meta.baseline_score === "number" ? meta.baseline_score : Number(meta.baseline_score) || 1080,
        noScore: meta.baseline_score == null,
        targetScore: meta.target_score ?? 1400,
        testDate: meta.test_date ?? "",
        rw: meta.rw_preference ?? "Balanced",
        goals: Array.isArray(meta.goals) ? meta.goals : [],
      };
      setForm(initial);
      setSaved(initial);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set(patch: Partial<FormState>) {
    setForm((prev) => prev ? { ...prev, ...patch } : prev);
    setJustSaved(false);
  }

  function toggleGoal(g: string) {
    if (!form) return;
    set({ goals: form.goals.includes(g) ? form.goals.filter((x) => x !== g) : [...form.goals, g] });
  }

  const dirty = !!form && !!saved && JSON.stringify(form) !== JSON.stringify(saved);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError(null);
     
    const payload: any = {
      data: {
        display_name: form.displayName,
        grade: form.grade,
        target_score: form.targetScore,
        baseline_score: form.noScore ? null : form.currentScore,
        test_date: form.testDate || null,
        rw_preference: form.rw,
        goals: form.goals,
      },
    };
    if (form.email !== saved?.email) payload.email = form.email;

    const { error: updateErr } = await supabase.auth.updateUser(payload);
    setSaving(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    setSaved(form);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
  }

  function handleDiscard() {
    setForm(saved);
    setJustSaved(false);
  }

  async function redoOnboarding() {
    setRedoingOnboarding(true);
    setRedoError(null);
    const { error: updateErr } = await supabase.auth.updateUser({ data: { onboarding_complete: false } });
    if (updateErr) {
      setRedoError(updateErr.message);
      setRedoingOnboarding(false);
      return;
    }
    router.push("/onboarding");
  }

  if (loading || !form) return <LoadingScreen message="Loading account…" />;

  const gap = form.targetScore - form.currentScore;
  const gapLabel = form.noScore
    ? "Set a current score to see your climb"
    : gap > 0 ? `+${gap} points to your goal` : "You've hit your target! 🎉";

  let daysLabel = "No test date set";
  if (form.testDate) {
    const d = Math.ceil((new Date(form.testDate).getTime() - now) / 86400000);
    daysLabel = d > 0 ? `${d} days to test day` : "Test day has passed";
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", zoom: 1.15 }}>
      <AppNav />

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 96px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500,
            fontSize: "var(--text-2xl)", color: "var(--text-strong)", margin: 0, letterSpacing: "var(--tracking-snug)",
          }}>
            Account center
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "6px 0 0" }}>
            Update your details and tune the answers that shape your plan.
          </p>
        </div>

        {/* Profile header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 18, background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-2xl)", boxShadow: "var(--shadow-sm)", padding: "22px 26px", marginBottom: 22,
        }}>
          <Avatar name={form.displayName || form.email} size={60} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--text-strong)", margin: 0 }}>{form.displayName || "Your name"}</p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "2px 0 0" }}>{form.email} · Grade {form.grade}</p>
          </div>
          <span style={{
            fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--brand-ink)",
            background: "var(--brand-soft)", borderRadius: "var(--radius-pill)", padding: "8px 14px", whiteSpace: "nowrap", flexShrink: 0,
          }}>{daysLabel}</span>
        </div>

        {/* Account info */}
        <Card tone="surface" padding="lg" radius="2xl" shadow="sm" style={{ marginBottom: 20 }}>
          <span style={eyebrow}>Account info</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 4 }}>
            <Input
              label="Display name"
              placeholder="Maya"
              value={form.displayName}
               
              onChange={(e: any) => set({ displayName: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@email.com"
              value={form.email}
               
              onChange={(e: any) => set({ email: e.target.value })}
            />
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-body)", margin: "0 0 9px" }}>Grade level</p>
              <div style={{ display: "flex", gap: 8 }}>
                {GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => set({ grade: g })}
                    style={{
                      flex: 1, padding: "11px 0", border: `1.5px solid ${form.grade === g ? "var(--brand)" : "var(--border)"}`,
                      background: form.grade === g ? "var(--brand-soft)" : "var(--surface)",
                      borderRadius: "var(--radius-md)", fontFamily: "inherit",
                      fontSize: "var(--text-sm)", fontWeight: 700,
                      color: form.grade === g ? "var(--brand-ink)" : "var(--text-body)", cursor: "pointer",
                      boxShadow: form.grade === g ? "0 0 0 3px var(--focus-ring)" : "none",
                      transition: "all var(--dur-base) var(--ease-out)",
                    }}
                  >{g}</button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Scores */}
        <Card tone="surface" padding="lg" radius="2xl" shadow="sm" style={{ marginBottom: 20 }}>
          <span style={eyebrow}>Scores</span>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: "0 0 20px" }}>
            Your current score calibrates difficulty; your target guides which sets we pick.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-body)" }}>Current score</span>
                <span style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--text-strong)", fontFamily: "var(--font-mono)" }}>
                  {form.noScore ? "Not set" : form.currentScore}
                </span>
              </div>
              <input
                type="range" min={400} max={1600} step={10} value={form.currentScore}
                onChange={(e) => set({ currentScore: Number(e.target.value), noScore: false })}
                style={{ width: "100%", accentColor: "var(--brand)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>400</span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>1600</span>
              </div>
              <button onClick={() => set({ noScore: !form.noScore })} style={{ ...chipStyle(form.noScore), marginTop: 12 }}>
                🤷 Haven&apos;t tested yet
              </button>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-body)" }}>Target score</span>
                <span style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--brand-ink)", fontFamily: "var(--font-mono)" }}>{form.targetScore}</span>
              </div>
              <input
                type="range" min={1000} max={1600} step={10} value={form.targetScore}
                onChange={(e) => set({ targetScore: Number(e.target.value) })}
                style={{ width: "100%", accentColor: "var(--brand)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>1000</span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>1600</span>
              </div>
              <div style={{
                marginTop: 12, display: "inline-flex", alignItems: "center", gap: 7,
                background: "var(--surface-sunken)", borderRadius: "var(--radius-pill)", padding: "7px 13px",
              }}>
                <span style={{ fontSize: 15 }}>📈</span>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)" }}>{gapLabel}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Plan preferences */}
        <Card tone="surface" padding="lg" radius="2xl" shadow="sm" style={{ marginBottom: 20 }}>
          <span style={eyebrow}>Plan preferences</span>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: "0 0 20px" }}>
            The answers from your setup — change them anytime.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "end" }}>
              <Input
                label="When's test day?"
                type="date"
                value={form.testDate}
                 
                onChange={(e: any) => set({ testDate: e.target.value })}
              />
              <div>
                <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-body)", margin: "0 0 9px" }}>Reading vs. Writing focus</p>
                <SegmentedControl options={["Reading", "Balanced", "Writing"]} value={form.rw} onChange={(v: string) => set({ rw: v })} />
              </div>
            </div>
            <div>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-body)", margin: "0 0 10px" }}>
                What are you here for? <span style={{ color: "var(--text-faint)", fontWeight: 500 }}>(pick any)</span>
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                {GOAL_OPTIONS.map((g) => (
                  <button key={g} onClick={() => toggleGoal(g)} style={chipStyle(form.goals.includes(g))}>{g}</button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Redo onboarding */}
        <Card tone="surface" padding="lg" radius="2xl" shadow="sm">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-md)", color: "var(--text-strong)", margin: "0 0 4px" }}>
                Redo onboarding
              </h2>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: 0, lineHeight: "var(--leading-relaxed)" }}>
                Retake the welcome questions — target score, starting point, and focus areas — to recalibrate your plan.
              </p>
            </div>
            {redoError && (
              <p style={{ fontSize: "var(--text-sm)", color: "var(--danger)", margin: 0 }}>{redoError}</p>
            )}
            <Button variant="secondary" onClick={redoOnboarding} disabled={redoingOnboarding}>
              {redoingOnboarding ? "Loading…" : "Redo onboarding"}
            </Button>
          </div>
        </Card>
      </main>

      {/* Sticky save bar */}
      {dirty && (
        <div style={{
          position: "sticky", bottom: 0, zIndex: 20, background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(10px)", borderTop: "1px solid var(--border)",
        }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--peach-ink)" }} />
              You have unsaved changes
              {error && <span style={{ color: "var(--danger)" }}>· {error}</span>}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="ghost" onClick={handleDiscard} disabled={saving}>Discard</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Saved toast */}
      {justSaved && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 30,
          display: "inline-flex", alignItems: "center", gap: 9, background: "var(--text-strong)", color: "#fff",
          borderRadius: "var(--radius-pill)", padding: "11px 20px", boxShadow: "var(--shadow-lg)",
          fontSize: "var(--text-sm)", fontWeight: 600,
        }}>
          <span>✅</span> Changes saved
        </div>
      )}
    </div>
  );
}
