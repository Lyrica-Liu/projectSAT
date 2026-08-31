"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar, LoadingScreen, SIDEBAR_WIDTH } from "@/components/ui/nav";
import { Input } from "@/components/ui/ds";
import {
  getPlanDay, getCurrentPlanDay, calcStreak,
  ENGLISH_SESSION_LENGTH, MATH_SESSION_LENGTH,
} from "@/lib/plan";
import type { Session, SkillStat, QuestionSkill, MathSkill, PlanDayRow, CategoryProgressRow } from "@/lib/types";

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

const SKILL_LABELS: Record<QuestionSkill, string> = {
  central_idea: "Central Idea",
  command_of_evidence: "Command of Evidence",
  inferences: "Inferences",
  words_in_context: "Words in Context",
  cross_text_connections: "Cross-Text Connections",
  text_structure: "Text Structure",
  boundaries: "Boundaries",
  form_structure_sense: "Form, Structure & Sense",
  transitions: "Transitions",
  rhetorical_synthesis: "Rhetorical Synthesis",
};

const MATH_SKILL_LABELS: Record<MathSkill, string> = {
  algebra: "Algebra",
  data_analysis: "Data Analysis",
  geometry: "Geometry",
};

function skillLabel(skill: QuestionSkill | MathSkill): string {
  return (SKILL_LABELS as Record<string, string>)[skill] ?? (MATH_SKILL_LABELS as Record<string, string>)[skill] ?? skill;
}

