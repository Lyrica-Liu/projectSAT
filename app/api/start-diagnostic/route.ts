import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildDiagnosticPool } from "@/lib/questions/diagnostic";

/**
 * Creates the one-time diagnostic session: ~23 questions (7 English subcategories x2, all 3
 * math categories x3), mixed difficulty, no repeats. Structurally identical to
 * start-bank-practice's bulk insert (questions -> sessions -> answers). Scoring is subject-level
 * only (see lib/diagnostic-scoring.ts) — every question's `questions.domain` column already
 * says which subject it belongs to, so unlike the old per-category diagnostic, there's no need
 * to stash a question-id -> category map in user_metadata to regroup answers later.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const pool = buildDiagnosticPool();
  if (pool.length === 0) {
    return NextResponse.json({ error: "Could not build the diagnostic — no questions available." }, { status: 500 });
  }

  const questions = pool.map((q) => ({
    user_id:       user.id,
    domain:        q.domain,
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

  const { data: savedQuestions, error: qErr } = await supabase.from("questions").insert(questions).select("id");
  if (qErr || !savedQuestions) {
    return NextResponse.json({ error: `Could not save questions: ${qErr?.message ?? "unknown error"}` }, { status: 500 });
  }

  const { data: session, error: sErr } = await supabase
    .from("sessions")
    .insert({ user_id: user.id, question_count: pool.length, domain_filter: "both" })
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

  const { error: updateErr } = await supabase.auth.updateUser({
    data: { diagnostic_session_id: session.id },
  });
  if (updateErr) {
    return NextResponse.json({ error: `Could not save diagnostic metadata: ${updateErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ sessionId: session.id });
}
