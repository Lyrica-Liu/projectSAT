import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ENGLISH_CATEGORY_ORDER, MATH_CATEGORY_ORDER, ENGLISH_DAYS, MATH_DAYS } from "@/lib/plan";
import type { Difficulty } from "@/lib/types";

/**
 * A single-day, no-rebalancing swap — change what category one not-yet-started day covers.
 * Independent of /api/adjust-plan's Reduce/Skip cascade; running that cascade later will
 * recompute every editable day of the same subject and can overwrite a swap made here — that's
 * an accepted trade-off (see the plan file), not a bug.
 */
export async function POST(req: NextRequest) {
  const { day, subcategory } = await req.json() as { day?: number; subcategory?: string };

  if (typeof day !== "number" || typeof subcategory !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const subject = ENGLISH_DAYS.includes(day) ? "english" : MATH_DAYS.includes(day) ? "math" : null;
  if (!subject) {
    return NextResponse.json({ error: "Invalid day number." }, { status: 400 });
  }

  const canonicalOrder = (subject === "english" ? ENGLISH_CATEGORY_ORDER : MATH_CATEGORY_ORDER).map((c) => c.subcategory);
  if (!canonicalOrder.includes(subcategory)) {
    return NextResponse.json({ error: "That category doesn't belong to this day's subject." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("plan_days")
    .select("completed_at, session_id")
    .eq("user_id", user.id)
    .eq("day_number", day)
    .maybeSingle();
  if (existing?.completed_at || existing?.session_id) {
    return NextResponse.json({ error: "This day has already started or finished — it can't be swapped." }, { status: 400 });
  }

  const { data: progress } = await supabase
    .from("category_progress")
    .select("difficulty")
    .eq("user_id", user.id)
    .eq("subcategory", subcategory)
    .maybeSingle();
  const difficulty: Difficulty = (progress?.difficulty as Difficulty) ?? "medium-low";

  const { error: pdErr } = await supabase.from("plan_days").upsert(
    { user_id: user.id, day_number: day, subcategory, difficulty },
    { onConflict: "user_id,day_number" }
  );
  if (pdErr) {
    return NextResponse.json({ error: `Could not save the swap: ${pdErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, day, subcategory, difficulty });
}
