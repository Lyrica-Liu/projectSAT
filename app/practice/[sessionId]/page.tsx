"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Question, Answer, Session } from "@/lib/types";

type AnswerChoice = "A" | "B" | "C" | "D";

interface QuestionState {
  question: Question;
  answer: Answer | null;
  selected: AnswerChoice | null;
  revealed: boolean;
}

export default function ActiveSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    const { data: sessionData, error: sErr } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
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

    const { data: answerRows } = await supabase
      .from("answers")
      .select("*, question:questions(*)")
      .eq("session_id", sessionId)
      .order("id");

    if (!answerRows || answerRows.length === 0) {
      const { data: questionPool } = await supabase
        .from("questions")
        .select("*")
        .order("created_at")
        .limit(sessionData.question_count);

      if (!questionPool || questionPool.length === 0) {
        setError("No questions available yet. Check back soon!");
        setLoading(false);
        return;
      }

      const { data: newAnswers } = await supabase
        .from("answers")
        .insert(
          questionPool.map((q: Question) => ({
            session_id: sessionId,
            question_id: q.id,
          }))
        )
        .select("*");

      setQuestions(
        (questionPool as Question[]).map((q, i) => ({
          question: q,
          answer: newAnswers?.[i] ?? null,
          selected: null,
          revealed: false,
        }))
      );
    } else {
      setQuestions(
        answerRows.map((row: Answer & { question: Question }) => ({
          question: row.question,
          answer: row,
          selected: row.user_answer as AnswerChoice | null,
          revealed: row.user_answer !== null,
        }))
      );
    }

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
      prev.map((q, i) =>
        i === currentIndex ? { ...q, selected: choice, revealed: true } : q
      )
    );

    await supabase
      .from("answers")
      .update({
        user_answer: choice,
        is_correct: isCorrect,
      })
      .eq("session_id", sessionId)
      .eq("question_id", state.question.id);
  }

  async function finishSession() {
    setSubmitting(true);
    const correct = questions.filter((q) => q.selected === q.question.answer);
    const score = Math.round((correct.length / questions.length) * 100);

    await supabase
      .from("sessions")
      .update({
        completed_at: new Date().toISOString(),
        score,
      })
      .eq("id", sessionId);

    router.push(`/results/${sessionId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading session…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          ← Back to dashboard
        </button>
      </div>
    );
  }

  const current = questions[currentIndex];
  const answeredCount = questions.filter((q) => q.selected !== null).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const allAnswered = answeredCount === questions.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900">
              Q{currentIndex + 1}
            </span>
            <span className="text-sm text-slate-400">of {questions.length}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">
              {answeredCount}/{questions.length} answered
            </span>
            {allAnswered && (
              <button
                onClick={finishSession}
                disabled={submitting}
                className="bg-indigo-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Finish →"}
              </button>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Question navigator */}
      <div className="bg-white border-b border-slate-100 px-6 py-3">
        <div className="max-w-3xl mx-auto flex gap-1.5 flex-wrap">
          {questions.map((q, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                i === currentIndex
                  ? "bg-indigo-600 text-white shadow-sm"
                  : q.selected !== null
                  ? q.selected === q.question.answer
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        {/* Skill badges */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full capitalize">
            {current.question.domain}
          </span>
          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full capitalize">
            {current.question.skill.replace(/_/g, " ")}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
              current.question.difficulty === "easy"
                ? "bg-emerald-50 text-emerald-700"
                : current.question.difficulty === "medium"
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {current.question.difficulty}
          </span>
        </div>

        {/* Passage */}
        {current.question.passage && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Passage
            </p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {current.question.passage}
            </p>
          </div>
        )}

        {/* Question stem */}
        <p className="text-base font-semibold text-slate-900 mb-5 leading-relaxed">
          {current.question.stem}
        </p>

        {/* Answer options */}
        <div className="flex flex-col gap-3 mb-8">
          {(["A", "B", "C", "D"] as AnswerChoice[]).map((choice) => {
            const optionText = current.question.options[choice];
            const isSelected = current.selected === choice;
            const isCorrect = choice === current.question.answer;
            const revealed = current.revealed;

            let className = "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm";
            if (revealed) {
              if (isCorrect) className = "bg-emerald-50 border-emerald-400 text-emerald-800";
              else if (isSelected && !isCorrect) className = "bg-red-50 border-red-400 text-red-800";
              else className = "bg-white border-slate-200 text-slate-400";
            } else if (isSelected) {
              className = "bg-indigo-50 border-indigo-400 text-indigo-800";
            }

            return (
              <button
                key={choice}
                onClick={() => selectAnswer(choice)}
                disabled={revealed}
                className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border text-sm text-left transition-all ${className} disabled:cursor-default`}
              >
                <span className="font-bold shrink-0 w-5 mt-0.5">{choice}.</span>
                <span className="leading-relaxed">{optionText}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {current.revealed && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Explanation
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {current.question.explanation}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-30"
          >
            ← Previous
          </button>
          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="text-sm font-semibold bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={finishSession}
              disabled={submitting || !allAnswered}
              className="text-sm font-semibold bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40"
            >
              {submitting ? "Saving…" : "Finish session →"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
