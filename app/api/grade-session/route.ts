import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gradeGridAnswer } from "@/lib/grading";

interface AnswerRow {
  id: string;
  question_id: string;
  user_answer: "A" | "B" | "C" | "D" | null;
  user_grid_answer: string | null;
  question: {
    question_type: string;
    answer: "A" | "B" | "C" | "D" | null;
    grid_answer: string | null;
  } | null;
}

/**
 * Grades a session server-side, so the answer key never has to reach the browser while the
 * student is still working. Writes `is_correct` on every answer; with `complete: true` it also
 * marks the session completed with its score (plan sessions leave that to finish-plan-day).
 */
export async function POST(req: NextRequest) {
  const { sessionId, complete } = await req.json() as { sessionId: string; complete?: boolean };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id, completed_at")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  if (session.completed_at) {
    return NextResponse.json({ error: "Session already submitted." }, { status: 409 });
  }

  const { data: answerRows, error: loadErr } = await supabase
    .from("answers")
    .select("id, question_id, user_answer, user_grid_answer, question:questions(question_type, answer, grid_answer)")
    .eq("session_id", sessionId);

  if (loadErr || !answerRows) {
    return NextResponse.json({ error: "Could not load answers." }, { status: 500 });
  }

  // Unwrap a joined relation that Supabase may return as a one-element array.
  const rows = (answerRows as unknown as (AnswerRow & { question: AnswerRow["question"] | AnswerRow["question"][] })[])
    .map((r) => ({ ...r, question: Array.isArray(r.question) ? r.question[0] : r.question }));

  const graded = rows.map((r) => ({
    id: r.id,
    questionId: r.question_id,
    correct: !r.question
      ? false
      : r.question.question_type === "grid_in"
        ? gradeGridAnswer(r.user_grid_answer ?? "", r.question.grid_answer ?? "")
        : r.user_answer !== null && r.user_answer === r.question.answer,
  }));

  const results = await Promise.all(
    graded.map((g) => supabase.from("answers").update({ is_correct: g.correct }).eq("id", g.id))
  );
  const gradeErr = results.find((r) => r.error)?.error;
  if (gradeErr) {
    console.error("Supabase grade update error:", gradeErr);
    return NextResponse.json({ error: "Could not save your answers. Please try again." }, { status: 500 });
  }

  // Mistake notebook: a question leaves it the first time it's answered correctly again.
  const nowCorrect = graded.filter((g) => g.correct).map((g) => g.questionId);
  if (nowCorrect.length > 0) {
    const { error: nbErr } = await supabase
      .from("notebook_entries")
      .delete()
      .eq("user_id", user.id)
      .in("question_id", nowCorrect);
    if (nbErr) console.error("Supabase notebook cleanup error:", nbErr);
  }

  const correctCount = graded.filter((g) => g.correct).length;
  const score = graded.length > 0 ? Math.round((correctCount / graded.length) * 100) : 0;

  if (complete) {
    const { error: completeErr } = await supabase
      .from("sessions")
      .update({ completed_at: new Date().toISOString(), score })
      .eq("id", sessionId);
    if (completeErr) {
      return NextResponse.json({ error: "Could not finish session." }, { status: 500 });
    }
  }

  return NextResponse.json({ score });
}
