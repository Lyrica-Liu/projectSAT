import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanDay, englishSlotNumber, ENGLISH_SESSION_LENGTH } from "@/lib/plan";
import { getBankQuestions } from "@/lib/questions/parser";
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

  // Math days have no question session
  if (planDay.subject === "math") {
    return NextResponse.json({ math: true });
  }

  const slot = englishSlotNumber(dayNumber)!;

  let subcategory: string;
  let difficulty: Difficulty;

  if (slot <= 11) {
    subcategory = planDay.subcategory!;
    difficulty = planDay.difficulty!;
  } else {
    // Slots 12-20: assigned once slot 11 finishes (see /api/finish-plan-day).
    if (!existing?.subcategory || !existing?.difficulty) {
      return NextResponse.json(
        { error: "This day isn't unlocked yet — finish more study days first." },
        { status: 400 }
      );
    }
    subcategory = existing.subcategory;
    difficulty = existing.difficulty as Difficulty;
  }

  const startingPool = getBankQuestions(subcategory, difficulty);
  if (startingPool.length === 0) {
    return NextResponse.json(
      { error: `No questions found for "${subcategory}" / "${difficulty}"` },
      { status: 500 }
    );
  }

  const firstQuestion = startingPool[Math.floor(Math.random() * startingPool.length)];

  const { data: savedQuestion, error: qErr } = await supabase
    .from("questions")
    .insert({
      user_id:     user.id,
      domain:      firstQuestion.domain,
      skill:       firstQuestion.skill,
      difficulty:  firstQuestion.difficulty,
      passage:     firstQuestion.passage,
      stem:        firstQuestion.stem,
      options:     firstQuestion.options,
      answer:      firstQuestion.answer,
      explanation: firstQuestion.explanation,
    })
    .select("id")
    .single();

  if (qErr || !savedQuestion) {
    return NextResponse.json({ error: `Could not save question: ${qErr?.message}` }, { status: 500 });
  }

  const { data: session, error: sErr } = await supabase
    .from("sessions")
    .insert({ user_id: user.id, question_count: ENGLISH_SESSION_LENGTH, domain_filter: firstQuestion.domain })
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
