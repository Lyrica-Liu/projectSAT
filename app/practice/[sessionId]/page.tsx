"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge, Card, ProgressBar, AnswerOption, Button } from "@/components/ui/ds";
import { LoadingScreen } from "@/components/ui/nav";
import { Icon } from "@/components/ui/icon";
import type { Question, Answer, Session } from "@/lib/types";

type AnswerChoice = "A" | "B" | "C" | "D";

interface QuestionState {
  question: Question;
  answer: Answer | null;
  selected: AnswerChoice | null;
  revealed: boolean;
}

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: 600,
  letterSpacing: "var(--tracking-caps)", textTransform: "uppercase",
  color: "var(--text-faint)", margin: "0 0 10px", display: "block",
};

export default function ActiveSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingNext, setGeneratingNext] = useState(false);
  const [planLinked, setPlanLinked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/auth");
      return;
    }

    const { data: sessionData, error: sErr } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sErr || !sessionData) {
      setError("Session not found.");
      setLoading(false);
      return;
    }

    if (sessionData.completed_at) {
      router.replace(`/results/${sessionId}`);
      return;
    }

    setSession(sessionData);

    const { data: planDayRow } = await supabase
      .from("plan_days")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();
    setPlanLinked(!!planDayRow);

    const { data: answerRows } = await supabase
      .from("answers")
      .select("*, question:questions(*)")
      .eq("session_id", sessionId)
      .order("position");

    if (!answerRows || answerRows.length === 0) {
      setError("Session data missing. Please start a new session.");
      setLoading(false);
      return;
    }

    setQuestions(
      answerRows.map((row: Answer & { question: Question }) => ({
        question: row.question,
        answer: row,
        selected: row.user_answer as AnswerChoice | null,
        revealed: row.user_answer !== null,
      }))
    );

    setLoading(false);
  }, [sessionId, supabase, router]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  async function selectAnswer(choice: AnswerChoice) {
    const state = questions[currentIndex];
    if (state.revealed) return;

    const isCorrect = choice === state.question.answer;
    setQuestions((prev) =>
      prev.map((q, i) => (i === currentIndex ? { ...q, selected: choice, revealed: true } : q))
    );

    await supabase
      .from("answers")
      .update({ user_answer: choice, is_correct: isCorrect })
      .eq("session_id", sessionId)
      .eq("question_id", state.question.id);
  }

  async function finishSession() {
    setSubmitting(true);
    if (planLinked) {
      const res = await fetch("/api/finish-plan-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setActionError(body.error ?? "Could not finish session.");
        setSubmitting(false);
        return;
      }
    } else {
      const correct = questions.filter((q) => q.selected === q.question.answer);
      const score = Math.round((correct.length / questions.length) * 100);
      await supabase
        .from("sessions")
        .update({ completed_at: new Date().toISOString(), score })
        .eq("id", sessionId);
    }
    router.push(`/results/${sessionId}`);
  }

  async function goNext() {
    const target = session?.question_count ?? questions.length;
    const atFrontier = currentIndex === questions.length - 1;

    if (atFrontier && questions.length < target) {
      setGeneratingNext(true);
      setActionError(null);
      try {
        const res = await fetch("/api/plan-next-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Could not load the next question.");
        if (body.question && body.answer) {
          setQuestions((prev) => [
            ...prev,
            { question: body.question, answer: body.answer, selected: null, revealed: false },
          ]);
          setCurrentIndex((i) => i + 1);
        }
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Could not load the next question.");
      } finally {
        setGeneratingNext(false);
      }
      return;
    }

    setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
  }

  if (loading) return <LoadingScreen message="Loading session…" />;

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--canvas)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px" }}>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--danger)", background: "var(--danger-surface)", borderRadius: "var(--radius-md)", padding: "12px 18px", maxWidth: 400, textAlign: "center" }}>
          {error}
        </div>
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>← Back to dashboard</Button>
      </div>
    );
  }

  const current = questions[currentIndex];
  const sessionTarget = session?.question_count ?? questions.length;
  const answeredCount = questions.filter((q) => q.selected !== null).length;
  const allAnswered = answeredCount === sessionTarget && questions.length === sessionTarget;
  const atFrontier = currentIndex === questions.length - 1;
  const hasMoreToGenerate = questions.length < sessionTarget;
  const diffTone =
    current.question.difficulty === "easy" ? "mint"
    : current.question.difficulty === "medium-low" ? "sky"
    : current.question.difficulty === "medium-high" ? "butter"
    : "rose";

  type AnswerState = "default" | "selected" | "correct" | "incorrect" | "muted";
  function stateFor(letter: AnswerChoice): AnswerState {
    if (!current.revealed) return current.selected === letter ? "selected" : "default";
    if (letter === (current.question.answer as AnswerChoice)) return "correct";
    if (letter === current.selected) return "incorrect";
    return "muted";
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", display: "flex", flexDirection: "column" }}>
      {/* Sticky header */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-strong)" }}>
            Q{currentIndex + 1}{" "}
            <span style={{ color: "var(--text-faint)", fontWeight: 500 }}>of {sessionTarget}</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>
              {answeredCount}/{sessionTarget} answered
            </span>
            {allAnswered && (
              <Button size="sm" onClick={finishSession} disabled={submitting}>
                {submitting ? "Saving…" : "Finish →"}
              </Button>
            )}
          </div>
        </div>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 12px" }}>
          <ProgressBar value={sessionTarget > 0 ? (answeredCount / sessionTarget) * 100 : 0} height={6} />
        </div>
      </header>

      {/* Question navigator */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "12px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {questions.map((q, i) => {
            const isCur = i === currentIndex;
            const answered = q.selected !== null;
            const correct = answered && q.selected === q.question.answer;
            let bg = "var(--surface-sunken)", col = "var(--text-muted)";
            if (isCur) { bg = "var(--lilac-500)"; col = "#fff"; }
            else if (answered) { bg = correct ? "var(--mint-surface)" : "var(--rose-surface)"; col = correct ? "var(--mint-ink)" : "var(--rose-ink)"; }
            return (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                style={{
                  width: 34, height: 34, borderRadius: 9, border: "none", cursor: "pointer",
                  fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "var(--text-xs)",
                  background: bg, color: col,
                  transition: "all var(--dur-base) var(--ease-out)",
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "30px 24px 48px" }}>
        {/* Skill badges */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <Badge tone="sky">{current.question.domain}</Badge>
          <Badge tone="lilac">{current.question.skill.replace(/_/g, " ")}</Badge>
          <Badge tone={diffTone} dot>{current.question.difficulty}</Badge>
        </div>

        {/* Passage */}
        {current.question.passage && (
          <Card tone="sunken" padding="lg" radius="lg" shadow="none" style={{ marginBottom: 22 }}>
            <span style={eyebrow}>Passage</span>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-body)",
              lineHeight: "var(--leading-relaxed)", margin: 0, whiteSpace: "pre-wrap",
            }}>
              {current.question.passage}
            </p>
          </Card>
        )}

        {/* Question stem */}
        <p style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-md)",
          color: "var(--text-strong)", lineHeight: "var(--leading-snug)", margin: "0 0 18px",
        }}>
          {current.question.stem}
        </p>

        {/* Answer options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {(["A", "B", "C", "D"] as AnswerChoice[]).map((c) => (
            <AnswerOption
              key={c}
              letter={c}
              state={stateFor(c)}
              disabled={current.revealed}
              onClick={() => selectAnswer(c)}
            >
              {current.question.options[c]}
            </AnswerOption>
          ))}
        </div>

        {/* Explanation */}
        {current.revealed && (
          <Card
            tone={current.selected === current.question.answer ? "mint" : "rose"}
            padding="lg"
            radius="lg"
            shadow="none"
            style={{ marginBottom: 24 }}
          >
            <span style={{ ...eyebrow, opacity: 0.8, color: "inherit" }}>
              {current.selected === current.question.answer ? "Nice — correct!" : "Not quite"}
            </span>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)",
              lineHeight: "var(--leading-relaxed)", margin: 0, color: "inherit",
            }}>
              {current.question.explanation}
            </p>
          </Card>
        )}

        {/* Navigation */}
        {actionError && (
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--danger)",
            background: "var(--danger-surface)", borderRadius: "var(--radius-md)",
            padding: "10px 14px", margin: "0 0 14px",
          }}>
            {actionError}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Button
            variant="ghost"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            iconLeft={<Icon name="arrow-left" size={17} />}
          >
            Previous
          </Button>
          {atFrontier && !hasMoreToGenerate ? (
            <Button
              onClick={finishSession}
              disabled={submitting || !allAnswered}
              iconRight={<Icon name="arrow-right" size={17} />}
            >
              {submitting ? "Saving…" : "Finish session"}
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={goNext}
              disabled={generatingNext || (atFrontier && hasMoreToGenerate && !current.revealed)}
              iconRight={<Icon name="arrow-right" size={17} />}
            >
              {generatingNext ? "Loading…" : "Next"}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
