import type { SupabaseClient } from "@supabase/supabase-js";
import { getBankQuestions } from "@/lib/questions/parser";
import { getMathBankQuestions } from "@/lib/questions/mathParser";
import { subcategoryForSkill } from "@/lib/categories";
import { PICK_GROUPS, pickNext, type StreamCard, type StreamPlan } from "@/lib/lite/stream";
import { TIER_ORDER } from "@/lib/adaptive";
import type { Difficulty } from "@/lib/types";

/**
 * Database side of Lite's cards: loading a session's cards, serving the next stream card, and
 * grading one answer at a time. Card picking itself is lib/lite/stream.ts.
 */

type Letter = "A" | "B" | "C" | "D";

/** What the phone gets for one question. The answer key is only included once it's answered. */
export interface LiteCard {
  answerId: string;
  position: number;
  subcategory: string;
  difficulty: Difficulty;
  passage: string | null;
  stem: string;
  options: Record<Letter, string> | null;
  questionType: "multiple_choice" | "grid_in";
  /** Re-asked from the student's past mistakes. */
  mistake: boolean;
  result: { choice: Letter | null; correct: boolean; answer: Letter | null; gridAnswer: string | null; explanation: string } | null;
}

export interface LiteSession {
  id: string;
  kind: "set" | "stream";
  stream_plan: StreamPlan | null;
  started_at: string;
  completed_at: string | null;
}

interface QuestionRow {
  id: string; subcategory: string | null; skill: string; difficulty: Difficulty; passage: string | null; stem: string;
  options: Record<Letter, string> | null; question_type: "multiple_choice" | "grid_in"; answer: Letter | null;
  grid_answer: string | null; explanation: string; created_at: string;
}
interface AnswerRow {
  id: string; position: number; user_answer: Letter | null; is_correct: boolean | null; question: QuestionRow | QuestionRow[] | null;
}

const QUESTION_FIELDS = "id, subcategory, skill, difficulty, passage, stem, options, question_type, answer, grid_answer, explanation, created_at";
const one = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? x[0] ?? null : x);

function toCard(row: AnswerRow, session: LiteSession): LiteCard | null {
  const q = one(row.question);
  if (!q) return null;
  return {
    answerId: row.id,
    position: row.position,
    subcategory: q.subcategory ?? subcategoryForSkill(q.skill) ?? "",
    difficulty: q.difficulty,
    passage: q.passage,
    stem: q.stem,
    options: q.options,
    questionType: q.question_type,
    // A question saved before this session started can only be a re-asked mistake.
    mistake: session.kind === "stream" && q.created_at < session.started_at,
    result: row.is_correct === null ? null : {
      choice: row.user_answer, correct: row.is_correct, answer: q.answer, gridAnswer: q.grid_answer, explanation: q.explanation,
    },
  };
}

/** The session (RLS: only the student's own) and its cards in order, or null if not theirs. */
export async function loadSessionCards(supabase: SupabaseClient, sessionId: string): Promise<{ session: LiteSession; cards: LiteCard[] } | null> {
  const { data: session } = await supabase.from("sessions")
    .select("id, kind, stream_plan, started_at, completed_at").eq("id", sessionId).maybeSingle();
  if (!session) return null;
  const { data: rows } = await supabase.from("answers")
    .select(`id, position, user_answer, is_correct, question:questions(${QUESTION_FIELDS})`)
    .eq("session_id", sessionId).order("position");
  const cards = ((rows ?? []) as unknown as AnswerRow[]).map((r) => toCard(r, session as LiteSession)).filter((c): c is LiteCard => c !== null);
  return { session: session as LiteSession, cards };
}

/**
 * Past multiple-choice mistakes the student hasn't since got right: their notebook plus their
 * most recent wrong answers. Excludes questions already in this stream.
 */
async function mistakeCandidates(supabase: SupabaseClient, userId: string, exclude: Set<string>): Promise<string[]> {
  const [wrongRes, notebookRes] = await Promise.all([
    supabase.from("questions").select("id, answers!inner(is_correct)")
      .eq("user_id", userId).eq("question_type", "multiple_choice").eq("answers.is_correct", false)
      .order("created_at", { ascending: false }).limit(100),
    supabase.from("notebook_entries").select("question_id").eq("user_id", userId).limit(100),
  ]);
  const ids = [...new Set([
    ...(notebookRes.data ?? []).map((r) => r.question_id as string),
    ...(wrongRes.data ?? []).map((r) => r.id as string),
  ])].filter((id) => !exclude.has(id));
  if (ids.length === 0) return [];
  const { data: fixed } = await supabase.from("answers").select("question_id").eq("is_correct", true).in("question_id", ids);
  const fixedIds = new Set((fixed ?? []).map((r) => r.question_id as string));
  return ids.filter((id) => !fixedIds.has(id));
}

