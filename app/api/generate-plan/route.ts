import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDiagnosticSubjectResults } from "@/lib/server/diagnostic";
import { ENGLISH_CATEGORY_ORDER, MATH_CATEGORY_ORDER, ENGLISH_DAYS, MATH_DAYS } from "@/lib/plan";
import { difficultyFromAccuracy, type Tier } from "@/lib/diagnostic-scoring";
import {
  reallocateRemainingDays,
  ENGLISH_FLOOR, ENGLISH_CAP, MATH_FLOOR, MATH_CAP,
  type Override, type CategoryState,
} from "@/lib/plan-generator";
import type { Difficulty } from "@/lib/types";

/**
 * The diagnostic only scores English and Math as a whole now (see lib/diagnostic-scoring.ts) —
 * there's no per-category signal left to differentiate one category's day-count weight from
 * another's within a subject. So every category in a subject gets the *same* broadcast tier —
 * this is deliberately the only thing that changed here: reallocateRemainingDays and the rest
 * of lib/plan-generator.ts are completely untouched, and a uniform tier across a subject's
 * categories naturally makes that allocator split its days evenly within the subject, which is
 * the correct behavior once there's nothing left to differentiate by. A real "which tier maps to
 * which starting difficulty, and how the day-count budgets should change" redesign is a separate
 * follow-up, not this one.
 */
function broadcastResults(order: { subcategory: string }[], tier: Tier, confidence: number): CategoryState[] {
  return order.map((c) => ({ category: c.subcategory, tier, confidence, override: "normal" as Override }));
}

/**
 * Without a diagnostic, a self-reported 200-800 section score stands in for calibrating where
 * that subject's questions should start — no score given defaults to medium-low, the same safe
 * middle ground as if nothing at all were known.
 */
function difficultyFromBaselineScore(score: number | null): Difficulty {
  if (score == null) return "medium-low";
  if (score < 500) return "easy";
  if (score < 630) return "medium-low";
  if (score < 720) return "medium-high";
  return "hard";
}

/**
 * Turns diagnostic results + any manual overrides into the personalized 30-day plan. Never
 * touches a day the user has already started or finished, and never resets a category's
 * adaptive difficulty once it's actually been practiced — this makes the route safe to re-call
 * at *any* time, not just once at first onboarding: a brand-new user has no locked days or
 * touched categories at all, so this naturally degrades to "generate everything." That's also
 * what lets "Redo onboarding" (see app/account/page.tsx) retake the diagnostic and have fresh
 * results actually reshape the *remaining* plan, without disturbing days already done or
 * quietly erasing progress on categories already worked on.
 * Only `skip`/`reduce` are trusted from the client; the diagnostic scores themselves are
 * always recomputed server-side.
 */
