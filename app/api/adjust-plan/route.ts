import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ENGLISH_CATEGORY_ORDER, MATH_CATEGORY_ORDER, ENGLISH_DAYS, MATH_DAYS } from "@/lib/plan";
import { tierFromDifficulty } from "@/lib/diagnostic-scoring";
import { reallocateRemainingDays, ENGLISH_FLOOR, ENGLISH_CAP, MATH_FLOOR, MATH_CAP, type CategoryState, type Override } from "@/lib/plan-generator";
import type { Difficulty } from "@/lib/types";

/**
 * The post-onboarding "Adjust plan" control — a Reduce/Skip cascade like onboarding's own,
 * but scoped to only the days of one subject the user hasn't started yet. Never touches a
 * completed or in-progress day, and never touches category_progress (unlike /api/generate-plan,
 * which is destructive if re-called mid-plan — see the plan file for why this needed its own route).
 */
export async function POST(req: NextRequest) {
  const { subject, skip, reduce } = await req.json() as { subject?: string; skip?: string[]; reduce?: string[] };

  if (subject !== "english" && subject !== "math") {
    return NextResponse.json({ error: "Invalid subject." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const [{ data: progressRows }, { data: planRows }] = await Promise.all([
    supabase.from("category_progress").select("subcategory, difficulty").eq("user_id", user.id),
    supabase.from("plan_days").select("day_number, completed_at, session_id").eq("user_id", user.id),
  ]);

  const subjectDays = subject === "english" ? ENGLISH_DAYS : MATH_DAYS;
  const lockedDays = new Set(
    (planRows ?? []).filter((r) => r.completed_at || r.session_id).map((r) => r.day_number)
  );
  const editableDays = subjectDays.filter((d) => !lockedDays.has(d));
  if (editableDays.length === 0) {
    return NextResponse.json({ error: "No editable days remain for this subject." }, { status: 400 });
  }

  const canonicalOrder = (subject === "english" ? ENGLISH_CATEGORY_ORDER : MATH_CATEGORY_ORDER).map((c) => c.subcategory);
  const difficultyByCategory = new Map((progressRows ?? []).map((r) => [r.subcategory, r.difficulty as Difficulty]));

  // Re-derive tier — and therefore skip/reduce eligibility — server-side from the user's
  // current category_progress. Never trust the client's skip/reduce lists directly: a category
  // whose live tier isn't "strong" is silently dropped, not honored, mirroring onboarding's own
  // rule that reduce/skip only ever applies to a strong category.
  const skipSet = new Set(skip ?? []);
  const reduceSet = new Set(reduce ?? []);
  const categories: CategoryState[] = canonicalOrder.map((category) => {
    const tier = tierFromDifficulty(difficultyByCategory.get(category) ?? "medium-low");
    let override: Override = "normal";
    if (tier === "strong") {
      if (skipSet.has(category)) override = "skip";
      else if (reduceSet.has(category)) override = "reduce";
    }
    return { category, tier, override };
  });

  const floor = subject === "english" ? ENGLISH_FLOOR : MATH_FLOOR;
  const cap = subject === "english" ? ENGLISH_CAP : MATH_CAP;
  const result = reallocateRemainingDays(editableDays, categories, canonicalOrder, floor, cap);

  const { error: pdErr } = await supabase.from("plan_days").upsert(
    result.map((r) => ({ user_id: user.id, day_number: r.day, subcategory: r.subcategory, difficulty: r.difficulty })),
    { onConflict: "user_id,day_number" }
  );
  if (pdErr) {
    return NextResponse.json({ error: `Could not save the plan: ${pdErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, days: result });
}