/** Copies one bank question at (or nearest to) this tier into the student's questions, preferring ones they haven't seen. */
async function drawBankQuestion(supabase: SupabaseClient, userId: string, subcategory: string, difficulty: Difficulty): Promise<string | null> {
  const isMath = PICK_GROUPS.math.includes(subcategory);
  const tiersByCloseness = [...TIER_ORDER].sort((a, b) =>
    Math.abs(TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(difficulty)) - Math.abs(TIER_ORDER.indexOf(b) - TIER_ORDER.indexOf(difficulty)));

  let pool: { domain: string; skill: string; difficulty: Difficulty; passage: string | null; stem: string; options: Record<Letter, string>; answer: Letter; explanation: string }[] = [];
  for (const tier of tiersByCloseness) {
    pool = isMath
      ? getMathBankQuestions(subcategory, tier).filter((q) => q.questionType === "multiple_choice" && q.options && q.answer)
        .map((q) => ({ ...q, options: q.options!, answer: q.answer! }))
      : getBankQuestions(subcategory, tier);
    if (pool.length > 0) break;
  }
  if (pool.length === 0) return null;

  const { data: recent } = await supabase.from("questions").select("stem").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(400);
  const seen = new Set((recent ?? []).map((r) => r.stem as string));
  const unseen = pool.filter((q) => !seen.has(q.stem));
  const choices = unseen.length > 0 ? unseen : pool;
  const q = choices[Math.floor(Math.random() * choices.length)];

  const { data: saved, error } = await supabase.from("questions").insert({
    user_id: userId, domain: q.domain, subcategory, skill: q.skill, difficulty: q.difficulty, passage: q.passage,
    stem: q.stem, question_type: "multiple_choice", options: q.options, answer: q.answer, grid_answer: null,
    explanation: q.explanation,
  }).select("id").single();
  if (error || !saved) {
    console.error("Lite: could not save question:", error);
    return null;
  }
  return saved.id as string;
}

/** Adds the stream's next card. If the last card is still unanswered, returns that instead (refresh-safe). */
export async function serveNextCard(supabase: SupabaseClient, userId: string, sessionId: string): Promise<LiteCard | { error: string; status: number }> {
  const loaded = await loadSessionCards(supabase, sessionId);
  if (!loaded || loaded.session.kind !== "stream" || !loaded.session.stream_plan) return { error: "Stream not found.", status: 404 };
  const { session, cards } = loaded;
  const pending = cards.find((c) => !c.result);
  if (pending) return pending;

  const plan = session.stream_plan!;
  const history: StreamCard[] = cards.map((c) => ({ subcategory: c.subcategory, difficulty: c.difficulty, correct: c.result!.correct, mistake: c.mistake }));
  const { data: inStream } = await supabase.from("answers").select("question_id").eq("session_id", sessionId);
  const mistakes = await mistakeCandidates(supabase, userId, new Set((inStream ?? []).map((r) => r.question_id as string)));

  const next = pickNext(plan, history, { mistakesAvailable: mistakes.length > 0 });
  const questionId = next.kind === "mistake"
    ? mistakes[Math.floor(Math.random() * mistakes.length)]
    : await drawBankQuestion(supabase, userId, next.subcategory, next.difficulty);
  if (!questionId) return { error: "No questions are available for this skill yet.", status: 500 };

  const position = cards.length === 0 ? 0 : Math.max(...cards.map((c) => c.position)) + 1;
  const { data: row, error } = await supabase.from("answers")
    .insert({ session_id: sessionId, question_id: questionId, position })
    .select(`id, position, user_answer, is_correct, question:questions(${QUESTION_FIELDS})`).single();
  if (error || !row) return { error: "Could not add the next question.", status: 500 };
  return toCard(row as unknown as AnswerRow, session)!;
}

/**
 * Grades one answer, for stream cards and for sprint-day sets played as cards. Answering twice
 * returns the first result. A stream counts as completed from its first graded answer, so its
 * answers feed the skill map straight away.
 */
export async function gradeCard(supabase: SupabaseClient, userId: string, answerId: string, choice: Letter): Promise<LiteCard | { error: string; status: number }> {
  const { data: row } = await supabase.from("answers")
    .select(`id, position, session_id, user_answer, is_correct, question:questions(${QUESTION_FIELDS})`).eq("id", answerId).maybeSingle();
  if (!row) return { error: "Question not found.", status: 404 };
  const { data: session } = await supabase.from("sessions")
    .select("id, kind, stream_plan, started_at, completed_at").eq("id", row.session_id).maybeSingle();
  if (!session) return { error: "Question not found.", status: 404 };
  const q = one((row as unknown as AnswerRow).question);
  if (!q) return { error: "Question not found.", status: 404 };
  if (row.is_correct !== null) return toCard(row as unknown as AnswerRow, session as LiteSession)!;
  if (session.kind === "set" && session.completed_at) return { error: "This set is already finished.", status: 409 };
  if (q.question_type !== "multiple_choice") return { error: "This question needs the full site.", status: 400 };

  const correct = choice === q.answer;
  const now = new Date().toISOString();
  const { error } = await supabase.from("answers").update({ user_answer: choice, is_correct: correct, answered_at: now }).eq("id", answerId);
  if (error) return { error: "Could not save your answer.", status: 500 };

  // Same rule as the website: a question leaves the mistake notebook once it's answered right.
  if (correct) await supabase.from("notebook_entries").delete().eq("user_id", userId).eq("question_id", q.id);

  if (session.kind === "stream") {
    const { data: graded } = await supabase.from("answers").select("is_correct").eq("session_id", session.id).not("is_correct", "is", null);
    const answered = graded?.length ?? 0;
    const right = (graded ?? []).filter((g) => g.is_correct).length;
    await supabase.from("sessions").update({
      completed_at: now, question_count: answered, score: answered > 0 ? Math.round((right / answered) * 100) : 0,
    }).eq("id", session.id);
  }

  return toCard({ ...(row as unknown as AnswerRow), user_answer: choice, is_correct: correct }, session as LiteSession)!;
}
