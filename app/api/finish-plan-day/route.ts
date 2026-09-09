import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeSessionState } from "@/lib/adaptive";
import type { Difficulty } from "@/lib/types";

interface HistoryRow {
  is_correct: boolean | null;
  question: { difficulty: Difficulty } | null;
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
    .select("id, day_number, subcategory, difficulty, completed_at")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!planDayRow?.subcategory || !planDayRow?.difficulty) {
    return NextResponse.json({ error: "Session is not an adaptive plan session." }, { status: 400 });
  }

  const { data: historyRows } = await supabase
    .from("answers")
    .select("is_correct, question:questions(difficulty)")
    .eq("session_id", sessionId)
    .order("position");

  const history = (historyRows ?? []) as unknown as HistoryRow[];
  const total = history.length;
  const correct = history.filter((h) => h.is_correct).length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  if (!planDayRow.completed_at) {
    await supabase
      .from("sessions")
      .update({ completed_at: new Date().toISOString(), score })
      .eq("id", sessionId);

    await supabase
      .from("plan_days")
      .update({ completed_at: new Date().toISOString(), score })
      .eq("id", planDayRow.id);

    const finalState = computeSessionState(
      history
        .filter((h) => h.question)
        .map((h) => ({ difficulty: h.question!.difficulty, isCorrect: !!h.is_correct })),
      planDayRow.difficulty as Difficulty
    );

    // This is the ongoing per-session adaptive update — every category's day(s) are now
    // assigned up front by /api/generate-plan during onboarding, so the reallocation this
    // route used to trigger after English slot 11 (re-ranking categories and overwriting
    // slots 12-20) has been removed: it would otherwise silently clobber the personalized
    // plan the moment slot 11 finished.
    await supabase
      .from("category_progress")
      .upsert(
        {
          user_id: user.id,
          subcategory: planDayRow.subcategory,
          difficulty: finalState.currentDifficulty,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,subcategory" }
      );
  }

  return NextResponse.json({ score });
}
