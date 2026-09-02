"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AnswerOption, Input } from "@/components/ui/ds";
import { LoadingScreen, Wordmark } from "@/components/ui/nav";
import { Icon } from "@/components/ui/icon";
import { gradeGridAnswer } from "@/lib/grading";
import type { Question, Answer, Session } from "@/lib/types";

type AnswerChoice = "A" | "B" | "C" | "D";

interface Highlight {
  start: number;
  end: number;
  color: string;
}

interface QuestionState {
  question: Question;
  answer: Answer | null;
  selected: AnswerChoice | null;
  gridValue: string | null;
  eliminated: AnswerChoice[];
  highlights: Record<string, Highlight[]>;
}

/** Text-size steps for the passage/question/answer content — stepped with "− A +", matching the real DSAT's "Aa" tool. */
const TEXT_SIZE_LEVELS = [0.85, 1.0, 1.15, 1.4, 1.7, 2.0];
const DEFAULT_TEXT_SIZE_INDEX = 2;

const HIGHLIGHT_COLORS = ["#fde68a", "#bbf7d0", "#bfdbfe", "#fbcfe8"];

/**
 * Persists the countdown locally so it resumes exactly where it was left, rather than either
 * resetting or ticking down while the tab was closed. localStorage can throw in some contexts
 * (private browsing, a sandboxed preview iframe) — if that happened inside the timer's own
 * setState updater it would silently stop React from committing the tick at all, freezing the
 * clock with no visible error, so every access here is guarded.
 */
function timerStorageKey(sessionId: string) {
  return `practice-timer-${sessionId}`;
}

function readTimer(sessionId: string): number | null {
  try {
    const raw = window.localStorage.getItem(timerStorageKey(sessionId));
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  } catch {
    return null;
  }
}

function writeTimer(sessionId: string, seconds: number) {
  try {
    window.localStorage.setItem(timerStorageKey(sessionId), String(seconds));
  } catch {
    // Storage unavailable — the countdown still ticks in memory for this page view,
    // it just won't resume from this exact point on the next visit.
  }
}

function clearTimer(sessionId: string) {
  try {
    window.localStorage.removeItem(timerStorageKey(sessionId));
  } catch {
    // ignore
  }
}

const microLabel: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.16em",
  textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 22px",
};

/** Maps a Selection Range within `container` to plain-text character offsets, ignoring any markup already inside it. */
function getSelectionOffsets(container: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;

  const preRange = range.cloneRange();
  preRange.selectNodeContents(container);
  preRange.setEnd(range.startContainer, range.startOffset);
  const start = preRange.toString().length;
  const end = start + range.toString().length;
  if (end <= start) return null;
  return { start, end };
}

/**
 * Renders `text` split around any highlighted ranges. While `highlightMode` is on, drag-selecting
 * inside it adds a new highlight in `activeColor` — or, when `activeColor` is null (the eraser tool
 * is active), erases whatever highlighted ranges the selection overlaps. Clicking an existing
 * highlight always removes it outright, regardless of which tool is selected.
 */
