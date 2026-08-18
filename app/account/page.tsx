"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar, LoadingScreen, SIDEBAR_WIDTH } from "@/components/ui/nav";
import { Input, Button, Avatar, SegmentedControl } from "@/components/ui/ds";
import { Icon } from "@/components/ui/icon";

const GRADES = ["9", "10", "11", "12", "Other"];
const GOAL_OPTIONS = ["A specific score", "Build a study habit", "Beat test anxiety", "Get faster", "Master weak skills"];

const sectionLabel: React.CSSProperties = {
  fontWeight: 400, fontSize: 21, letterSpacing: "-0.016em", color: "var(--text-strong)", margin: 0,
};

function SectionHeading({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
        <Icon name={icon} size={15} />
      </span>
      <h2 style={sectionLabel}>{children}</h2>
    </div>
  );
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    position: "relative", padding: "9px 14px",
    border: `1px solid ${active ? "var(--text-strong)" : "var(--border-strong)"}`,
    background: "transparent", borderRadius: "var(--radius-md)", fontFamily: "var(--font-serif)",
    fontSize: 15, color: "var(--text-body)", cursor: "pointer",
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

    const payload: { data: Record<string, unknown>; email?: string } = {
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
    : gap > 0 ? `+${gap} points to your goal` : "You've hit your target.";

  let daysLabel = "No test date set";
  if (form.testDate) {
    const d = Math.ceil((new Date(form.testDate).getTime() - now) / 86400000);
    daysLabel = d > 0 ? `${d} days to test day` : "Test day has passed";
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)" }}>
      <Sidebar />

      <main className="pw-main-content" style={{ maxWidth: 880 + SIDEBAR_WIDTH, marginRight: "auto", padding: "0 56px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, height: 60, borderBottom: "1px solid var(--border)", fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>
          <span>Account center</span>
          <span>{daysLabel}</span>
        </div>

        <div style={{ padding: "52px 0 0", marginBottom: 32 }}>
          <h1 style={{ fontWeight: 400, fontSize: 44, lineHeight: 1.04, color: "var(--text-strong)", margin: 0, letterSpacing: "-0.026em" }}>Account center</h1>
          <p style={{ fontSize: 17, lineHeight: 1.62, color: "var(--text-muted)", margin: "18px 0 0", maxWidth: "50ch" }}>Update your details and tune the answers that shape your plan.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "0 0 24px", marginBottom: 28, borderBottom: "1px solid var(--line-strong)" }}>
          <Avatar name={form.displayName || form.email} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 23, color: "var(--text-strong)", margin: 0, letterSpacing: "-0.016em" }}>{form.displayName || "Your name"}</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", margin: "6px 0 0" }}>{form.email} · Grade {form.grade}</p>
          </div>
        </div>

        {/* Account info */}
        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-2xl)", padding: "30px 32px", marginBottom: 20 }}>
          <SectionHeading icon="user-check">Account info</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
            <Input label="Display name" placeholder="Maya" value={form.displayName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set({ displayName: e.target.value })} />
            <Input label="Email" type="email" placeholder="you@email.com" value={form.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set({ email: e.target.value })} />
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-body)", margin: "0 0 9px" }}>Grade level</p>
              <div style={{ display: "flex", gap: 8 }}>
                {GRADES.map((g) => {
                  const on = form.grade === g;
                  return (
                    <button key={g} onClick={() => set({ grade: g })} style={{
                      flex: 1, padding: "11px 0", border: `1px solid ${on ? "var(--text-strong)" : "var(--border-strong)"}`,
                      background: on ? "var(--surface-sunken)" : "transparent", borderRadius: "var(--radius-md)",
                      fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--text-body)", cursor: "pointer",
                    }}>{g}</button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Scores */}
        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-2xl)", padding: "30px 32px", marginBottom: 20 }}>
          <SectionHeading icon="target">Scores</SectionHeading>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", margin: "0 0 20px", paddingLeft: 36 }}>
            Your current score calibrates difficulty; your target guides which sets we pick.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-body)" }}>Current score</span>
                <span style={{ fontWeight: 600, fontSize: 21, color: "var(--text-strong)", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>
                  {form.noScore ? "Not set" : form.currentScore}
                </span>
              </div>
              <input type="range" min={400} max={1600} step={10} value={form.currentScore}
                onChange={(e) => set({ currentScore: Number(e.target.value), noScore: false })}
                style={{ width: "100%", accentColor: "var(--brand)", cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 12, color: "var(--text-faint)" }}>400</span>
                <span style={{ fontSize: 12, color: "var(--text-faint)" }}>1600</span>
              </div>
              <button onClick={() => set({ noScore: !form.noScore })} style={{ ...chipStyle(form.noScore), marginTop: 12, fontSize: 12, padding: "8px 14px" }}>
                Haven&apos;t tested yet
              </button>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-body)" }}>Target score</span>
                <span style={{ fontWeight: 600, fontSize: 21, color: "var(--text-strong)", fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}>{form.targetScore}</span>
              </div>
              <input type="range" min={1000} max={1600} step={10} value={form.targetScore}
                onChange={(e) => set({ targetScore: Number(e.target.value) })}
                style={{ width: "100%", accentColor: "var(--brand)", cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 12, color: "var(--text-faint)" }}>1000</span>
                <span style={{ fontSize: 12, color: "var(--text-faint)" }}>1600</span>
              </div>
              <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: "7px 13px" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{gapLabel}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Plan preferences */}
        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-2xl)", padding: "30px 32px", marginBottom: 20 }}>
          <SectionHeading icon="compass">Plan preferences</SectionHeading>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", margin: "0 0 20px", paddingLeft: 36 }}>
            The answers from your setup — change them anytime.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "end" }}>
              <Input label="When's test day?" type="date" value={form.testDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set({ testDate: e.target.value })} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-body)", margin: "0 0 9px" }}>Reading vs. Writing focus</p>
                <SegmentedControl options={["Reading", "Balanced", "Writing"]} value={form.rw} onChange={(v: string) => set({ rw: v })} />
              </div>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-body)", margin: "0 0 10px" }}>
                What are you here for? <span style={{ color: "var(--text-faint)", fontWeight: 500 }}>(pick any)</span>
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                {GOAL_OPTIONS.map((g) => (
                  <button key={g} onClick={() => toggleGoal(g)} style={chipStyle(form.goals.includes(g))}>{g}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Redo onboarding */}
        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-2xl)", padding: "30px 32px", marginBottom: 20 }}>
          <h2 style={sectionLabel}>Redo onboarding</h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)", margin: "10px 0 20px", maxWidth: "50ch" }}>
            Retake the welcome questions — target score, starting point, and focus areas — to recalibrate your plan.
          </p>
          {redoError && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", margin: "0 0 14px" }}>{redoError}</p>}
          <Button variant="secondary" onClick={redoOnboarding} disabled={redoingOnboarding}>
            {redoingOnboarding ? "Loading…" : "Redo onboarding"}
          </Button>
        </section>

        {/* Sign out */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
          <form action="/auth/signout" method="post">
            <button type="submit" style={{ border: 0, background: "none", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)", cursor: "pointer", padding: 0 }}>
              Sign out
            </button>
          </form>
        </div>
      </main>

      {/* Sticky save bar */}
      {dirty && (
        <div className="pw-main-content" style={{ position: "sticky", bottom: 0, zIndex: 20, background: "var(--canvas)", borderTop: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 880, marginRight: "auto", padding: "14px 56px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
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
          background: "var(--text-strong)", color: "var(--text-on-dark)",
          borderRadius: "var(--radius-md)", padding: "11px 20px",
          fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
        }}>
          Changes saved
        </div>
      )}
    </div>
  );
}
