import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ENGLISH_SESSION_LENGTH } from "@/lib/plan";
import { computeSessionState, pickNextTier, TIER_ORDER } from "@/lib/adaptive";
import { getBankQuestions } from "@/lib/questions/parser";
import type { Difficulty } from "@/lib/types";

interface HistoryRow {
  position: number;
  is_correct: boolean | null;
  question: { difficulty: Difficulty; stem: string } | null;
}

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json() as { sessionId: string };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: planDayRow } = await supabase
    .from("plan_days")
    .select("subcategory, difficulty")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!planDayRow?.subcategory || !planDayRow?.difficulty) {
    return NextResponse.json({ error: "Session is not an adaptive plan session." }, { status: 400 });
  }
  const subcategory = planDayRow.subcategory;
  const startDifficulty = planDayRow.difficulty as Difficulty;

  const { data: historyRows, error: hErr } = await supabase
    .from("answers")
    .select("position, is_correct, question:questions(difficulty, stem)")
    .eq("session_id", sessionId)
    .order("position");

  if (hErr || !historyRows || historyRows.length === 0) {
    return NextResponse.json({ error: "No questions found for this session." }, { status: 500 });
  }

  const history = historyRows as unknown as HistoryRow[];
  const last = history[history.length - 1];
  if (last.is_correct === null) {
    return NextResponse.json({ error: "Answer the current question first." }, { status: 400 });
  }

  if (history.length >= ENGLISH_SESSION_LENGTH) {
    return NextResponse.json({ done: true });
  }

  const state = computeSessionState(
    history.map((h) => ({ difficulty: h.question!.difficulty, isCorrect: h.is_correct! })),
    startDifficulty
  );

  const usedStems = new Set(history.map((h) => h.question!.stem));

  const targetTier = pickNextTier(state.currentDifficulty);
  const tryTiers = [targetTier, state.currentDifficulty, ...TIER_ORDER];

  let candidate: ReturnType<typeof getBankQuestions>[number] | null = null;
  for (const tier of tryTiers) {
    const pool = getBankQuestions(subcategory, tier).filter((q) => !usedStems.has(q.stem));
    if (pool.length > 0) {
      candidate = pool[Math.floor(Math.random() * pool.length)];
      break;
    }
  }

  if (!candidate) {
    return NextResponse.json({ error: "No unused questions remain for this category." }, { status: 500 });
  }

  const { data: savedQuestion, error: qErr } = await supabase
    .from("questions")
    .insert({
      user_id:     user.id,
      domain:      candidate.domain,
      skill:       candidate.skill,
      difficulty:  candidate.difficulty,
      passage:     candidate.passage,
      stem:        candidate.stem,
      options:     candidate.options,
      answer:      candidate.answer,
      explanation: candidate.explanation,
    })
    .select("*")
    .single();

  if (qErr || !savedQuestion) {
    return NextResponse.json({ error: `Could not save question: ${qErr?.message}` }, { status: 500 });
  }

  const position = history.length;
  const { data: savedAnswer, error: aErr } = await supabase
    .from("answers")
    .insert({ session_id: sessionId, question_id: savedQuestion.id, position })
    .select("*")
    .single();

  if (aErr || !savedAnswer) {
    return NextResponse.json({ error: `Could not link question: ${aErr?.message}` }, { status: 500 });
  }

  return NextResponse.json({
    question: savedQuestion,
    answer: { ...savedAnswer, question: savedQuestion },
  });
}
