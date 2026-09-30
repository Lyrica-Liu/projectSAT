import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getQuestionBank } from "@/lib/questions/parser";
import { getMathQuestionBank } from "@/lib/questions/mathParser";
import { isReportReason } from "@/lib/reports";

const MAX_NOTE_LENGTH = 1000;

/** True when a question with this exact passage + stem exists in either hand-built bank. */
function isFromBank(passage: string | null, stem: string): boolean {
  const matches = (q: { passage: string | null; stem: string }) => q.stem === stem && (q.passage ?? null) === passage;
  for (const byTier of Object.values(getQuestionBank())) {
    for (const qs of Object.values(byTier)) if (qs.some(matches)) return true;
  }
  for (const byTier of Object.values(getMathQuestionBank())) {
    for (const qs of Object.values(byTier)) if (qs.some(matches)) return true;
  }
  return false;
}

/**
 * Records a student's report that a question is broken. Snapshots the question as it was
 * served (including its answer key) so the report stays actionable even if the row changes,
 * and tags whether it came from the bank or the AI generator.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { questionId?: string; reason?: string; note?: string };
  if (!body.questionId) {
    return NextResponse.json({ error: "questionId is required." }, { status: 400 });
  }
  if (!isReportReason(body.reason)) {
    return NextResponse.json({ error: "Pick a reason." }, { status: 400 });
  }
  const note = (body.note ?? "").trim().slice(0, MAX_NOTE_LENGTH) || null;

  // RLS limits this to the user's own questions, so nobody can report (or snapshot) others'.
  const { data: question } = await supabase
    .from("questions")
    .select("id, domain, skill, difficulty, question_type, passage, stem, options, answer, grid_answer, explanation")
    .eq("id", body.questionId)
    .maybeSingle();
  if (!question) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }

  const { error: insertErr } = await supabase.from("question_reports").insert({
    user_id: user.id,
    question_id: question.id,
    reason: body.reason,
    note,
    source: isFromBank(question.passage, question.stem) ? "bank" : "ai",
    question_snapshot: question,
  });

  if (insertErr) {
    // 23505 = unique violation: this user already reported this question.
    if (insertErr.code === "23505") {
      return NextResponse.json({ ok: true, alreadyReported: true });
    }
    console.error("Supabase report insert error:", insertErr);
    return NextResponse.json({ error: "Could not send your report." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