function HighlightText({
  text, highlights, highlightMode, activeColor, onAdd, onErase, onRemove, style,
}: {
  text: string;
  highlights: Highlight[];
  highlightMode: boolean;
  activeColor: string | null;
  onAdd: (h: Highlight) => void;
  onErase: (start: number, end: number) => void;
  onRemove: (index: number) => void;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  function handleMouseUp() {
    if (!highlightMode || !ref.current) return;
    const offsets = getSelectionOffsets(ref.current);
    window.getSelection()?.removeAllRanges();
    if (!offsets) return;
    if (activeColor === null) {
      onErase(offsets.start, offsets.end);
    } else {
      onAdd({ start: offsets.start, end: offsets.end, color: activeColor });
    }
  }

  const points = new Set<number>([0, text.length]);
  highlights.forEach((h) => {
    points.add(Math.max(0, Math.min(h.start, text.length)));
    points.add(Math.max(0, Math.min(h.end, text.length)));
  });
  const bounds = Array.from(points).sort((a, b) => a - b);

  const segments: { text: string; color: string | null; hIndex: number }[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const segStart = bounds[i];
    const segEnd = bounds[i + 1];
    if (segStart === segEnd) continue;
    let color: string | null = null;
    let hIndex = -1;
    highlights.forEach((h, idx) => {
      if (h.start <= segStart && h.end >= segEnd) {
        color = h.color;
        hIndex = idx;
      }
    });
    segments.push({ text: text.slice(segStart, segEnd), color, hIndex });
  }

  return (
    <span ref={ref} onMouseUp={handleMouseUp} style={{ ...style, cursor: highlightMode ? "text" : style?.cursor }}>
      {segments.map((seg, i) =>
        seg.color ? (
          <mark
            key={i}
            onClick={(e) => {
              if (!highlightMode) return;
              e.stopPropagation();
              e.preventDefault();
              onRemove(seg.hIndex);
            }}
            title={highlightMode ? "Click to remove highlight" : undefined}
            style={{ background: seg.color, color: "inherit", borderRadius: 2, cursor: highlightMode ? "pointer" : "text" }}
          >
            {seg.text}
          </mark>
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        )
      )}
    </span>
  );
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
  const [generatingNext, setGeneratingNext] = useState(false);
  const [planLinked, setPlanLinked] = useState(false);
  const [planDayNumber, setPlanDayNumber] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [showExit, setShowExit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [gridDraft, setGridDraft] = useState("");
  const [eliminateMode, setEliminateMode] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  /** Set right before a genuine drag-to-highlight; swallows the click that follows so it doesn't also select the answer. A plain click (no drag) still selects normally, even in highlight mode. */
  const suppressNextClickRef = useRef(false);
  const [activeHighlightColor, setActiveHighlightColor] = useState<string | null>(HIGHLIGHT_COLORS[0]);
  const [textSizeIndex, setTextSizeIndex] = useState(DEFAULT_TEXT_SIZE_INDEX);
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
      const storedSeconds = readTimer(sessionId);
      if (storedSeconds !== null) {
        setSecondsLeft(Math.max(0, storedSeconds));
      } else {
        // No local record of this session's clock (first visit, or a different device) —
        // estimate from wall-clock time elapsed since it was created.
        const totalSeconds = Math.round((sessionData.question_count ?? 20) * 1.5 * 60);
        const elapsedSeconds = Math.floor((Date.now() - new Date(sessionData.started_at).getTime()) / 1000);
        setSecondsLeft(Math.max(0, totalSeconds - elapsedSeconds));
      }

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

      // Supabase can return a joined relation as a one-element array rather
      // than a bare object depending on how it infers the FK cardinality —
      // unwrap defensively (matches the pattern used on dashboard/for-you).
      const rows = answerRows as unknown as (Answer & { question: Question | Question[] })[];
      const normalized = rows
        .map((row) => ({ ...row, question: Array.isArray(row.question) ? row.question[0] : row.question }))
        .filter((row) => !!row.question);

      if (normalized.length === 0) {
        setError("Session data missing. Please start a new session.");
        setLoading(false);
        return;
      }

      setQuestions(
        normalized.map((row) => ({
          question: row.question,
          answer: row,
          selected: row.user_answer as AnswerChoice | null,
          gridValue: row.user_grid_answer,
          eliminated: [],
          highlights: {},
        }))
      );

      // Just like the real test, this is one straight pass — so "picking up where you left
      // off" means the last question that has an answer on it, not necessarily the first one.
      let lastWorkedIndex = -1;
      normalized.forEach((row, i) => {
        if (row.user_answer !== null || row.user_grid_answer !== null) lastWorkedIndex = i;
      });
      if (lastWorkedIndex >= 0) setCurrentIndex(lastWorkedIndex);

      setLoading(false);
    }
    loadSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (secondsLeft == null) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s == null) return s;
        const next = s > 0 ? s - 1 : 0;
        writeTimer(sessionId, next);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft == null]);

  // Reload the draft input whenever navigation lands on a genuinely different question — done
  // during render (not in an effect) so it stays keyed on the question's own id, not the whole
  // `questions` array, since any unrelated update (highlighting, eliminating an option elsewhere)
  // would otherwise wipe out an uncommitted grid-in draft.
  const [gridSyncedFor, setGridSyncedFor] = useState<string | null>(null);
  const currentQuestionId = questions[currentIndex]?.question.id ?? null;
  if (gridSyncedFor !== currentQuestionId) {
    setGridSyncedFor(currentQuestionId);
    setGridDraft(questions[currentIndex]?.gridValue ?? "");
  }

  async function selectAnswer(choice: AnswerChoice) {
    const state = questions[currentIndex];
    setQuestions((prev) =>
      prev.map((q, i) => (i === currentIndex ? { ...q, selected: choice } : q))
    );

    await supabase
      .from("answers")
      .update({ user_answer: choice })
      .eq("session_id", sessionId)
      .eq("question_id", state.question.id);
  }

  /** Saves the current grid-in draft (if it's changed) — called on blur and before navigating away, so nothing typed is lost even without an explicit submit step. */
  async function commitGridAnswer() {
    const state = questions[currentIndex];
    if (!state || state.question.question_type !== "grid_in") return;
    const value = gridDraft.trim() ? gridDraft : null;
    if (value === state.gridValue) return;

    setQuestions((prev) =>
      prev.map((q, i) => (i === currentIndex ? { ...q, gridValue: value } : q))
    );
    await supabase
      .from("answers")
      .update({ user_grid_answer: value })
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

  function addHighlight(field: string, h: Highlight) {
    suppressNextClickRef.current = true;
    setQuestions((prev) =>
      prev.map((q, i) =>
        i !== currentIndex ? q : { ...q, highlights: { ...q.highlights, [field]: [...(q.highlights[field] ?? []), h] } }
      )
    );
  }

  function removeHighlight(field: string, index: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i !== currentIndex
          ? q
          : { ...q, highlights: { ...q.highlights, [field]: (q.highlights[field] ?? []).filter((_, hi) => hi !== index) } }
      )
    );
  }

  /** Trims or splits any highlights in `field` that overlap [start, end) — used by the eraser tool. */
  function eraseHighlight(field: string, start: number, end: number) {
    suppressNextClickRef.current = true;
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== currentIndex) return q;
        const remaining: Highlight[] = [];
        for (const h of q.highlights[field] ?? []) {
          if (h.end <= start || h.start >= end) {
            remaining.push(h);
            continue;
          }
          if (h.start < start) remaining.push({ ...h, end: start });
          if (h.end > end) remaining.push({ ...h, start: end });
        }
        return { ...q, highlights: { ...q.highlights, [field]: remaining } };
      })
    );
  }

  async function finishSession() {
    await commitGridAnswer();
    setSubmitting(true);
    clearTimer(sessionId);

    // Nothing has been graded yet — like a real test, correctness is checked only once
    // everything is submitted, not question by question along the way.
    const graded = questions.map((q) => ({
      question: q.question,
      correct: q.question.question_type === "grid_in"
        ? gradeGridAnswer(q.gridValue ?? "", q.question.grid_answer ?? "")
        : q.selected === q.question.answer,
    }));

    const { error: gradeErr } = await Promise.all(
      graded.map((g) =>
        supabase
          .from("answers")
          .update({ is_correct: g.correct })
          .eq("session_id", sessionId)
          .eq("question_id", g.question.id)
      )
    ).then((results) => ({ error: results.find((r) => r.error)?.error ?? null }));

    if (gradeErr) {
      setActionError("Could not save your answers. Please try again.");
      setSubmitting(false);
      return;
    }

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
      const correctCount = graded.filter((g) => g.correct).length;
      const score = Math.round((correctCount / graded.length) * 100);
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

  async function goBack() {
    await commitGridAnswer();
    setCurrentIndex((i) => Math.max(0, i - 1));
  }

  async function goNext() {
    await commitGridAnswer();
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
            { question: body.question, answer: body.answer, selected: null, gridValue: null, eliminated: [], highlights: {} },
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
  const isGridQuestion = current.question.question_type === "grid_in";
  // The current question's draft may not be committed to `gridValue` yet (only happens on
  // blur/navigate), so "answered" has to account for it directly to avoid a one-step-stale check.
  const currentAnswered = isGridQuestion
    ? (current.gridValue !== null || gridDraft.trim() !== "")
    : current.selected !== null;
  const answeredCount = questions.filter((q, i) => {
    if (i === currentIndex) return currentAnswered;
    return q.question.question_type === "grid_in" ? q.gridValue !== null : q.selected !== null;
  }).length;
  const allAnswered = answeredCount === sessionTarget && questions.length === sessionTarget;
  const atFrontier = currentIndex === questions.length - 1;
  const hasMoreToGenerate = questions.length < sessionTarget;
  const hasPassage = !!current.question.passage;

  type AnswerState = "default" | "selected";
  function stateFor(letter: AnswerChoice): AnswerState {
    return current.selected === letter ? "selected" : "default";
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
              const answered = i === currentIndex ? currentAnswered : (q.question.question_type === "grid_in" ? q.gridValue !== null : q.selected !== null);
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
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", marginRight: 4 }}>Text size</span>
            <button
              onClick={() => setTextSizeIndex((i) => Math.max(0, i - 1))}
              disabled={textSizeIndex === 0}
              aria-label="Decrease text size"
              style={{
                width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center",
                border: "1px solid var(--border)", background: "transparent", borderRadius: "var(--radius-sm)",
                color: "var(--text-body)", cursor: textSizeIndex === 0 ? "default" : "pointer",
                opacity: textSizeIndex === 0 ? 0.35 : 1, fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1, padding: 0,
              }}
            >
              −
            </button>
            <span style={{ width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--text-strong)" }}>
              A
            </span>
            <button
              onClick={() => setTextSizeIndex((i) => Math.min(TEXT_SIZE_LEVELS.length - 1, i + 1))}
              disabled={textSizeIndex === TEXT_SIZE_LEVELS.length - 1}
              aria-label="Increase text size"
              style={{
                width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center",
                border: "1px solid var(--border)", background: "transparent", borderRadius: "var(--radius-sm)",
                color: "var(--text-body)", cursor: textSizeIndex === TEXT_SIZE_LEVELS.length - 1 ? "default" : "pointer",
                opacity: textSizeIndex === TEXT_SIZE_LEVELS.length - 1 ? 0.35 : 1, fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1, padding: 0,
              }}
            >
              +
            </button>
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
          <button onClick={() => setHighlightMode((v) => !v)} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            border: `1px solid ${highlightMode ? "var(--text-strong)" : "var(--border)"}`,
            background: highlightMode ? "var(--surface-sunken)" : "transparent",
            color: highlightMode ? "var(--text-strong)" : "var(--text-faint)",
            borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 11,
            padding: "5px 12px", cursor: "pointer",
          }}>
            <Icon name="highlighter" size={13} />
            Highlighter
          </button>
          {highlightMode && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveHighlightColor(c)}
                  aria-label={`Highlight color ${c}`}
                  style={{
                    width: 18, height: 18, borderRadius: "50%", padding: 0, cursor: "pointer", background: c,
                    border: activeHighlightColor === c ? "2px solid var(--text-strong)" : "1px solid var(--border)",
                  }}
                />
              ))}
              <span style={{ width: 1, height: 14, background: "var(--line-strong)", margin: "0 2px" }} />
              <button
                onClick={() => setActiveHighlightColor(null)}
                aria-label="Erase highlights"
                title="Drag over highlighted text to erase it"
                style={{
                  width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "50%", padding: 0, cursor: "pointer", background: "transparent", color: "var(--text-faint)",
                  border: activeHighlightColor === null ? "2px solid var(--text-strong)" : "1px solid var(--border)",
                }}
              >
                <Icon name="eraser" size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reading desk */}
      <main style={{ maxWidth: 1360, margin: "0 auto", padding: "0 44px" }}>
        <div style={{ display: "grid", gridTemplateColumns: hasPassage ? "1fr 1fr" : "1fr" }}>
          {hasPassage && (
            <div style={{ height: "calc(100vh - 66px)", overflowY: "auto", padding: "52px 56px 72px 0", borderRight: "1px solid var(--border)" }}>
              <p style={microLabel}>Passage</p>
              <HighlightText
                text={current.question.passage ?? ""}
                highlights={current.highlights.passage ?? []}
                highlightMode={highlightMode}
                activeColor={activeHighlightColor}
                onAdd={(h) => addHighlight("passage", h)}
                onErase={(s, e) => eraseHighlight("passage", s, e)}
                onRemove={(i) => removeHighlight("passage", i)}
                style={{ display: "block", fontSize: 18 * textMult, lineHeight: 1.8, color: "var(--text-body)", margin: 0, maxWidth: "34rem", whiteSpace: "pre-wrap", textWrap: "pretty" }}
              />
            </div>
          )}
          <div style={{ height: "calc(100vh - 66px)", overflowY: "auto", padding: hasPassage ? "52px 0 72px 56px" : "52px 0 72px" }}>
            <div style={{ maxWidth: "34rem", margin: hasPassage ? 0 : "0 auto" }}>
              <p style={microLabel}>{current.question.skill.replace(/_/g, " ")} · {current.question.difficulty}</p>
              <HighlightText
                text={current.question.stem}
                highlights={current.highlights.stem ?? []}
                highlightMode={highlightMode}
                activeColor={activeHighlightColor}
                onAdd={(h) => addHighlight("stem", h)}
                onErase={(s, e) => eraseHighlight("stem", s, e)}
                onRemove={(i) => removeHighlight("stem", i)}
                style={{ display: "block", fontSize: 18 * textMult, lineHeight: 1.48, letterSpacing: "-0.008em", color: "var(--text-strong)", margin: "0 0 32px", textWrap: "pretty" }}
              />

              {isGridQuestion ? (
                <div className="qa-grid-input" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 280 }} onBlur={commitGridAnswer}>
                  <Input
                    label="Your answer"
                    placeholder="e.g. 17/4 or 4.25"
                    value={gridDraft}
                    style={{ fontSize: 14 * textMult }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGridDraft(e.target.value)}
                  />
                </div>
              ) : (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  {(["A", "B", "C", "D"] as AnswerChoice[]).map((c) => {
                    const isEliminated = current.eliminated.includes(c);
                    return (
                      <div
                        key={c}
                        style={{ display: "flex", alignItems: "stretch", gap: 8, cursor: "pointer" }}
                        onClick={() => {
                          if (suppressNextClickRef.current) { suppressNextClickRef.current = false; return; }
                          selectAnswer(c);
                        }}
                      >
                        {eliminateMode && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleEliminate(c); }}
                            aria-label={isEliminated ? `Restore option ${c}` : `Eliminate option ${c}`}
                            style={{
                              flexShrink: 0, width: 34, margin: "2px 0", borderRadius: "var(--radius-sm)",
                              border: `1px solid ${isEliminated ? "var(--text-strong)" : "var(--border)"}`,
                              background: isEliminated ? "var(--surface-sunken)" : "transparent",
                              color: isEliminated ? "var(--text-strong)" : "var(--text-faint)",
                              cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            <Icon name="ban" size={13} />
                          </button>
                        )}
                        <div style={{ flex: 1 }}>
                          <AnswerOption letter={c} state={stateFor(c)}>
                            <HighlightText
                              text={current.question.options?.[c] ?? ""}
                              highlights={current.highlights[c] ?? []}
                              highlightMode={highlightMode}
                              activeColor={activeHighlightColor}
                              onAdd={(h) => addHighlight(c, h)}
                              onErase={(s, e) => eraseHighlight(c, s, e)}
                              onRemove={(i) => removeHighlight(c, i)}
                              style={{ fontSize: 17 * textMult, textDecoration: isEliminated ? "line-through" : "none", opacity: isEliminated ? 0.55 : 1 }}
                            />
                          </AnswerOption>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {actionError && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", margin: "20px 0 0" }}>{actionError}</p>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 24, margin: "32px 0 0" }}>
                {currentIndex > 0 && (
                  <button onClick={goBack} style={{ border: 0, background: "none", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", cursor: "pointer", padding: 0 }}>
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
                    <button onClick={goNext} disabled={generatingNext || (atFrontier && hasMoreToGenerate && !currentAnswered)} style={{
                      border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)",
                      fontSize: 14, fontWeight: 500, padding: "13px 26px", borderRadius: "var(--radius-lg)",
                      cursor: "pointer", opacity: generatingNext || (atFrontier && hasMoreToGenerate && !currentAnswered) ? 0.5 : 1,
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
