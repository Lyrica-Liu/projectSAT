import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDiagnosticCategoryResults } from "@/lib/server/diagnostic";
import { ENGLISH_CATEGORY_ORDER, MATH_CATEGORY_ORDER } from "@/lib/plan";
import { withConfidence, type CategoryResult } from "@/lib/diagnostic-scoring";
import { generatePlanDays, STARTING_DIFFICULTY, type CategoryOverride } from "@/lib/plan-generator";
import type { Difficulty } from "@/lib/types";

/**
 * Every category on equal footing tier-wise, used when the diagnostic was skipped — a
 * subject-level self-reported score says nothing about which specific categories within it
 * need more days than others, so day-count weighting stays uniform (tier "medium" for
 * everyone). The plan still gets generated (same spirit as the app's pre-diagnostic behavior)
 * instead of leaving onboarding stuck on a step the user opted out of. That score still nudges
 * confidence via withConfidence below (a subject-level tilt in day-count weighting only) —
 * actual starting difficulty is handled separately below, by difficultyFromBaselineScore.
 */
function neutralResults(order: { subcategory: string }[], subject: "english" | "math"): CategoryResult[] {
  return order.map((c) => ({ category: c.subcategory, subject, correct: 0, total: 0, accuracy: 0, tier: "medium", confidence: 50 }));
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
 * Turns diagnostic results + any manual overrides into the actual personalized 30-day plan —
 * writes every plan_days row up front (instead of the old fixed-11 + lazy-reallocated-9
 * scheme) and seeds category_progress for all 14 categories from their diagnostic tier.
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

  let results: CategoryResult[];
  // Only set when the diagnostic was skipped — overrides the tier-derived difficulty below
  // with the direct score-based one instead, per subject. Real diagnostic results already have
  // an assessed accuracy behind their tier, so this never applies there.
  let baselineDifficultyBySubject: Record<"english" | "math", Difficulty> | null = null;
  if (user.user_metadata?.diagnostic_skipped) {
    const mathBaseline = (user.user_metadata?.math_baseline_score as number | null | undefined) ?? null;
    const englishBaseline = (user.user_metadata?.english_baseline_score as number | null | undefined) ?? null;
    results = withConfidence(
      [...neutralResults(ENGLISH_CATEGORY_ORDER, "english"), ...neutralResults(MATH_CATEGORY_ORDER, "math")],
      mathBaseline, englishBaseline
    );
    baselineDifficultyBySubject = {
      english: difficultyFromBaselineScore(englishBaseline),
      math: difficultyFromBaselineScore(mathBaseline),
    };
  } else {
    const outcome = await getDiagnosticCategoryResults(supabase, user);
    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    }
    results = outcome.results;
  }

  const overrides: CategoryOverride[] = [
    ...(skip ?? []).map((category) => ({ category, override: "skip" as const })),
    ...(reduce ?? []).map((category) => ({ category, override: "reduce" as const })),
  ];

  const englishResults = results.filter((r) => r.subject === "english");
  const mathResults = results.filter((r) => r.subject === "math");
  if (englishResults.length === 0 || mathResults.length === 0) {
    return NextResponse.json({ error: "Diagnostic results are incomplete — can't build a plan yet." }, { status: 400 });
  }

  const assignments = generatePlanDays(englishResults, mathResults, overrides);

  const { error: pdErr } = await supabase.from("plan_days").upsert(
    assignments.map((a) => ({
      user_id: user.id, day_number: a.day, subcategory: a.subcategory,
      difficulty: baselineDifficultyBySubject ? baselineDifficultyBySubject[a.subject] : a.difficulty,
    })),
    { onConflict: "user_id,day_number" }
  );
  if (pdErr) {
    return NextResponse.json({ error: `Could not save the plan: ${pdErr.message}` }, { status: 500 });
  }

  const { error: cpErr } = await supabase.from("category_progress").upsert(
    results.map((r) => ({
      user_id: user.id, subcategory: r.category,
      difficulty: baselineDifficultyBySubject ? baselineDifficultyBySubject[r.subject] : STARTING_DIFFICULTY[r.tier],
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "user_id,subcategory" }
  );
  if (cpErr) {
    return NextResponse.json({ error: `Could not save starting difficulty: ${cpErr.message}` }, { status: 500 });
  }

  const { error: updateErr } = await supabase.auth.updateUser({ data: { onboarding_complete: true } });
  if (updateErr) {
    return NextResponse.json({ error: `Could not finish onboarding: ${updateErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
