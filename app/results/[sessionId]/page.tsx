"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppNav, LoadingScreen } from "@/components/ui/nav";
import { Card, Badge, ScoreRing, SkillBar, Button } from "@/components/ui/ds";
import { Icon } from "@/components/ui/icon";
import { getPlanDay, getCurrentPlanDay } from "@/lib/plan";
import type { QuestionSkill, PlanDayRow } from "@/lib/types";

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

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: 600,
  letterSpacing: "var(--tracking-caps)", textTransform: "uppercase",
  color: "var(--text-faint)", margin: "0 0 10px", display: "block",
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
  } | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [skillMap, setSkillMap] = useState<Record<string, { total: number; correct: number }>>({});
  const [planDay, setPlanDay] = useState<PlanDayRow | null>(null);
  const [nextDay, setNextDay] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data: sessionData } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (!sessionData) {
        router.replace("/dashboard");
        return;
      }
      if (!sessionData.completed_at) {
        router.replace(`/practice/${sessionId}`);
        return;
      }

      setSession(sessionData);

      const { data: answerRows } = await supabase
        .from("answers")
        .select("*, question:questions(*)")
        .eq("session_id", sessionId)
        .order("id");

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

      // Mark plan day complete if this session belongs to one
      const { data: pdRow } = await supabase
        .from("plan_days")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (pdRow) {
        setPlanDay(pdRow as PlanDayRow);
        if (!pdRow.completed_at) {
          const sessionScore = sessionData.score ??
            (rows.length > 0 ? Math.round(rows.filter((r) => r.is_correct).length / rows.length * 100) : 0);
          await supabase
            .from("plan_days")
            .update({ completed_at: new Date().toISOString(), score: sessionScore })
            .eq("id", pdRow.id);

          // Find next unlocked day
          const { data: allRows } = await supabase
            .from("plan_days")
            .select("day_number, completed_at")
            .eq("user_id", user.id);
          const doneNums = (allRows ?? [])
            .filter((r) => r.completed_at || r.day_number === pdRow.day_number)
            .map((r) => r.day_number);
          const next = getCurrentPlanDay(doneNums);
          if (next <= 30) setNextDay(next);
        } else {
          // Already marked — find next day
          const { data: allRows } = await supabase
            .from("plan_days")
            .select("day_number, completed_at")
            .eq("user_id", user.id);
          const doneNums = (allRows ?? []).filter((r) => r.completed_at).map((r) => r.day_number);
          const next = getCurrentPlanDay(doneNums);
          if (next <= 30) setNextDay(next);
        }
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

  const sortedSkills = Object.entries(skillMap).sort(
    ([, a], [, b]) => a.correct / a.total - b.correct / b.total
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
      <AppNav maxWidth={720} />

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* Score hero */}
        <Card tone="surface" padding="xl" radius="xl" shadow="md" style={{ marginBottom: 20, textAlign: "center" }}>
          <span style={eyebrow}>
            {planDay
              ? `Day ${planDay.day_number} complete 🎉`
              : "Session complete 🎉"}
          </span>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <ScoreRing score={score} size={140} />
          </div>
          <p style={{
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-md)",
            color: "var(--text-strong)", margin: "0 0 6px",
          }}>
            {correctCount} of {totalCount} correct
          </p>
          {planDay && (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--brand)", fontWeight: 600, margin: "0 0 4px" }}>
              {getPlanDay(planDay.day_number)?.focus}
            </p>
          )}
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: 0, textTransform: "capitalize" }}>
            {session.domain_filter === "both" ? "Reading & Writing" : session.domain_filter}
          </p>
        </Card>

        {/* Plan day next-step CTA */}
        {planDay && nextDay && (
          <Card tone="lilac" padding="lg" radius="xl" shadow="sm" style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--brand-ink)", margin: "0 0 3px" }}>
                Day {nextDay} is now unlocked
              </p>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: 0 }}>
                {getPlanDay(nextDay)?.focus} · {getPlanDay(nextDay)?.subject === "english" ? "English" : "Math"}
              </p>
            </div>
            <Link href={`/plan/${nextDay}`} style={{
              display: "inline-flex", alignItems: "center", padding: "8px 16px",
              background: "var(--brand)", color: "#fff",
              fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)",
              borderRadius: "var(--radius-pill)", textDecoration: "none", flexShrink: 0,
            }}>
              Begin Day {nextDay} →
            </Link>
          </Card>
        )}

        {/* AI Feedback */}
        {session.feedback_text && (
          <Card tone="lilac" padding="lg" radius="xl" shadow="none" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Icon name="sparkles" size={16} color="var(--brand-ink)" />
              <span style={{ ...eyebrow, margin: 0, color: "var(--brand-ink)" }}>AI Feedback</span>
            </div>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)",
              color: "var(--brand-ink)", lineHeight: "var(--leading-relaxed)",
              margin: 0, whiteSpace: "pre-wrap",
            }}>
              {session.feedback_text}
            </p>
          </Card>
        )}

        {/* Skill breakdown */}
        {sortedSkills.length > 0 && (
          <Card tone="surface" padding="lg" radius="xl" shadow="sm" style={{ marginBottom: 20 }}>
            <h2 style={{
              fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)",
              color: "var(--text-strong)", margin: "0 0 20px",
            }}>Skill breakdown</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {sortedSkills.map(([skill, { total, correct }]) => {
                const pct = Math.round((correct / total) * 100);
                return (
                  <SkillBar
                    key={skill}
                    label={SKILL_LABELS[skill as QuestionSkill] ?? skill}
                    accuracy={pct}
                    detail={`${correct}/${total}`}
                  />
                );
              })}
            </div>
          </Card>
        )}

        {/* Question review */}
        <Card tone="surface" padding="lg" radius="xl" shadow="sm" style={{ marginBottom: 20 }}>
          <h2 style={{
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)",
            color: "var(--text-strong)", margin: "0 0 20px",
          }}>Question review</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {answers.map((row, i) => {
              const q = row.question;
              if (!q) return null;
              return (
                <Card
                  key={row.id}
                  tone={row.is_correct ? "mint" : "rose"}
                  padding="lg"
                  radius="lg"
                  shadow="none"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                    <Badge tone={row.is_correct ? "mint" : "rose"}>{row.is_correct ? "Correct" : "Incorrect"}</Badge>
                    <Badge tone="lilac">Q{i + 1}</Badge>
                    <Badge tone="sky">{q.skill?.replace(/_/g, " ")}</Badge>
                  </div>
                  <p style={{
                    fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)",
                    color: "var(--text-strong)", margin: "0 0 10px", lineHeight: "var(--leading-snug)",
                  }}>{q.stem}</p>
                  <div style={{
                    fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)",
                    color: "var(--text-muted)", display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 10,
                  }}>
                    <span>
                      Your answer:{" "}
                      <strong style={{ color: row.is_correct ? "var(--success)" : "var(--danger)" }}>
                        {row.user_answer ?? "Skipped"}
                      </strong>
                    </span>
                    {!row.is_correct && (
                      <span>
                        Correct: <strong style={{ color: "var(--success)" }}>{q.answer}</strong>
                      </span>
                    )}
                  </div>
                  <div style={{
                    background: "rgba(255,255,255,0.7)", borderRadius: "var(--radius-sm)",
                    padding: "10px 14px",
                  }}>
                    <p style={{
                      fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)",
                      color: "var(--text-body)", lineHeight: "var(--leading-relaxed)", margin: 0,
                    }}>{q.explanation}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <Button full size="lg" onClick={() => router.push("/practice")} iconRight={<Icon name="arrow-right" size={18} />}>
            Practice again
          </Button>
          <Button full size="lg" variant="secondary" onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
