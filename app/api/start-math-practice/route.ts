import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMathBankQuestions } from "@/lib/questions/mathParser";
import type { Difficulty } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    subcategory?: string;
    subcategories?: string[];
    difficulty: Difficulty;
    count: number;
  };
  const subcategories = body.subcategories ?? (body.subcategory ? [body.subcategory] : []);
  const { difficulty, count } = body;
  if (subcategories.length === 0 || !difficulty || !count) {
    return NextResponse.json({ error: "Missing subcategories, difficulty, or count." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Pool the selected subcategories together and distribute questions evenly.
  const pool = subcategories.flatMap((sc) => getMathBankQuestions(sc, difficulty));
  if (pool.length === 0) {
    return NextResponse.json({ error: `No math questions found for "${subcategories.join(", ")}" / "${difficulty}"` }, { status: 500 });
  }

  const shuffled = pool.slice().sort(() => Math.random() - 0.5);
  const picked = Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);

  const questions = picked.map((q) => ({
    user_id:       user.id,
    domain:        "math",
    skill:         q.skill,
    difficulty:    q.difficulty,
    passage:       q.passage,
    stem:          q.stem,
    question_type: q.questionType,
    options:       q.options,
    answer:        q.answer,
    grid_answer:   q.gridAnswer,
    explanation:   q.explanation,
  }));

  const { data: savedQuestions, error: qErr } = await supabase
    .from("questions")
    .insert(questions)
    .select("id");

  if (qErr || !savedQuestions) {
    return NextResponse.json({ error: `Could not save questions: ${qErr?.message ?? "unknown error"}` }, { status: 500 });
  }

  const { data: session, error: sErr } = await supabase
    .from("sessions")
    // sessions.domain_filter only allows 'reading' | 'writing' | 'both' (questions.domain is
    // the separate column that allows 'math') — "both" is the closest fit for an all-math
    // session and matches what every other math-linked session in the app already uses
    // (start-plan-day, start-diagnostic, generate-plan). "math" here was rejected outright by
    // the DB's check constraint, so every math extra-practice session failed to start.
    .insert({ user_id: user.id, question_count: count, domain_filter: "both" })
    .select("id")
    .single();

  if (sErr || !session) {
    return NextResponse.json({ error: `Could not create session: ${sErr?.message ?? "unknown error"}` }, { status: 500 });
  }

  const { error: aErr } = await supabase
    .from("answers")
    .insert(savedQuestions.map((q, i) => ({ session_id: session.id, question_id: q.id, position: i })));

  if (aErr) {
    return NextResponse.json({ error: `Could not link questions to session: ${aErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ sessionId: session.id });
}
