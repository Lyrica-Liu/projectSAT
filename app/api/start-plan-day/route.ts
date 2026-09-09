import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanDay, ENGLISH_SESSION_LENGTH, MATH_SESSION_LENGTH } from "@/lib/plan";
import { getBankQuestions } from "@/lib/questions/parser";
import { getMathBankQuestions } from "@/lib/questions/mathParser";
import type { Difficulty } from "@/lib/types";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { dayNumber } = await req.json() as { dayNumber: number };
  const planDay = getPlanDay(dayNumber);
  if (!planDay) {
    return NextResponse.json({ error: "Invalid day number." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Resume an already-started session
  const { data: existing } = await supabase
    .from("plan_days")
    .select("session_id, completed_at, subcategory, difficulty")
    .eq("user_id", user.id)
    .eq("day_number", dayNumber)
    .maybeSingle();

  if (existing?.session_id) {
    return NextResponse.json({ sessionId: existing.session_id, resumed: true });
  }

  // Every day's subcategory is written up front by /api/generate-plan during onboarding
  // (the persisted plan_days row is the source of truth); getPlanDay()'s own subcategory is
  // only a fallback for the rare case that row is somehow missing. Difficulty is always read
  // fresh from category_progress — a subcategory can now recur on non-consecutive days under
  // personalized allocation, so a later occurrence must reflect whatever the tier has become
  // since the earlier one, never a stale plan-time snapshot (previously only true for math).
  const subcategory = existing?.subcategory ?? planDay.subcategory;
  if (!subcategory) {
    return NextResponse.json(
      { error: "This day isn't set up yet — finish onboarding first." },
      { status: 400 }
    );
  }

  const { data: progress } = await supabase
    .from("category_progress")
    .select("difficulty")
    .eq("user_id", user.id)
    .eq("subcategory", subcategory)
    .maybeSingle();
  const difficulty: Difficulty = (progress?.difficulty as Difficulty) ?? "medium-low";

  const sessionLength = planDay.subject === "math" ? MATH_SESSION_LENGTH : ENGLISH_SESSION_LENGTH;

  let domain: "reading" | "writing" | "math";
  let firstQuestion: {
    skill: string;
    difficulty: Difficulty;
    passage: string | null;
    stem: string;
    options: { A: string; B: string; C: string; D: string } | null;
    answer: "A" | "B" | "C" | "D" | null;
    gridAnswer?: string | null;
    explanation: string;
    questionType?: "multiple_choice" | "grid_in";
  };

  if (planDay.subject === "math") {
    const startingPool = getMathBankQuestions(subcategory, difficulty);
    if (startingPool.length === 0) {
      return NextResponse.json(
        { error: `No math questions found for "${subcategory}" / "${difficulty}"` },
        { status: 500 }
      );
    }
    const picked = startingPool[Math.floor(Math.random() * startingPool.length)];
    domain = "math";
    firstQuestion = {
      skill: picked.skill, difficulty: picked.difficulty, passage: picked.passage, stem: picked.stem,
      options: picked.options, answer: picked.answer, gridAnswer: picked.gridAnswer,
      explanation: picked.explanation, questionType: picked.questionType,
    };
  } else {
    const startingPool = getBankQuestions(subcategory, difficulty);
    if (startingPool.length === 0) {
      return NextResponse.json(
        { error: `No questions found for "${subcategory}" / "${difficulty}"` },
        { status: 500 }
      );
    }
    const picked = startingPool[Math.floor(Math.random() * startingPool.length)];
    domain = picked.domain;
    firstQuestion = {
      skill: picked.skill, difficulty: picked.difficulty, passage: picked.passage, stem: picked.stem,
      options: picked.options, answer: picked.answer, explanation: picked.explanation,
      questionType: "multiple_choice",
    };
  }

  const { data: savedQuestion, error: qErr } = await supabase
    .from("questions")
    .insert({
      user_id:        user.id,
      domain,
      skill:          firstQuestion.skill,
      difficulty:     firstQuestion.difficulty,
      passage:        firstQuestion.passage,
      stem:           firstQuestion.stem,
      question_type:  firstQuestion.questionType ?? "multiple_choice",
      options:        firstQuestion.options,
      answer:         firstQuestion.answer,
      grid_answer:    firstQuestion.gridAnswer ?? null,
      explanation:    firstQuestion.explanation,
    })
    .select("id")
    .single();

  if (qErr || !savedQuestion) {
    return NextResponse.json({ error: `Could not save question: ${qErr?.message}` }, { status: 500 });
  }

  // sessions.domain_filter only allows 'reading' | 'writing' | 'both' — `domain` here can be
  // 'math' (a valid value on the separate questions.domain column, just set above), which the
  // DB's check constraint rejects outright. "both" is the closest fit for a math day, matching
  // every other math-linked session in the app; English days pass 'reading'/'writing' through
  // unchanged since those are already valid domain_filter values.
  const sessionDomainFilter = domain === "math" ? "both" : domain;
  const { data: session, error: sErr } = await supabase
    .from("sessions")
    .insert({ user_id: user.id, question_count: sessionLength, domain_filter: sessionDomainFilter })
    .select("id")
    .single();

  if (sErr || !session) {
    return NextResponse.json({ error: `Could not create session: ${sErr?.message}` }, { status: 500 });
  }

  const { error: aErr } = await supabase
    .from("answers")
    .insert({ session_id: session.id, question_id: savedQuestion.id, position: 0 });

  if (aErr) {
    return NextResponse.json({ error: `Could not link question: ${aErr.message}` }, { status: 500 });
  }

  const { error: pdErr } = await supabase
    .from("plan_days")
    .upsert(
      { user_id: user.id, day_number: dayNumber, session_id: session.id, subcategory, difficulty },
      { onConflict: "user_id,day_number" }
    );

  if (pdErr) {
    console.error("plan_days upsert error:", pdErr);
  }

  return NextResponse.json({ sessionId: session.id });
}
