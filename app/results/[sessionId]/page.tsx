"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar, LoadingScreen, SIDEBAR_WIDTH } from "@/components/ui/nav";
import { ScoreRing, SkillBar, AnswerOption } from "@/components/ui/ds";
import { getPlanDay, getCurrentPlanDay, calcStreak } from "@/lib/plan";
import type { QuestionSkill, MathSkill, PlanDayRow } from "@/lib/types";

const MILESTONE_LABELS: Record<number, string> = { 10: "Foundations", 20: "Momentum", 30: "Summit" };

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

function skillLabel(skill: string): string {
  return (SKILL_LABELS as Record<string, string>)[skill] ?? (MATH_SKILL_LABELS as Record<string, string>)[skill] ?? skill;
}

const microLabel: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500,
  letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)",
  margin: "0 0 20px", paddingBottom: 12, borderBottom: "1px solid var(--line-strong)", display: "block",
};

interface AnswerRow {
  id: string;
  is_correct: boolean;
  user_answer: string | null;
  user_grid_answer: string | null;
  question: {
    passage: string | null;
    stem: string;
    answer: "A" | "B" | "C" | "D" | null;
    grid_answer: string | null;
    question_type: "multiple_choice" | "grid_in";
    options: { A: string; B: string; C: string; D: string } | null;
    explanation: string;
    skill: QuestionSkill;
    domain: string;
    difficulty: string;
  } | null;
}

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{
    score: number | null;
    domain_filter: string;
    feedback_text: string | null;
    completed_at: string | null;
  } | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [skillMap, setSkillMap] = useState<Record<string, { total: number; correct: number }>>({});
  // Command of Evidence (Textual) and (Quantitative) share one skill value on a saved question,
  // so this maps answer id -> its real subcategory (resolved server-side) wherever it's known —
  // see /api/resolve-command-of-evidence. Answers not in this map just show the generic skill.
  const [coeMap, setCoeMap] = useState<Record<string, string>>({});
  // Correct answers start collapsed to a one-line summary (missed ones are the useful ones to
  // dwell on, so they start expanded); either kind can be expanded on demand.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // The passage + original answer choices aren't shown at all until asked for, independent of
  // the expand state above — "Show question" reveals them (and expands the row if it wasn't
  // already, since the passage needs that context to make sense).
  const [passageShownIds, setPassageShownIds] = useState<Set<string>>(new Set());
  const [planDay, setPlanDay] = useState<PlanDayRow | null>(null);
  const [nextDay, setNextDay] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }

      const { data: sessionData } = await supabase
        .from("sessions").select("*").eq("id", sessionId).eq("user_id", user.id).single();

      if (!sessionData) { router.replace("/dashboard"); return; }
      if (!sessionData.completed_at) { router.replace(`/practice/${sessionId}`); return; }

      setSession(sessionData);

      // Ordered by position (the actual sequence the questions were presented in) — id is a
      // UUID and sorts effectively at random, which would make the "Q1/Q2/…" numbers below
      // meaningless.
      const { data: answerRows } = await supabase
        .from("answers").select("*, question:questions(*)").eq("session_id", sessionId).order("position");

      const rows: AnswerRow[] = answerRows ?? [];
      setAnswers(rows);
      setExpandedIds(new Set(rows.filter((r) => !r.is_correct).map((r) => r.id)));

      // Resolve which of the two Command of Evidence subcategories each such question actually
      // came from, so the breakdown below doesn't silently merge two different skills into one
      // ambiguous "Command of Evidence" bucket.
      const coeItems = rows
        .filter((r) => r.question?.skill === "command_of_evidence")
        .map((r) => ({ id: r.id, passage: r.question!.passage, stem: r.question!.stem }));
      let resolved: Record<string, string> = {};
      if (coeItems.length > 0) {
        try {
          const res = await fetch("/api/resolve-command-of-evidence", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: coeItems }),
          });
          if (res.ok) resolved = (await res.json()).resolved ?? {};
        } catch {
          // Non-critical — falls back to the generic "Command of Evidence" label below.
        }
      }
      setCoeMap(resolved);

      const map: Record<string, { total: number; correct: number }> = {};
      rows.forEach((row) => {
        const skill = resolved[row.id] ?? (row.question?.skill as QuestionSkill | undefined);
        if (!skill) return;
        if (!map[skill]) map[skill] = { total: 0, correct: 0 };
        map[skill].total++;
        if (row.is_correct) map[skill].correct++;
      });
      setSkillMap(map);

      const { data: pdRow } = await supabase
        .from("plan_days").select("*").eq("session_id", sessionId).maybeSingle();

      if (pdRow) {
        setPlanDay(pdRow as PlanDayRow);
        if (!pdRow.completed_at) {
          const sessionScore = sessionData.score ??
            (rows.length > 0 ? Math.round(rows.filter((r) => r.is_correct).length / rows.length * 100) : 0);
          await supabase.from("plan_days").update({ completed_at: new Date().toISOString(), score: sessionScore }).eq("id", pdRow.id);

          const { data: allRows } = await supabase.from("plan_days").select("day_number, completed_at").eq("user_id", user.id);
          const doneNums = (allRows ?? []).filter((r) => r.completed_at || r.day_number === pdRow.day_number).map((r) => r.day_number);
          const next = getCurrentPlanDay(doneNums);
          if (next <= 30) setNextDay(next);
          setStreak(calcStreak((allRows ?? []).map((r) => r.day_number === pdRow.day_number ? { completed_at: new Date().toISOString() } : r)));
        } else {
          const { data: allRows } = await supabase.from("plan_days").select("day_number, completed_at").eq("user_id", user.id);
          const doneNums = (allRows ?? []).filter((r) => r.completed_at).map((r) => r.day_number);
          const next = getCurrentPlanDay(doneNums);
          if (next <= 30) setNextDay(next);
          setStreak(calcStreak(allRows ?? []));
        }
      }

      if (!sessionData.feedback_text) {
        setFeedbackLoading(true);
        fetch("/api/generate-feedback", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }),
        })
          .then((res) => res.json())
          .then((body) => { if (body.feedback_text) setSession((prev) => prev ? { ...prev, feedback_text: body.feedback_text } : prev); })
          .catch(() => {})
          .finally(() => setFeedbackLoading(false));
      }

      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (loading) return <LoadingScreen message="Loading results…" />;
  if (!session) return null;

  function showQuestion(id: string) {
    setExpandedIds((prev) => new Set(prev).add(id));
    setPassageShownIds((prev) => new Set(prev).add(id));
  }
  function hidePassage(id: string) {
    setPassageShownIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  const totalCount = answers.length;
  const correctCount = answers.filter((r) => r.is_correct).length;
  const score = session.score ?? (totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0);
  const sortedSkills = Object.entries(skillMap).sort(([, a], [, b]) => a.correct / a.total - b.correct / b.total);
  const dateLine = session.completed_at ? new Date(session.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  // planDay.subcategory is the live, personalized topic for this day (written by generate-plan/
  // adjust-plan/swap-plan-day) — getPlanDay()'s .focus is only the static pre-personalization
  // default, so falling back to it unconditionally here would show the wrong topic for any day
  // whose subcategory has since diverged from that default (the common case under the
  // diagnostic-driven plan, same fallback pattern already used on /plan and /plan/[day]).
  const title = planDay ? `${getPlanDay(planDay.day_number)?.subject === "math" ? "Math" : "English"} — ${planDay.subcategory ?? getPlanDay(planDay.day_number)?.focus}` : (session.domain_filter === "both" ? "Reading & Writing" : session.domain_filter);
  const nextPlanDay = nextDay ? getPlanDay(nextDay) : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)" }}>
      <Sidebar />

      <main className="pw-main-content" style={{ maxWidth: 1000 + SIDEBAR_WIDTH, marginRight: "auto", padding: "0 56px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, height: 60, borderBottom: "1px solid var(--border)", fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>
          <span>Day report</span>
          <span>{planDay ? `Day ${planDay.day_number} of 30 · ` : ""}{dateLine}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 56, alignItems: "end", padding: "52px 0 0" }}>
          <div>
            {planDay && (
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                {streak > 0 && <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{streak}-day streak</span>}
                {MILESTONE_LABELS[planDay.day_number] && (
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--accent)" }}>· {MILESTONE_LABELS[planDay.day_number]} milestone</span>
                )}
              </div>
            )}
            <h1 style={{ fontWeight: 400, fontSize: 46, lineHeight: 1.04, letterSpacing: "-0.026em", color: "var(--text-strong)", margin: 0, textTransform: planDay ? "none" : "capitalize" }}>{title}</h1>
            <p style={{ fontSize: 17, lineHeight: 1.62, color: "var(--text-muted)", margin: "20px 0 0", maxWidth: "44ch" }}>
              {correctCount} of {totalCount} correct.
            </p>
          </div>
          <ScoreRing score={score} size={148} caption={`${correctCount} of ${totalCount} correct`} />
        </div>

        {(session.feedback_text || feedbackLoading) && (
          <div style={{ margin: "56px 0 0", borderTop: "1px solid var(--line-strong)", paddingTop: 32 }}>
            <p style={microLabel}>A note on today</p>
            <p style={{
              fontSize: 22, lineHeight: 1.56, letterSpacing: "-0.01em", color: "var(--text-strong)", margin: 0,
              maxWidth: "60ch", padding: "2px 0 2px 22px", borderLeft: "2px solid var(--accent)", textWrap: "pretty",
              opacity: feedbackLoading && !session.feedback_text ? 0.6 : 1,
            }}>
              {session.feedback_text ?? "Putting together your feedback…"}
            </p>
          </div>
        )}

        {sortedSkills.length > 0 && (
          <div style={{ margin: "56px 0 0" }}>
            <p style={microLabel}>Skill breakdown</p>
            {sortedSkills.map(([skill, { total, correct }]) => (
              <SkillBar key={skill} label={skillLabel(skill)} accuracy={Math.round((correct / total) * 100)} detail={`${correct}/${total}`} />
            ))}
          </div>
        )}

        <div style={{ margin: "56px 0 0" }}>
          <p style={microLabel}>Question review</p>
          {answers
            .map((row, i) => ({ row, originalIndex: i }))
            // Missed questions first — they're the ones worth dwelling on; original numbering
            // (the actual order presented) is preserved via originalIndex, not this position.
            .sort((a, b) => Number(a.row.is_correct) - Number(b.row.is_correct))
            .map(({ row, originalIndex }) => {
              const q = row.question;
              if (!q) return null;

              const isGrid = q.question_type === "grid_in";
              const userAnswerDisplay = isGrid ? (row.user_grid_answer ?? "Skipped") : (row.user_answer ?? "Skipped");
              const correctAnswerDisplay = isGrid ? q.grid_answer : q.answer;
              const isExpanded = expandedIds.has(row.id);
              const passageShown = passageShownIds.has(row.id);

              if (!isExpanded) {
                return (
                  <div key={row.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "15px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 18 }}>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", fontVariantNumeric: "tabular-nums", width: 24 }}>Q{originalIndex + 1}</span>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--success)" }}>Correct</span>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)" }}>{skillLabel(coeMap[row.id] ?? q.skill)}</span>
                    </span>
                    <button
                      onClick={() => showQuestion(row.id)}
                      style={{ border: "1px solid var(--border)", background: "none", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", cursor: "pointer", padding: "6px 12px", borderRadius: "var(--radius-md)" }}
                    >
                      Show question
                    </button>
                  </div>
                );
              }

              return (
                <div key={row.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, padding: "0 0 34px", margin: "0 0 34px", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", margin: 0, fontVariantNumeric: "tabular-nums" }}>Q{originalIndex + 1}</p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: row.is_correct ? "var(--success)" : "var(--danger)", margin: "8px 0 0" }}>
                      {row.is_correct ? "Correct" : "Missed"}
                    </p>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, margin: "0 0 14px" }}>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)", margin: 0 }}>{skillLabel(coeMap[row.id] ?? q.skill)}</p>
                      <button
                        onClick={() => (passageShown ? hidePassage(row.id) : showQuestion(row.id))}
                        style={{ border: "1px solid var(--border)", background: "none", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", cursor: "pointer", padding: "5px 11px", borderRadius: "var(--radius-md)" }}
                      >
                        {passageShown ? "Hide question" : "Show question"}
                      </button>
                    </div>
                    <p style={{ fontSize: 19, lineHeight: 1.5, color: "var(--text-strong)", margin: "0 0 16px", maxWidth: "52ch" }}>{q.stem}</p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", margin: "0 0 18px" }}>
                      Your answer <span style={{ color: row.is_correct ? "var(--success)" : "var(--danger)" }}>{userAnswerDisplay}</span>
                      {!row.is_correct && <> · correct answer <span style={{ color: "var(--success)" }}>{correctAnswerDisplay}</span></>}
                    </p>
                    <p style={{ fontSize: 16, lineHeight: 1.68, color: "var(--text-muted)", margin: 0, maxWidth: "58ch", paddingLeft: 18, borderLeft: "1px solid var(--border)" }}>
                      {q.explanation}
                    </p>
                    {passageShown && (
                      <div style={{ margin: "24px 0 0", padding: 24, border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", background: "var(--surface)" }}>
                        {q.passage && (
                          <>
                            <p style={{ ...microLabel, margin: "0 0 14px" }}>Passage</p>
                            <p style={{ fontSize: 16, lineHeight: 1.75, color: "var(--text-body)", whiteSpace: "pre-wrap", textWrap: "pretty", margin: q.options ? "0 0 22px" : 0, maxWidth: "56ch" }}>{q.passage}</p>
                          </>
                        )}
                        {q.options && (
                          <div>
                            {(["A", "B", "C", "D"] as const).map((letter) => {
                              const state = letter === q.answer ? "correct" : letter === row.user_answer && letter !== q.answer ? "incorrect" : "muted";
                              return <AnswerOption key={letter} letter={letter} state={state} disabled>{q.options![letter]}</AnswerOption>;
                            })}
                          </div>
                        )}
                        {!q.passage && !q.options && (
                          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)", margin: 0 }}>No additional passage for this question.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {planDay && nextDay && nextPlanDay ? (
          <div style={{ margin: "64px 0 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-2xl)", padding: "36px 40px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 12px" }}>Tomorrow</p>
              <p style={{ fontSize: 25, color: "var(--text-strong)", margin: 0, letterSpacing: "-0.018em" }}>Day {nextDay} · {nextPlanDay.subject === "math" ? "Math" : "English"} — {nextPlanDay.focus}</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", margin: "10px 0 0" }}>Opens tomorrow</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <button onClick={() => router.push("/plan")} style={{ border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "14px 28px", borderRadius: "var(--radius-lg)", cursor: "pointer" }}>
                Back to my plan
              </button>
              <button onClick={() => router.push("/dashboard")} style={{ border: 0, background: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)", cursor: "pointer", padding: 0 }}>
                Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 24, margin: "64px 0 0" }}>
            <button onClick={() => router.push("/practice")} style={{ border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "15px 30px", borderRadius: "var(--radius-lg)", cursor: "pointer" }}>
              Practice again
            </button>
            <button onClick={() => router.push("/dashboard")} style={{ border: 0, background: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)", cursor: "pointer", padding: 0 }}>
              Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
