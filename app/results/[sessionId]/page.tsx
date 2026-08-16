"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar, LoadingScreen, SIDEBAR_WIDTH } from "@/components/ui/nav";
import { ScoreRing, SkillBar } from "@/components/ui/ds";
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
  question: {
    stem: string;
    answer: string;
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

      const { data: answerRows } = await supabase
        .from("answers").select("*, question:questions(*)").eq("session_id", sessionId).order("id");

      const rows: AnswerRow[] = answerRows ?? [];
      setAnswers(rows);

      const map: Record<string, { total: number; correct: number }> = {};
      rows.forEach((row) => {
        const skill = row.question?.skill as QuestionSkill | undefined;
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

  const totalCount = answers.length;
  const correctCount = answers.filter((r) => r.is_correct).length;
  const score = session.score ?? (totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0);
  const sortedSkills = Object.entries(skillMap).sort(([, a], [, b]) => a.correct / a.total - b.correct / b.total);
  const dateLine = session.completed_at ? new Date(session.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const title = planDay ? `${getPlanDay(planDay.day_number)?.subject === "math" ? "Math" : "English"} — ${getPlanDay(planDay.day_number)?.focus}` : (session.domain_filter === "both" ? "Reading & Writing" : session.domain_filter);
  const nextPlanDay = nextDay ? getPlanDay(nextDay) : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)" }}>
      <Sidebar />

      <main style={{ maxWidth: 1000 + SIDEBAR_WIDTH, marginLeft: SIDEBAR_WIDTH, marginRight: "auto", padding: "0 56px 96px" }}>
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
          {answers.map((row, i) => {
            const q = row.question;
            if (!q) return null;
            return (
              <div key={row.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, padding: "0 0 34px", margin: "0 0 34px", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", margin: 0, fontVariantNumeric: "tabular-nums" }}>Q{i + 1}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: row.is_correct ? "var(--success)" : "var(--danger)", margin: "8px 0 0" }}>
                    {row.is_correct ? "Correct" : "Missed"}
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 14px" }}>{skillLabel(q.skill)}</p>
                  <p style={{ fontSize: 19, lineHeight: 1.5, color: "var(--text-strong)", margin: "0 0 16px", maxWidth: "52ch" }}>{q.stem}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", margin: "0 0 18px" }}>
                    Your answer <span style={{ color: row.is_correct ? "var(--success)" : "var(--danger)" }}>{row.user_answer ?? "Skipped"}</span>
                    {!row.is_correct && <> · correct answer <span style={{ color: "var(--success)" }}>{q.answer}</span></>}
                  </p>
                  <p style={{ fontSize: 16, lineHeight: 1.68, color: "var(--text-muted)", margin: 0, maxWidth: "58ch", paddingLeft: 18, borderLeft: "1px solid var(--border)" }}>
                    {q.explanation}
                  </p>
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