export async function POST(req: NextRequest) {
  const { skip, reduce } = await req.json() as { skip?: string[]; reduce?: string[] };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let englishResults: CategoryState[];
  let mathResults: CategoryState[];
  // The actual tier mapping: each subject's starting difficulty, always computed regardless of
  // path — difficultyFromAccuracy for a real diagnostic (finer-grained than the 3-way Tier
  // below, which still drives day-count weighting but no longer decides difficulty on its own),
  // difficultyFromBaselineScore as the self-reported-score fallback when there's no diagnostic
  // to assess at all.
  let difficultyBySubject: Record<"english" | "math", Difficulty>;
  if (user.user_metadata?.diagnostic_skipped) {
    const mathBaseline = (user.user_metadata?.math_baseline_score as number | null | undefined) ?? null;
    const englishBaseline = (user.user_metadata?.english_baseline_score as number | null | undefined) ?? null;
    englishResults = broadcastResults(ENGLISH_CATEGORY_ORDER, "medium", 50);
    mathResults = broadcastResults(MATH_CATEGORY_ORDER, "medium", 50);
    difficultyBySubject = {
      english: difficultyFromBaselineScore(englishBaseline),
      math: difficultyFromBaselineScore(mathBaseline),
    };
  } else {
    const outcome = await getDiagnosticSubjectResults(supabase, user);
    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    }
    const englishSubj = outcome.results.find((r) => r.subject === "english");
    const mathSubj = outcome.results.find((r) => r.subject === "math");
    if (!englishSubj || !mathSubj) {
      return NextResponse.json({ error: "Diagnostic results are incomplete — can't build a plan yet." }, { status: 400 });
    }
    englishResults = broadcastResults(ENGLISH_CATEGORY_ORDER, englishSubj.tier, englishSubj.confidence);
    mathResults = broadcastResults(MATH_CATEGORY_ORDER, mathSubj.tier, mathSubj.confidence);
    difficultyBySubject = {
      english: difficultyFromAccuracy(englishSubj.accuracy),
      math: difficultyFromAccuracy(mathSubj.accuracy),
    };
  }

  const overrideMap = new Map<string, Override>([
    ...(skip ?? []).map((category) => [category, "skip" as const] as const),
    ...(reduce ?? []).map((category) => [category, "reduce" as const] as const),
  ]);
  for (const list of [englishResults, mathResults]) {
    for (const c of list) {
      const o = overrideMap.get(c.category);
      if (o) c.override = o;
    }
  }

  // A day the user has already started (session_id) or finished (completed_at) is off-limits —
  // both to a first-time generation (where none exist yet, so this is a no-op) and to a redo,
  // where it's the whole point. A category that shows up on any such locked day also keeps its
  // real category_progress difficulty below, rather than being reset to the fresh diagnostic's
  // starting point.
  const { data: existingPlanDays } = await supabase
    .from("plan_days").select("day_number, subcategory, completed_at, session_id").eq("user_id", user.id);
  const lockedDays = new Set((existingPlanDays ?? []).filter((r) => r.completed_at || r.session_id).map((r) => r.day_number));
  const lockedSubcategories = new Set(
    (existingPlanDays ?? []).filter((r) => lockedDays.has(r.day_number) && r.subcategory).map((r) => r.subcategory)
  );

  const englishAssignments = reallocateRemainingDays(
    ENGLISH_DAYS.filter((d) => !lockedDays.has(d)), englishResults,
    ENGLISH_CATEGORY_ORDER.map((c) => c.subcategory), ENGLISH_FLOOR, ENGLISH_CAP
  );
  const mathAssignments = reallocateRemainingDays(
    MATH_DAYS.filter((d) => !lockedDays.has(d)), mathResults,
    MATH_CATEGORY_ORDER.map((c) => c.subcategory), MATH_FLOOR, MATH_CAP
  );

  const planDayRows = [
    ...englishAssignments.map((a) => ({
      user_id: user.id, day_number: a.day, subcategory: a.subcategory,
      difficulty: difficultyBySubject.english,
    })),
    ...mathAssignments.map((a) => ({
      user_id: user.id, day_number: a.day, subcategory: a.subcategory,
      difficulty: difficultyBySubject.math,
    })),
  ];

  if (planDayRows.length > 0) {
    const { error: pdErr } = await supabase.from("plan_days").upsert(planDayRows, { onConflict: "user_id,day_number" });
    if (pdErr) {
      return NextResponse.json({ error: `Could not save the plan: ${pdErr.message}` }, { status: 500 });
    }
  }

  const categoryProgressRows = [
    ...englishResults.map((c) => ({ category: c.category, difficulty: difficultyBySubject.english })),
    ...mathResults.map((c) => ({ category: c.category, difficulty: difficultyBySubject.math })),
  ]
    .filter((c) => !lockedSubcategories.has(c.category))
    .map((c) => ({
      user_id: user.id, subcategory: c.category, difficulty: c.difficulty,
      updated_at: new Date().toISOString(),
    }));

  if (categoryProgressRows.length > 0) {
    const { error: cpErr } = await supabase.from("category_progress").upsert(categoryProgressRows, { onConflict: "user_id,subcategory" });
    if (cpErr) {
      return NextResponse.json({ error: `Could not save starting difficulty: ${cpErr.message}` }, { status: 500 });
    }
  }

  const { error: updateErr } = await supabase.auth.updateUser({ data: { onboarding_complete: true } });
  if (updateErr) {
    return NextResponse.json({ error: `Could not finish onboarding: ${updateErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
