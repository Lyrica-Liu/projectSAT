"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AnswerOption, Input } from "@/components/ui/ds";
import { LoadingScreen, Wordmark } from "@/components/ui/nav";
import { Icon } from "@/components/ui/icon";
import { gradeGridAnswer } from "@/lib/grading";
import type { Question, Answer, Session } from "@/lib/types";

type AnswerChoice = "A" | "B" | "C" | "D";

interface QuestionState {
  question: Question;
  answer: Answer | null;
  selected: AnswerChoice | null;
  gridValue: string | null;
  correct: boolean | null;
  revealed: boolean;
  eliminated: AnswerChoice[];
}

/** Text-size steps for the passage/question/answer content, matching the real DSAT's "Aa" tool. */
const TEXT_SIZE_LEVELS = [1.15, 1.4, 1.7, 2.0];

const microLabel: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.16em",
  textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 22px",
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
  const [planDayNumber, setPlanDayNumber] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [showExit, setShowExit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [gridDraft, setGridDraft] = useState("");
  const [eliminateMode, setEliminateMode] = useState(false);
  const [textSizeIndex, setTextSizeIndex] = useState(0);
  const textMult = TEXT_SIZE_LEVELS[textSizeIndex];

  useEffect(() => {
    async function loadSession() {
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
      setSecondsLeft(Math.round((sessionData.question_count ?? 20) * 1.5 * 60));

      const { data: planDayRow } = await supabase
        .from("plan_days")
        .select("id, day_number")
        .eq("session_id", sessionId)
        .maybeSingle();
      setPlanLinked(!!planDayRow);
      if (planDayRow) {
        setPlanDayNumber(planDayRow.day_number);
      }

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
          gridValue: row.user_grid_answer,
          correct: row.is_correct,
          revealed: row.user_answer !== null || row.user_grid_answer !== null,
          eliminated: [],
        }))
      );

      setLoading(false);
    }
    loadSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (secondsLeft == null) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s != null && s > 0 ? s - 1 : s));
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft == null]);

  const [gridSyncKey, setGridSyncKey] = useState<{ i: number; qs: QuestionState[] } | null>(null);
  if (gridSyncKey === null || gridSyncKey.i !== currentIndex || gridSyncKey.qs !== questions) {
    setGridSyncKey({ i: currentIndex, qs: questions });
    setGridDraft(questions[currentIndex]?.gridValue ?? "");
  }

  async function selectAnswer(choice: AnswerChoice) {
    const state = questions[currentIndex];
    if (state.revealed) return;

    const isCorrect = choice === state.question.answer;
    setQuestions((prev) =>
      prev.map((q, i) => (i === currentIndex ? { ...q, selected: choice, correct: isCorrect, revealed: true } : q))
    );

    await supabase
      .from("answers")
      .update({ user_answer: choice, is_correct: isCorrect })
      .eq("session_id", sessionId)
      .eq("question_id", state.question.id);
  }

  async function submitGridAnswer() {
    const state = questions[currentIndex];
    if (state.revealed || !gridDraft.trim()) return;

    const isCorrect = gradeGridAnswer(gridDraft, state.question.grid_answer ?? "");
    setQuestions((prev) =>
      prev.map((q, i) => (i === currentIndex ? { ...q, gridValue: gridDraft, correct: isCorrect, revealed: true } : q))
    );

    await supabase
      .from("answers")
      .update({ user_grid_answer: gridDraft, is_correct: isCorrect })
      .eq("session_id", sessionId)
      .eq("question_id", state.question.id);
  }

  function toggleEliminate(letter: AnswerChoice) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== currentIndex) return q;
        const eliminated = q.eliminated.includes(letter)
          ? q.eliminated.filter((l) => l !== letter)
          : [...q.eliminated, letter];
        return { ...q, eliminated };
      })
    );
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
      router.push(`/plan/${planDayNumber}`);
      return;
    } else {
      const correct = questions.filter((q) => q.correct);
      const score = Math.round((correct.length / questions.length) * 100);
      await supabase
        .from("sessions")
        .update({ completed_at: new Date().toISOString(), score })
        .eq("id", sessionId);
    }
    router.push(`/results/${sessionId}`);
  }

  function leaveSession() {
    router.push("/plan");
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
            { question: body.question, answer: body.answer, selected: null, gridValue: null, correct: null, revealed: false, eliminated: [] },
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
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", background: "var(--danger-surface)", padding: "12px 18px", maxWidth: 400, textAlign: "center" }}>
          {error}
        </div>
        <button onClick={() => router.push("/dashboard")} style={{ border: 0, background: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)", cursor: "pointer" }}>← Back to dashboard</button>
      </div>
    );
  }

  const current = questions[currentIndex];
  const sessionTarget = session?.question_count ?? questions.length;
  const answeredCount = questions.filter((q) => q.selected !== null || q.gridValue !== null).length;
  const allAnswered = answeredCount === sessionTarget && questions.length === sessionTarget;
  const atFrontier = currentIndex === questions.length - 1;
  const hasMoreToGenerate = questions.length < sessionTarget;
  const hasPassage = !!current.question.passage;

  type AnswerState = "default" | "selected" | "correct" | "incorrect" | "muted";
  function stateFor(letter: AnswerChoice): AnswerState {
    if (!current.revealed) return current.selected === letter ? "selected" : "default";
    if (letter === (current.question.answer as AnswerChoice)) return "correct";
    if (letter === current.selected) return "incorrect";
    return "muted";
  }

  const mm = secondsLeft != null ? Math.floor(secondsLeft / 60) : 0;
  const ss = secondsLeft != null ? secondsLeft % 60 : 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", color: "var(--text-body)", fontFamily: "var(--font-serif)" }}>
      <style>{`.qa-grid-input label { font-size: ${14 * textMult}px !important; }`}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--canvas)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 44px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, height: 64 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            <Wordmark href="/dashboard" />
            <span style={{ width: 1, height: 16, background: "var(--line-strong)" }} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-faint)" }}>
              {planLinked ? `Day ${planDayNumber}` : "Extra practice"}
            </span>
          </span>

          <span style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
            {questions.map((q, i) => {
              const isCur = i === currentIndex;
              const answered = q.selected !== null || q.gridValue !== null;
              return (
                <button key={i} onClick={() => setCurrentIndex(i)} style={{
                  width: 26, height: 26, border: `1px solid ${isCur ? "var(--text-strong)" : answered ? "var(--line-strong)" : "var(--border)"}`,
                  background: answered && !isCur ? "var(--surface-2)" : "transparent", borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-sans)", fontSize: 11, fontVariantNumeric: "tabular-nums",
                  color: isCur ? "var(--text-strong)" : answered ? "var(--text-muted)" : "var(--text-faint)",
                  fontWeight: isCur ? 600 : 400, cursor: "pointer",
                }}>
                  {i + 1}
                </button>
              );
            })}
          </span>

          <span style={{ display: "inline-flex", alignItems: "center", gap: 24, flexShrink: 0 }}>
            {secondsLeft != null && (
              <span style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500, color: "var(--text-strong)", fontVariantNumeric: "tabular-nums", lineHeight: 1, letterSpacing: "-0.01em" }}>
                  {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
                </span>
                <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)", marginTop: 5 }}>remaining</span>
              </span>
            )}
            {planLinked && (
              <button onClick={() => setShowExit(true)} style={{ border: "1px solid var(--border)", background: "none", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", cursor: "pointer", padding: "7px 13px", borderRadius: "var(--radius-md)" }}>Exit</button>
            )}
          </span>
        </div>
        <div style={{ height: 2, background: "var(--surface-2)" }}>
          <div style={{ width: `${sessionTarget > 0 ? (answeredCount / sessionTarget) * 100 : 0}%`, height: "100%", background: "var(--brand)", transition: "width 0.4s var(--ease-out)" }} />
        </div>
      </header>

      {/* Toolbar */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "8px 44px" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", marginRight: 4 }}>Text size</span>
            {TEXT_SIZE_LEVELS.map((lvl, i) => (
              <button key={lvl} onClick={() => setTextSizeIndex(i)} aria-label={`Text size ${i + 1}`} style={{
                width: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center",
                border: `1px solid ${textSizeIndex === i ? "var(--text-strong)" : "var(--border)"}`,
                background: textSizeIndex === i ? "var(--surface-sunken)" : "transparent", borderRadius: "var(--radius-sm)",
                cursor: "pointer", color: textSizeIndex === i ? "var(--text-strong)" : "var(--text-faint)",
                fontFamily: "var(--font-sans)", fontSize: 10 + i * 2,
              }}>A</button>
            ))}
          </div>
          <button onClick={() => setEliminateMode((v) => !v)} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            border: `1px solid ${eliminateMode ? "var(--text-strong)" : "var(--border)"}`,
            background: eliminateMode ? "var(--surface-sunken)" : "transparent",
            color: eliminateMode ? "var(--text-strong)" : "var(--text-faint)",
            borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 11,
            padding: "5px 12px", cursor: "pointer",
          }}>
            <Icon name="ban" size={13} />
            Answer Eliminator
          </button>
        </div>
      </div>

      {/* Reading desk */}
      <main style={{ maxWidth: 1360, margin: "0 auto", padding: "0 44px" }}>
        <div style={{ display: "grid", gridTemplateColumns: hasPassage ? "1fr 1fr" : "1fr" }}>
          {hasPassage && (
            <div style={{ height: "calc(100vh - 66px)", overflowY: "auto", padding: "52px 56px 72px 0", borderRight: "1px solid var(--border)" }}>
              <p style={microLabel}>Passage</p>
              <p style={{ fontSize: 18 * textMult / 14, lineHeight: 1.8, color: "var(--text-body)", margin: 0, maxWidth: "34rem", whiteSpace: "pre-wrap", textWrap: "pretty" }}>
                {current.question.passage}
              </p>
            </div>
          )}
          <div style={{ height: "calc(100vh - 66px)", overflowY: "auto", padding: hasPassage ? "52px 0 72px 56px" : "52px 0 72px" }}>
            <div style={{ maxWidth: "34rem", margin: hasPassage ? 0 : "0 auto" }}>
              <p style={microLabel}>{current.question.skill.replace(/_/g, " ")} · {current.question.difficulty}</p>
              <p style={{ fontSize: 18 * textMult, lineHeight: 1.48, letterSpacing: "-0.008em", color: "var(--text-strong)", margin: "0 0 32px", textWrap: "pretty" }}>
                {current.question.stem}
              </p>

              {current.question.question_type === "grid_in" ? (
                <div className="qa-grid-input" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 280 }}>
                  <Input
                    label="Your answer"
                    placeholder="e.g. 17/4 or 4.25"
                    value={current.revealed ? (current.gridValue ?? "") : gridDraft}
                    disabled={current.revealed}
                    style={{ fontSize: 14 * textMult }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGridDraft(e.target.value)}
                  />
                  {!current.revealed && (
                    <button onClick={submitGridAnswer} disabled={!gridDraft.trim()} style={{
                      alignSelf: "flex-start", border: 0, background: "var(--brand)", color: "var(--text-on-brand)",
                      fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, padding: "11px 22px",
                      borderRadius: "var(--radius-lg)", cursor: gridDraft.trim() ? "pointer" : "default",
                      opacity: gridDraft.trim() ? 1 : 0.5,
                    }}>
                      Check answer
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  {(["A", "B", "C", "D"] as AnswerChoice[]).map((c) => {
                    const isEliminated = current.eliminated.includes(c);
                    return (
                      <div key={c} style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
                        {eliminateMode && (
                          <button
                            onClick={() => toggleEliminate(c)}
                            disabled={current.revealed}
                            aria-label={isEliminated ? `Restore option ${c}` : `Eliminate option ${c}`}
                            style={{
                              flexShrink: 0, width: 34, margin: "2px 0", borderRadius: "var(--radius-sm)",
                              border: `1px solid ${isEliminated ? "var(--text-strong)" : "var(--border)"}`,
                              background: isEliminated ? "var(--surface-sunken)" : "transparent",
                              color: isEliminated ? "var(--text-strong)" : "var(--text-faint)",
                              cursor: current.revealed ? "default" : "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            <Icon name="ban" size={13} />
                          </button>
                        )}
                        <div style={{ flex: 1 }}>
                          <AnswerOption letter={c} state={stateFor(c)} disabled={current.revealed} onClick={() => selectAnswer(c)}>
                            <span style={{ fontSize: 17 * textMult / 14, textDecoration: isEliminated ? "line-through" : "none", opacity: isEliminated ? 0.55 : 1 }}>
                              {current.question.options?.[c]}
                            </span>
                          </AnswerOption>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {current.revealed && (
                <div style={{
                  margin: "30px 0 0", background: current.correct ? "var(--moss-50)" : "var(--claret-50)",
                  borderLeft: `2px solid ${current.correct ? "var(--success)" : "var(--danger)"}`,
                  borderRadius: "0 var(--radius-md) var(--radius-md) 0", padding: "20px 22px",
                }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: current.correct ? "var(--success)" : "var(--danger)", margin: "0 0 10px" }}>
                    {current.correct ? "Correct" : "Not quite"}
                  </p>
                  {!current.correct && current.question.question_type === "grid_in" && (
                    <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14 * textMult, margin: "0 0 8px", color: "var(--text-body)" }}>
                      Correct answer: {current.question.grid_answer}
                    </p>
                  )}
                  <p style={{ fontSize: 15 * textMult / 14, lineHeight: 1.68, margin: 0, color: "var(--text-body)" }}>
                    {current.question.explanation}
                  </p>
                </div>
              )}

              {actionError && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", margin: "20px 0 0" }}>{actionError}</p>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 24, margin: "32px 0 0" }}>
                {currentIndex > 0 && (
                  <button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} style={{ border: 0, background: "none", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", cursor: "pointer", padding: 0 }}>
                    ← Previous
                  </button>
                )}
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 24 }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>Question {currentIndex + 1} of {sessionTarget}</span>
                  {atFrontier && !hasMoreToGenerate ? (
                    <button onClick={finishSession} disabled={submitting || !allAnswered} style={{
                      border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)",
                      fontSize: 14, fontWeight: 500, padding: "13px 26px", borderRadius: "var(--radius-lg)",
                      cursor: submitting || !allAnswered ? "default" : "pointer", opacity: submitting || !allAnswered ? 0.5 : 1,
                    }}>
                      {submitting ? "Saving…" : "Finish session"}
                    </button>
                  ) : (
                    <button onClick={goNext} disabled={generatingNext || (atFrontier && hasMoreToGenerate && !current.revealed)} style={{
                      border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)",
                      fontSize: 14, fontWeight: 500, padding: "13px 26px", borderRadius: "var(--radius-lg)",
                      cursor: "pointer", opacity: generatingNext || (atFrontier && hasMoreToGenerate && !current.revealed) ? 0.5 : 1,
                    }}>
                      {generatingNext ? "Loading…" : atFrontier ? "Next question" : "Next"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showExit && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--overlay)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-2xl)", padding: "40px 40px 34px", maxWidth: 420 }}>
            <h2 style={{ fontWeight: 400, fontSize: 27, lineHeight: 1.15, color: "var(--text-strong)", margin: "0 0 12px" }}>Leave the module?</h2>
            <p style={{ fontSize: 16, lineHeight: 1.62, color: "var(--text-muted)", margin: "0 0 28px" }}>
              Your answers so far are already saved, so you can pick up right where you left off — today&apos;s day just won&apos;t be marked complete yet.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <button onClick={() => setShowExit(false)} style={{ border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "13px 26px", borderRadius: "var(--radius-lg)", cursor: "pointer" }}>
                Keep going
              </button>
              <button onClick={leaveSession} style={{ border: 0, background: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-faint)", cursor: "pointer", padding: 0 }}>
                Leave anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
