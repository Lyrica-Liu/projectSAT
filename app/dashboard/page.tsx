"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppNav, LoadingScreen } from "@/components/ui/nav";
import { Card, Badge, Button } from "@/components/ui/ds";
import {
  getPlanDay, getCurrentPlanDay, calcStreak, DIFFICULTY_LABELS, DIFFICULTY_TONES,
  ENGLISH_SESSION_LENGTH, ENGLISH_CATEGORY_ORDER,
} from "@/lib/plan";
import type { Session, SkillStat, QuestionSkill, PlanDayRow, CategoryProgressRow } from "@/lib/types";

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

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("there");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [skillStats, setSkillStats] = useState<SkillStat[]>([]);
  const [sessionSkillsMap, setSessionSkillsMap] = useState<Record<string, QuestionSkill[]>>({});
  const [planRows, setPlanRows] = useState<PlanDayRow[]>([]);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgressRow[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }

      setDisplayName(
        user.user_metadata?.display_name ??
        user.user_metadata?.full_name ??
        user.email?.split("@")[0] ?? "there"
      );

      // Fetch sessions + plan_days + category_progress in parallel
      const [sessionRes, planRes, progressRes] = await Promise.all([
        supabase
          .from("sessions")
          .select("*")
          .eq("user_id", user.id)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(10),
        supabase
          .from("plan_days")
          .select("*")
          .eq("user_id", user.id)
          .order("day_number"),
        supabase
          .from("category_progress")
          .select("*")
          .eq("user_id", user.id),
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
        const perSessionSkills: Record<string, Set<QuestionSkill>> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (answerRows ?? []).forEach((row: any) => {
          const q = Array.isArray(row.question) ? row.question[0] : row.question;
          const skill: QuestionSkill | undefined = q?.skill;
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
            skill: skill as QuestionSkill,
            total,
            correct,
            accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
          }))
        );

        const mapped: Record<string, QuestionSkill[]> = {};
        Object.entries(perSessionSkills).forEach(([id, set]) => { mapped[id] = Array.from(set); });
        setSessionSkillsMap(mapped);
      }

      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingScreen />;

  const completedPlanRows = planRows.filter((r) => r.completed_at);
  const completedNums = completedPlanRows.map((r) => r.day_number);
  const completedSet = new Set(completedNums);
  const currentDay = getCurrentPlanDay(completedNums);
  const streak = calcStreak(planRows);
  const doneCt = completedNums.length;
  const todayPlanDay = currentDay <= 30 ? getPlanDay(currentDay) : null;
  const todayRow = planRows.find((r) => r.day_number === currentDay) ?? null;
  const todayFocus = todayRow?.subcategory ?? todayPlanDay?.focus ?? "Today's session";
  const todayDifficulty = todayRow?.difficulty ?? todayPlanDay?.difficulty ?? null;

  const avgScore =
    sessions.length > 0
      ? Math.round(sessions.reduce((acc, s) => acc + (s.score ?? 0), 0) / sessions.length)
      : null;

  const sortedSkills = [...skillStats].sort((a, b) => a.accuracy - b.accuracy);
  const weakestSkill = sortedSkills.length > 0 ? SKILL_LABELS[sortedSkills[0].skill] : null;

  const progressByCategory = new Map(categoryProgress.map((r) => [r.subcategory, r.difficulty]));
  const categoryLevels = ENGLISH_CATEGORY_ORDER.map((cat) => ({
    focus: cat.focus,
    difficulty: progressByCategory.get(cat.subcategory) ?? null,
  }));

  const planPct = Math.round((doneCt / 30) * 100);
  const allDone = currentDay > 30;

  const eyebrow: React.CSSProperties = {
    fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: 700,
    letterSpacing: "var(--tracking-caps)", textTransform: "uppercase",
    color: "var(--text-faint)", display: "block",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
      <AppNav />

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 64px" }}>

        {/* Greeting */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500,
            fontSize: "var(--text-2xl)", color: "var(--text-strong)",
            margin: "0 0 4px", letterSpacing: "var(--tracking-snug)",
          }}>
            Hey, {displayName} 👋
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: 0 }}>
            {allDone
              ? "You finished the 30-Day Path. Keep the momentum going with extra practice."
              : doneCt === 0
              ? "Day 1 is ready. Let's start the journey."
              : `Day ${currentDay} of 30 is open. ${streak >= 3 ? "You're on a streak 🔥" : "Let's keep going."}`}
          </p>
        </div>

        {/* Stats row */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1px",
          background: "var(--border)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 24,
        }}>
          {[
            { label: "Plan progress", value: `Day ${Math.min(currentDay, 30)}`, sub: "/ 30" },
            { label: "Avg. accuracy",  value: avgScore != null ? `${avgScore}%` : "—", sub: null },
            { label: "Day streak",     value: streak > 0 ? `${streak}` : "—",    sub: streak > 0 ? "🔥" : null },
            { label: "Weakest skill",  value: weakestSkill ?? "—",               sub: null, small: true },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--surface)", padding: "var(--space-5)" }}>
              <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)", margin: "0 0 8px" }}>{s.label}</p>
              <p style={{
                fontFamily: (s as { small?: boolean }).small ? "var(--font-sans)" : "var(--font-mono)",
                fontWeight: 800,
                fontSize: (s as { small?: boolean }).small ? "var(--text-base)" : "var(--text-xl)",
                color: "var(--text-strong)", margin: 0, lineHeight: 1.1,
              }}>
                {s.value}
                {s.sub && <span style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--text-faint)", marginLeft: 4 }}>{s.sub}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Main grid: Today's session + Plan map */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 20 }}>

          {/* Today's session CTA */}
          {allDone ? (
            <div style={{
              background: "var(--dark-900)", borderRadius: "var(--radius-xl)",
              padding: 24, display: "flex", flexDirection: "column", gap: 16,
            }}>
              <div>
                <p style={{ ...eyebrow, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Path complete</p>
                <h2 style={{ fontWeight: 800, fontSize: "var(--text-md)", color: "#fff", margin: "0 0 8px" }}>
                  All 30 days done 🎉
                </h2>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-on-dark-muted)", margin: 0, lineHeight: "var(--leading-relaxed)" }}>
                  Keep your skills sharp with extra practice sessions.
                </p>
              </div>
              <Link href="/practice" style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                padding: "10px 18px", background: "var(--surface)", color: "var(--brand-ink)",
                fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)",
                borderRadius: "var(--radius-pill)", textDecoration: "none", boxShadow: "var(--shadow-sm)",
                width: "fit-content",
              }}>
                Extra practice →
              </Link>
            </div>
          ) : (
            <div style={{
              background: "var(--gradient-radiant)", borderRadius: "var(--radius-xl)",
              padding: 24, boxShadow: "0 8px 28px rgba(168,85,247,0.28)",
              display: "flex", flexDirection: "column", gap: 16,
            }}>
              <div>
                <p style={{ ...eyebrow, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
                  Today · Day {currentDay} of 30
                </p>
                <h2 style={{ fontWeight: 800, fontSize: "var(--text-md)", color: "#fff", margin: "0 0 6px" }}>
                  {todayFocus}
                </h2>
                <p style={{ fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: "var(--leading-relaxed)" }}>
                  {todayPlanDay?.subject === "english"
                    ? `English · ${todayDifficulty ? DIFFICULTY_LABELS[todayDifficulty] : ""} · ${ENGLISH_SESSION_LENGTH} questions`
                    : "Math · use your prep book today"}
                </p>
              </div>
              <div style={{ marginTop: "auto" }}>
                <Link href={`/plan/${currentDay}`} style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: "10px 18px", background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.3)",
                  color: "#fff", fontFamily: "var(--font-sans)", fontWeight: 600,
                  fontSize: "var(--text-sm)", borderRadius: "var(--radius-pill)",
                  textDecoration: "none",
                }}>
                  Begin Day {currentDay} →
                </Link>
                <p style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.6)", margin: "10px 0 0" }}>
                  Day {Math.min(currentDay + 1, 30)} opens after this is done ·{" "}
                  <Link href="/plan" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "underline" }}>
                    view full plan
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* 30-day mini-map + streak */}
          <Card tone="surface" padding="lg" radius="xl" shadow="sm">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text-strong)", margin: 0 }}>
                30-day map
              </h2>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>{doneCt}/30 done</span>
            </div>

            {/* 10×3 grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10,1fr)", gap: 5, marginBottom: 20 }}>
              {Array.from({ length: 30 }, (_, i) => {
                const d = i + 1;
                const isDone = completedSet.has(d);
                const isToday = d === currentDay;
                return (
                  <Link key={d} href={`/plan/${d}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      aspectRatio: "1", borderRadius: 6, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      background: isDone
                        ? "var(--brand)"
                        : isToday
                        ? "var(--gradient-radiant)"
                        : "var(--surface-sunken)",
                      color: isDone || isToday ? "#fff" : "var(--ink-300)",
                      fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 10,
                    }}>
                      {isDone
                        ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                        : d}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: "10px 14px", textAlign: "center" }}>
                <p style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--text-strong)", margin: 0, lineHeight: 1.1 }}>
                  {streak > 0 ? streak : "—"}
                </p>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: "3px 0 0" }}>day streak 🔥</p>
              </div>
              <div style={{ flex: 1, background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: "10px 14px", textAlign: "center" }}>
                <p style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--text-strong)", margin: 0, lineHeight: 1.1 }}>
                  {planPct}%
                </p>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: "3px 0 0" }}>of plan done ⭐</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Skill breakdown + Recent sessions */}
        {sessions.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Card tone="surface" padding="lg" radius="xl" shadow="sm">
              <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text-strong)", margin: "0 0 20px" }}>
                Skill level
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
                {categoryLevels.map((c) => (
                  <div key={c.focus} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 4px", borderBottom: "1px solid var(--border)",
                  }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-body)" }}>
                      {c.focus}
                    </span>
                    {c.difficulty ? (
                      <Badge tone={DIFFICULTY_TONES[c.difficulty] as "mint" | "sky" | "peach" | "rose"}>
                        {DIFFICULTY_LABELS[c.difficulty]}
                      </Badge>
                    ) : (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>Not started</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card tone="surface" padding="lg" radius="xl" shadow="sm">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text-strong)", margin: 0 }}>
                  Recent sessions
                </h2>
                <Link href="/history" style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--text-faint)", textDecoration: "none" }}>
                  View all →
                </Link>
              </div>
              {sessions.slice(0, 5).map((s, i) => {
                const skills = sessionSkillsMap[s.id] ?? [];
                const visible = skills.slice(0, 2);
                const extra = skills.length - visible.length;
                return (
                  <div key={s.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid var(--border)",
                    gap: 10,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text-strong)", margin: "0 0 3px", textTransform: "capitalize" }}>
                        {s.domain_filter === "both" ? "Reading & Writing" : s.domain_filter}
                      </p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--text-faint)", margin: "0 0 5px" }}>
                        {s.completed_at ? new Date(s.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </p>
                      {visible.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {visible.map((sk) => <Badge key={sk} tone="sky">{SKILL_LABELS[sk]}</Badge>)}
                          {extra > 0 && <Badge tone="sky">+{extra}</Badge>}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "var(--text-sm)", color: (s.score ?? 0) >= 75 ? "var(--brand)" : "var(--text-muted)" }}>
                        {s.score ?? "—"}%
                      </span>
                      <Link href={`/results/${s.id}`} style={{ fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--text-faint)", textDecoration: "none" }}>
                        →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {/* First-time empty state */}
        {sessions.length === 0 && doneCt === 0 && (
          <Card tone="lilac" padding="xl" radius="xl" shadow="sm" style={{ textAlign: "center", marginTop: 8 }}>
            <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: "var(--text-lg)", color: "var(--brand-ink)", margin: "0 0 12px" }}>
              Your stats will appear here after your first session.
            </p>
            <Button onClick={() => router.push("/plan/1")} size="lg">
              Begin Day 1 →
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
