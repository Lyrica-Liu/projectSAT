import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDiagnosticCategoryResults } from "@/lib/server/diagnostic";
import { ENGLISH_CATEGORY_ORDER, MATH_CATEGORY_ORDER } from "@/lib/plan";
import { withConfidence, type CategoryResult, type Tier } from "@/lib/diagnostic-scoring";
import { generatePlanDays, STARTING_DIFFICULTY, type CategoryOverride } from "@/lib/plan-generator";

/** A reported 200-800 section score stands in for a tier when there's no diagnostic accuracy
 *  to classify from — the same rough cutoffs a diagnostic's own STRONG/WEAK thresholds imply. */
function tierFromBaselineScore(score: number | null): Tier {
  if (score == null) return "medium";
  if (score >= 650) return "strong";
  if (score < 450) return "weak";
  return "medium";
}

/**
 * Every category on equal footing, used when the diagnostic was skipped — the plan still gets
 * generated (evenly paced, same spirit as the app's pre-diagnostic behavior) instead of leaving
 * onboarding stuck on a step the user explicitly opted out of. Where a self-reported baseline
 * score exists, it stands in for the whole subject's tier (the only signal available at all
 * without a diagnostic) — withConfidence below then nudges confidence from that same score too,
 * same "primary signal decides tier, secondary nudges confidence" pattern the diagnostic path uses.
 */
function neutralResults(order: { subcategory: string }[], subject: "english" | "math", baselineScore: number | null): CategoryResult[] {
  const tier = tierFromBaselineScore(baselineScore);
  return order.map((c) => ({ category: c.subcategory, subject, correct: 0, total: 0, accuracy: 0, tier, confidence: 50 }));
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
  if (user.user_metadata?.diagnostic_skipped) {
    const mathBaseline = (user.user_metadata?.math_baseline_score as number | null | undefined) ?? null;
    const englishBaseline = (user.user_metadata?.english_baseline_score as number | null | undefined) ?? null;
    results = withConfidence(
      [...neutralResults(ENGLISH_CATEGORY_ORDER, "english", englishBaseline), ...neutralResults(MATH_CATEGORY_ORDER, "math", mathBaseline)],
      mathBaseline, englishBaseline
    );
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
      user_id: user.id, day_number: a.day, subcategory: a.subcategory, difficulty: a.difficulty,
    })),
    { onConflict: "user_id,day_number" }
  );
  if (pdErr) {
    return NextResponse.json({ error: `Could not save the plan: ${pdErr.message}` }, { status: 500 });
  }

  const { error: cpErr } = await supabase.from("category_progress").upsert(
    results.map((r) => ({
      user_id: user.id, subcategory: r.category, difficulty: STARTING_DIFFICULTY[r.tier],
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