const microLabel: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.14em",
  textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 10px",
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());
  const [displayName, setDisplayName] = useState("there");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [skillStats, setSkillStats] = useState<SkillStat[]>([]);
  const [sessionSkillsMap, setSessionSkillsMap] = useState<Record<string, (QuestionSkill | MathSkill)[]>>({});
  const [planRows, setPlanRows] = useState<PlanDayRow[]>([]);
  const [, setCategoryProgress] = useState<CategoryProgressRow[]>([]);

  // Anonymous users get a plan (created quietly during onboarding) but no real account yet —
  // once they've finished a session, the dashboard prompts them to save it for real.
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }
      setIsAnonymous(user.is_anonymous ?? false);

      setDisplayName(
        user.user_metadata?.display_name ??
        user.user_metadata?.full_name ??
        user.email?.split("@")[0] ?? "there"
      );

      const [sessionRes, planRes, progressRes] = await Promise.all([
        supabase.from("sessions").select("*").eq("user_id", user.id).not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(10),
        supabase.from("plan_days").select("*").eq("user_id", user.id).order("day_number"),
        supabase.from("category_progress").select("*").eq("user_id", user.id),
      ]);

      const allSessions: Session[] = sessionRes.data ?? [];
      setSessions(allSessions);
      setPlanRows(planRes.data ?? []);
      setCategoryProgress(progressRes.data ?? []);

      const sessionIds = allSessions.map((s) => s.id);
      if (sessionIds.length > 0) {
        const { data: answerRows } = await supabase
          .from("answers")
          .select("session_id, is_correct, question:questions(skill)")
          .in("session_id", sessionIds);

        const skillMap: Record<string, { total: number; correct: number }> = {};
        const perSessionSkills: Record<string, Set<QuestionSkill | MathSkill>> = {};
         
        (answerRows ?? []).forEach((row: any) => {
          const q = Array.isArray(row.question) ? row.question[0] : row.question;
          const skill: QuestionSkill | MathSkill | undefined = q?.skill;
          if (!skill) return;
          if (!skillMap[skill]) skillMap[skill] = { total: 0, correct: 0 };
          skillMap[skill].total++;
          if (row.is_correct) skillMap[skill].correct++;
          if (row.session_id) {
            if (!perSessionSkills[row.session_id]) perSessionSkills[row.session_id] = new Set();
            perSessionSkills[row.session_id].add(skill);
          }
        });

        setSkillStats(
          Object.entries(skillMap).map(([skill, { total, correct }]) => ({
            skill: skill as QuestionSkill | MathSkill,
            total, correct,
            accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
          }))
        );

        const mapped: Record<string, (QuestionSkill | MathSkill)[]> = {};
        Object.entries(perSessionSkills).forEach(([id, set]) => { mapped[id] = Array.from(set); });
        setSessionSkillsMap(mapped);
      }

      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createAccountWithEmail() {
    setAccountError(null);
    if (!accountEmail.trim() || !accountPassword) {
      setAccountError("Enter an email and password to continue.");
      return;
    }
    setAccountLoading(true);
    // Converts the current anonymous user into a real one — same user id, so every session,
    // answer, and streak already saved stays exactly where it is.
    const { error } = await supabase.auth.updateUser({ email: accountEmail, password: accountPassword });
    setAccountLoading(false);
    if (error) {
      setAccountError(error.message);
      return;
    }
    setAwaitingEmailConfirm(true);
  }

  async function continueWithGoogle() {
    setAccountError(null);
    setAccountLoading(true);
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setAccountLoading(false);
      setAccountError(error.message);
    }
    // On success the browser navigates to Google and back — nothing further runs here.
  }

  if (loading) return <LoadingScreen />;

  const completedPlanRows = planRows.filter((r) => r.completed_at);
  const completedNums = completedPlanRows.map((r) => r.day_number);
  const currentDay = getCurrentPlanDay(completedNums);
  const streak = calcStreak(planRows);
  const doneCt = completedNums.length;
  const showAccountPrompt = isAnonymous && doneCt >= 1;
  const todayPlanDay = currentDay <= 30 ? getPlanDay(currentDay) : null;
  const todayRow = planRows.find((r) => r.day_number === currentDay) ?? null;
  const todayFocus = todayRow?.subcategory ?? todayPlanDay?.focus ?? "Today's session";
  const isMathToday = todayPlanDay?.subject === "math";
  const allDone = currentDay > 30;

  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + (s.score ?? 0), 0) / sessions.length) : null;

  const daysAgo = (s: Session) => s.completed_at ? (now - new Date(s.completed_at).getTime()) / 86400000 : Infinity;
  const lastWeek = sessions.filter((s) => daysAgo(s) <= 7);
  const priorWeek = sessions.filter((s) => daysAgo(s) > 7 && daysAgo(s) <= 14);
  const lastWeekAvg = lastWeek.length > 0 ? Math.round(lastWeek.reduce((a, s) => a + (s.score ?? 0), 0) / lastWeek.length) : null;
  const priorWeekAvg = priorWeek.length > 0 ? Math.round(priorWeek.reduce((a, s) => a + (s.score ?? 0), 0) / priorWeek.length) : null;
  const vsLastWeek = lastWeekAvg != null && priorWeekAvg != null ? lastWeekAvg - priorWeekAvg : null;

  const sortedSkills = [...skillStats].sort((a, b) => a.accuracy - b.accuracy);
  const weakestSkill = sortedSkills.length > 0 ? skillLabel(sortedSkills[0].skill) : null;

  const dateLine = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  let briefBody: string;
  if (doneCt === 0) briefBody = "Nothing is behind you yet and nothing is lost — the sequence starts wherever you open it. Twenty questions is a smaller commitment than it sounds, and it is the whole ask for today.";
  else if (streak < 3) briefBody = "A sitting or two in, the plan is still deciding what you are good at. Answer honestly rather than carefully; the sequence adjusts to what it sees.";
  else if (streak < 7) briefBody = "The habit is taking hold, which is the part most people never reach. From here the questions begin to lean harder on the skills you have been avoiding.";
  else briefBody = `${streak} days unbroken. The plan now has enough of your work to aim properly, so expect today to be pointed rather than broad — it is chosen from your misses, not at random.`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)" }}>
      <Sidebar />

      <main className="pw-main-content" style={{ maxWidth: 1080 + SIDEBAR_WIDTH, marginRight: "auto", padding: "0 56px 96px" }}>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 24, height: 60, borderBottom: "1px solid var(--border)", fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>
          <span style={{ alignSelf: "center" }}>{dateLine}</span>
          <span style={{ alignSelf: "center", fontVariantNumeric: "tabular-nums" }}>Day {Math.min(currentDay, 30)} / 30 · {isMathToday ? "Math" : "English"}</span>
        </div>

        {/* Save-your-progress prompt — anonymous users see this once they've finished a session */}
        {showAccountPrompt && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap",
            margin: "24px 0 0", padding: "18px 24px", background: "var(--danger-surface)", borderLeft: "2px solid var(--danger)",
            borderRadius: "0 var(--radius-md) var(--radius-md) 0",
          }}>
            <div>
              <p style={{ fontSize: 16, color: "var(--text-strong)", margin: "0 0 4px" }}>Your progress isn&apos;t saved to an account yet.</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                {streak} {streak === 1 ? "day" : "days"} of work lives only in this browser — clear it or switch devices and it&apos;s gone for good.
              </p>
            </div>
            <button onClick={() => setShowAccountModal(true)} style={{
              flexShrink: 0, border: 0, background: "var(--brand)", color: "var(--text-on-brand)",
              fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "12px 24px",
              borderRadius: "var(--radius-lg)", cursor: "pointer",
            }}>
              Create account
            </button>
          </div>
        )}

        {/* Briefing */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 236px", gap: 56, alignItems: "start", padding: "56px 0 0" }}>
          <div>
            <h1 style={{ ...microLabel, margin: "0 0 22px" }}>The briefing</h1>
            <p style={{ fontSize: 23, lineHeight: 1.52, letterSpacing: "-0.012em", color: "var(--text-strong)", margin: 0, maxWidth: "54ch", textWrap: "pretty" }}>
              <span style={{ float: "left", fontSize: 62, lineHeight: 0.82, fontWeight: 600, margin: "5px 12px 0 0", color: "var(--text-strong)" }}>
                H
              </span>
              {`ey ${displayName} — ${allDone ? "the thirty days are behind you." : `today is a ${isMathToday ? "Math" : "Reading and Writing"} sitting: ${isMathToday ? MATH_SESSION_LENGTH : ENGLISH_SESSION_LENGTH} questions, focused on ${todayFocus.toLowerCase()}.`}`}
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.68, color: "var(--text-muted)", margin: "20px 0 0", maxWidth: "58ch", textWrap: "pretty" }}>{briefBody}</p>
          </div>
          <div style={{ borderLeft: "1px solid var(--border)", padding: "2px 0 2px 24px" }}>
            <p style={microLabel}>In the margin</p>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)", margin: "0 0 16px" }}>Weakest skill so far</p>
            <p style={{ fontSize: 19, lineHeight: 1.3, color: "var(--text-strong)", margin: "0 0 20px" }}>{weakestSkill ?? "Not enough data yet"}</p>
            <div style={{ height: 1, background: "var(--border)", margin: "0 0 18px" }} />
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.66, color: "var(--text-faint)", margin: 0 }}>
              {weakestSkill ? "Extra practice on this skill sharpens fastest — find it from For You." : "Complete a few sessions and this will point at what to fix first."}
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", margin: "48px 0 0", borderTop: "1px solid var(--line-strong)", borderBottom: "1px solid var(--border)" }}>
          {[
            { label: "Plan progress", value: `${Math.min(currentDay, 30)}`, sub: "/ 30" },
            { label: "Average accuracy", value: avgScore != null ? `${avgScore}%` : "—", sub: null },
            { label: "Against last week", value: vsLastWeek != null ? `${vsLastWeek >= 0 ? "+" : ""}${vsLastWeek}` : "—", sub: null },
            { label: "Days remaining", value: `${Math.max(0, 30 - currentDay + 1)}`, sub: null },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: i === 0 ? "20px 28px 20px 0" : i === 3 ? "20px 0 20px 28px" : "20px 28px", borderLeft: i > 0 ? "1px solid var(--border)" : "none" }}>
              <p style={microLabel}>{s.label}</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 26, fontWeight: 500, color: "var(--text-strong)", margin: 0, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {s.value}{s.sub && <span style={{ fontSize: 14, color: "var(--text-faint)" }}> {s.sub}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Today's module + 30-day map */}
        <div style={{ display: "grid", gridTemplateColumns: "1.12fr 1fr", gap: 48, margin: "48px 0 0", alignItems: "stretch" }}>
          <div style={{ background: "var(--dark-900)", color: "var(--text-on-dark)", borderRadius: "var(--radius-2xl)", padding: "40px 44px 38px", display: "flex", flexDirection: "column" }}>
            {allDone ? (
              <>
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-on-dark-faint)", margin: "0 0 24px" }}>Path complete</p>
                  <h2 style={{ fontWeight: 400, fontSize: 34, lineHeight: 1.1, letterSpacing: "-0.022em", color: "var(--text-on-dark)", margin: "0 0 14px" }}>All thirty days, done.</h2>
                  <p style={{ fontSize: 16, lineHeight: 1.66, color: "var(--text-on-dark-muted)", margin: 0, maxWidth: "40ch" }}>Keep the skills sharp — extra practice doesn&apos;t advance the plan, but it keeps the edge.</p>
                </div>
                <div style={{ marginTop: "auto" }}>
                  <Link href="/practice" style={{ display: "inline-flex", border: "0", background: "var(--text-on-dark)", color: "var(--dark-900)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "14px 28px", borderRadius: "var(--radius-lg)" }}>
                    Extra practice
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, margin: "0 0 24px", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-on-dark-faint)" }}>
                  <span style={{ letterSpacing: "0.16em", textTransform: "uppercase" }}>Today · Day {currentDay}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{isMathToday ? MATH_SESSION_LENGTH : ENGLISH_SESSION_LENGTH} questions</span>
                </div>
                <h2 style={{ fontWeight: 400, fontSize: 34, lineHeight: 1.1, letterSpacing: "-0.022em", color: "var(--text-on-dark)", margin: "0 0 14px", maxWidth: "20ch", textWrap: "pretty" }}>{todayFocus}</h2>
                <p style={{ fontSize: 16, lineHeight: 1.66, color: "var(--text-on-dark-muted)", margin: "0 0 32px", maxWidth: "40ch" }}>A warm-up question, then the timed module. Nothing to choose — today is already decided.</p>
                <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
                  <button onClick={() => router.push(`/plan/${currentDay}`)} style={{ border: "0", background: "var(--text-on-dark)", color: "var(--dark-900)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "14px 28px", borderRadius: "var(--radius-lg)", cursor: "pointer" }}>
                    Begin Day {currentDay}
                  </button>
                  <Link href="/plan" style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-on-dark-faint)" }}>View the full plan</Link>
                </div>
              </>
            )}
          </div>

          <div>
            <p style={microLabel}>The thirty days</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10,1fr)", gap: 1, background: "var(--border)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              {Array.from({ length: 30 }, (_, i) => {
                const d = i + 1;
                const isDone = completedNums.includes(d);
                const isToday = d === currentDay;
                return (
                  <Link key={d} href={`/plan/${d}`} style={{
                    aspectRatio: 1.15, display: "flex", alignItems: "center", justifyContent: "center",
                    background: isDone ? "var(--surface-2)" : "var(--surface)",
                  }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontVariantNumeric: "tabular-nums", color: isToday ? "var(--accent)" : isDone ? "var(--text-strong)" : "var(--ink-300)" }}>{d}</span>
                  </Link>
                );
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, margin: "24px 0 0", borderTop: "1px solid var(--border)", padding: "18px 0 0" }}>
              <span><span style={{ fontFamily: "var(--font-sans)", fontSize: 24, fontWeight: 500, color: "var(--text-strong)", fontVariantNumeric: "tabular-nums" }}>{streak}</span><span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", display: "block", marginTop: 5 }}>day streak</span></span>
              <span><span style={{ fontFamily: "var(--font-sans)", fontSize: 24, fontWeight: 500, color: "var(--text-strong)", fontVariantNumeric: "tabular-nums" }}>{avgScore != null ? `${avgScore}%` : "—"}</span><span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", display: "block", marginTop: 5 }}>average accuracy</span></span>
            </div>
          </div>
        </div>

        {/* Recent sessions ledger */}
        {sessions.length > 0 ? (
          <div style={{ margin: "64px 0 0" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 0 12px", borderBottom: "1px solid var(--line-strong)" }}>
              <p style={{ ...microLabel, margin: 0 }}>Recent sessions</p>
              <Link href="/for-you" style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>Full insights</Link>
            </div>
            {sessions.slice(0, 6).map((s) => {
              const skills = sessionSkillsMap[s.id] ?? [];
              const skillText = skills.length > 0 ? skills.slice(0, 2).map(skillLabel).join(", ") + (skills.length > 2 ? "…" : "") : "—";
              return (
                <Link key={s.id} href={`/results/${s.id}`} style={{
                  display: "grid", gridTemplateColumns: "1fr 116px 70px", alignItems: "baseline", gap: 20,
                  padding: "16px 4px", borderBottom: "1px solid var(--border)",
                }}>
                  <span style={{ fontSize: 16, color: "var(--text-strong)" }}>
                    {skillText} <span style={{ fontSize: 14, color: "var(--text-faint)" }}>· {s.domain_filter === "both" ? "Reading & Writing" : s.domain_filter}</span>
                  </span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>
                    {s.completed_at ? new Date(s.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                  </span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: (s.score ?? 0) >= 58 ? "var(--text-strong)" : "var(--accent)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {s.score ?? "—"}%
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div style={{ margin: "64px 0 0", paddingTop: 40, borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <p style={{ fontSize: 19, color: "var(--text-strong)", margin: "0 0 20px" }}>Your record will start appearing here after the first session.</p>
            <button onClick={() => router.push("/plan/1")} style={{ border: "0", background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "14px 28px", borderRadius: "var(--radius-lg)", cursor: "pointer" }}>
              Begin Day 1
            </button>
          </div>
        )}
      </main>

      {showAccountModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--overlay)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-2xl)", padding: "40px 40px 36px", maxWidth: 420, width: "100%" }}>
            {awaitingEmailConfirm ? (
              <>
                <h2 style={{ fontWeight: 400, fontSize: 27, lineHeight: 1.2, color: "var(--text-strong)", margin: "0 0 12px" }}>Check your email</h2>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)", margin: "0 0 28px" }}>
                  We sent a confirmation link to <strong style={{ color: "var(--text-strong)" }}>{accountEmail}</strong>. Once you confirm it, everything you&apos;ve done here is safely yours.
                </p>
                <button onClick={() => { setShowAccountModal(false); setAwaitingEmailConfirm(false); }} style={{ border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "13px 26px", borderRadius: "var(--radius-lg)", cursor: "pointer" }}>
                  Done
                </button>
              </>
            ) : (
              <>
                <h2 style={{ fontWeight: 400, fontSize: 27, lineHeight: 1.2, color: "var(--text-strong)", margin: "0 0 8px" }}>Save your progress</h2>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)", margin: "0 0 24px" }}>
                  Nothing you&apos;ve done is lost — it carries straight into your account.
                </p>

                <button
                  type="button" onClick={continueWithGoogle} disabled={accountLoading}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    padding: "12px 0", marginBottom: 18, background: "transparent", border: "1px solid var(--border-strong)",
                    borderRadius: "var(--radius-md)", cursor: accountLoading ? "default" : "pointer",
                    fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 13, color: "var(--text-strong)",
                    opacity: accountLoading ? 0.6 : 1,
                  }}
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap" }}>or continue with email</span>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 8 }}>
                  <Input label="Email" type="email" value={accountEmail} placeholder="you@example.com" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccountEmail(e.target.value)} />
                  <Input label="Password" type="password" value={accountPassword} placeholder="••••••••" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccountPassword(e.target.value)} />
                </div>

                {accountError && (
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--danger)", margin: "10px 0 0" }}>{accountError}</p>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 24 }}>
                  <button onClick={createAccountWithEmail} disabled={accountLoading} style={{
                    border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)",
                    fontSize: 14, fontWeight: 500, padding: "13px 26px", borderRadius: "var(--radius-lg)",
                    cursor: accountLoading ? "default" : "pointer", opacity: accountLoading ? 0.6 : 1,
                  }}>
                    {accountLoading ? "Creating…" : "Create account"}
                  </button>
                  <button onClick={() => setShowAccountModal(false)} style={{ border: 0, background: "none", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)", cursor: "pointer", padding: 0 }}>
                    Not now
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
