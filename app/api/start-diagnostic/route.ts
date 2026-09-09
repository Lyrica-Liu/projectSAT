import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildDiagnosticPool } from "@/lib/questions/diagnostic";

/**
 * Creates the one-time diagnostic session: ~48 questions across all 11 English subcategories
 * and all 3 math categories, mixed difficulty, no repeats. Structurally identical to
 * start-bank-practice's bulk insert (questions -> sessions -> answers), plus one extra step:
 * the session id and a question-id -> category map get stashed in user_metadata so later steps
 * (results scoring, plan generation) can identify this session and regroup its answers by
 * category without a schema change — `questions` has no free-form category column, and two
 * English subcategories ("Command of Evidence (Textual)"/"(Quantitative)") share the same
 * `skill` value, so skill alone can't be inverted back to a unique category.
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

  const diagnosticCategories: Record<string, string> = {};
  savedQuestions.forEach((q, i) => { diagnosticCategories[q.id] = pool[i].category; });

  const { error: updateErr } = await supabase.auth.updateUser({
    data: { diagnostic_session_id: session.id, diagnostic_categories: diagnosticCategories },
  });
  if (updateErr) {
    return NextResponse.json({ error: `Could not save diagnostic metadata: ${updateErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ sessionId: session.id });
}
