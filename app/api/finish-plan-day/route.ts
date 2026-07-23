import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ENGLISH_CATEGORY_ORDER, dayForEnglishSlot, englishSlotNumber } from "@/lib/plan";
import { computeSessionState, TIER_ORDER } from "@/lib/adaptive";
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

    // Once the 11th English slot (the last of the fixed category order)
    // finishes, compute which 9 categories the remaining slots review.
    if (englishSlotNumber(planDayRow.day_number) === 11) {
      const { data: progressRows } = await supabase
        .from("category_progress")
        .select("subcategory, difficulty")
        .eq("user_id", user.id);

      const progressBySubcategory = new Map(
        (progressRows ?? []).map((r) => [r.subcategory, r.difficulty as Difficulty])
      );

      const ranked = ENGLISH_CATEGORY_ORDER
        .map((cat) => ({
          subcategory: cat.subcategory,
          difficulty: progressBySubcategory.get(cat.subcategory) ?? "medium-low",
        }))
        .sort((a, b) => TIER_ORDER.indexOf(a.difficulty) - TIER_ORDER.indexOf(b.difficulty))
        .slice(0, 9);

      for (let i = 0; i < ranked.length; i++) {
        const reviewDay = dayForEnglishSlot(12 + i);
        if (!reviewDay) continue;
        await supabase
          .from("plan_days")
          .upsert(
            {
              user_id: user.id,
              day_number: reviewDay,
              subcategory: ranked[i].subcategory,
              difficulty: ranked[i].difficulty,
            },
            { onConflict: "user_id,day_number" }
          );
      }
    }
  }

  return NextResponse.json({ score });
}
