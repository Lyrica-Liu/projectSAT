import { ENGLISH_CATEGORY_ORDER, MATH_CATEGORY_ORDER, ENGLISH_DAYS, MATH_DAYS } from "./plan";
import type { CategoryResult, Tier } from "./diagnostic-scoring";
import type { Difficulty } from "./types";

export const ENGLISH_BUDGET = 20, ENGLISH_FLOOR = 1, ENGLISH_CAP = 4;
export const MATH_BUDGET = 10, MATH_FLOOR = 2, MATH_CAP = 5;

/** Where a category's difficulty starts on day 1, seeded from its diagnostic tier. */
export const STARTING_DIFFICULTY: Record<Tier, Difficulty> = {
  weak: "easy", medium: "medium-low", strong: "medium-high",
};

const BASE_WEIGHT: Record<Tier, number> = { weak: 3, medium: 2, strong: 1 };

export type Override = "normal" | "reduce" | "skip";

interface AllocInput {
  category: string;
  tier: Tier;
  confidence: number; // 0-100
  override: Override;
}

/** Confidence nudges weight within a tier only (±50% of the tier's base weight) — it can never push a weak category below a strong one. */
function weightFor(input: AllocInput): number {
  const base = BASE_WEIGHT[input.tier];
  const mult = input.override === "reduce" ? 0.5 : 1;
  const confidenceFactor = Math.max(0.5, Math.min(1.5, 1 + (50 - input.confidence) / 200));
  return base * mult * confidenceFactor;
}

/**
 * Skipped categories get 0 days. Every other category gets `floor`. The "normal" slack
 * (budget minus every category's floor, skipped included) is distributed greedily by weight
 * to whichever active category benefits most, capped — weak/medium naturally win most of this
 * just from having higher base weight. The slack freed *specifically by skips* is distributed
 * the same way but restricted to weak/medium categories, so a skipped category's days land on
 * whoever needs them rather than spreading evenly over everything.
 */
export function allocateDays(categories: AllocInput[], budget: number, floor: number, cap: number): Record<string, number> {
  const rawActive = categories.filter((c) => c.override !== "skip");
  // If literally every category got skipped, honoring that would leave the whole subject with
  // zero allocated days — every calendar day for it would then fall back to a static,
  // skip-oblivious rotation (see start-plan-day's getPlanDay() fallback), which is worse than
  // any single category getting more days than intended. Ignore the skips entirely rather than
  // produce an empty plan.
  const active = rawActive.length > 0 ? rawActive : categories.map((c) => ({ ...c, override: "normal" as const }));

  // The floor phase below guarantees every active category at least `floor` days — safe for
  // the original onboarding budgets (11×1=11≤20, 3×2=6≤10) but not guaranteed for a smaller
  // "remaining days" reallocation, where budget can be much tighter than active.length*floor.
  // Drop the guarantee entirely in that case and let the whole budget flow through the
  // weighted distribute() pass below instead, which already favors weak/medium categories.
  const effectiveFloor = active.length > 0 && budget < active.length * floor ? 0 : floor;

  const counts: Record<string, number> = {};
  const activeSet = new Set(active.map((c) => c.category));
  for (const c of categories) counts[c.category] = activeSet.has(c.category) ? effectiveFloor : 0;

  const skippedCount = categories.length - active.length;
  const normalExtra = Math.max(0, budget - categories.length * effectiveFloor);
  const freedExtra = skippedCount * effectiveFloor;

  function distribute(pool: AllocInput[], amount: number, respectCap: boolean) {
    for (let i = 0; i < amount; i++) {
      let best: AllocInput | null = null;
      let bestScore = -Infinity;
      for (const c of pool) {
        if (respectCap && counts[c.category] >= cap) continue;
        const score = weightFor(c) / (counts[c.category] + 1);
        if (score > bestScore) { bestScore = score; best = c; }
      }
      if (!best) break; // every eligible category is already at cap
      counts[best.category]++;
    }
  }

  distribute(active, normalExtra, true);
  const weakMedium = active.filter((c) => c.tier !== "strong");
  distribute(weakMedium.length > 0 ? weakMedium : active, freedExtra, true);

  // Safety net: a narrow active pool (heavy skipping) can hit `cap` on every eligible category
  // before either pass above finishes spending its share, silently leaving some of `budget`
  // undistributed. An uncapped calendar day is worse than a slightly over-cap category — it
  // falls back to getPlanDay()'s static rotation, which can resurface a category the user just
  // skipped (see the "everyone skipped" comment above for the same underlying failure mode).
  // Mop up any shortfall with one more uncapped pass so every day always lands on some category.
  const allocated = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const shortfall = budget - allocated;
  if (shortfall > 0 && active.length > 0) {
    distribute(active, shortfall, false);
  }

  return counts;
}

/**
 * One slot per active category first, in canonical order (preserves "introduce everything
 * early"), then round-robins the remainder weakest-tier-first so repeat days interleave
 * instead of block-stacking the same category several days in a row.
 */
export function buildCategorySequence(
  dayCounts: Record<string, number>,
  canonicalOrder: string[],
  tierByCategory: Record<string, Tier>
): string[] {
  const sequence: string[] = [];
  const remaining: Record<string, number> = { ...dayCounts };

  for (const cat of canonicalOrder) {
    if ((remaining[cat] ?? 0) > 0) {
      sequence.push(cat);
      remaining[cat]--;
    }
  }

  const tierRank: Record<Tier, number> = { weak: 0, medium: 1, strong: 2 };
  while (Object.values(remaining).some((n) => n > 0)) {
    const roundCats = canonicalOrder
      .filter((cat) => (remaining[cat] ?? 0) > 0)
      .sort((a, b) => tierRank[tierByCategory[a]] - tierRank[tierByCategory[b]]);
    if (roundCats.length === 0) break;
    for (const cat of roundCats) {
      sequence.push(cat);
      remaining[cat]--;
    }
  }

  return sequence;
}

export interface PlanDayAssignment {
  day: number;
  subject: "english" | "math";
  subcategory: string;
  difficulty: Difficulty;
}

export interface CategoryOverride {
  category: string;
  override: Override;
}

/**
 * Orchestrates the whole personalized 30-day allocation: given diagnostic results for all 14
 * categories (11 English + 3 math) plus any manual overrides, computes a day count per category
 * within each subject's fixed budget, sequences those into the existing 20-English/10-math
 * calendar slots, and attaches each day's starting difficulty from its category's diagnostic tier.
 */
export function generatePlanDays(
  englishResults: CategoryResult[],
  mathResults: CategoryResult[],
  overrides: CategoryOverride[]
): PlanDayAssignment[] {
  const overrideMap = new Map(overrides.map((o) => [o.category, o.override]));

  const toAllocInput = (results: CategoryResult[]): AllocInput[] =>
    results.map((r) => ({
      category: r.category, tier: r.tier, confidence: r.confidence,
      override: overrideMap.get(r.category) ?? "normal",
    }));

  const englishCounts = allocateDays(toAllocInput(englishResults), ENGLISH_BUDGET, ENGLISH_FLOOR, ENGLISH_CAP);
  const mathCounts = allocateDays(toAllocInput(mathResults), MATH_BUDGET, MATH_FLOOR, MATH_CAP);

  const tierByCategory: Record<string, Tier> = {};
  for (const r of [...englishResults, ...mathResults]) tierByCategory[r.category] = r.tier;

  const englishSeq = buildCategorySequence(englishCounts, ENGLISH_CATEGORY_ORDER.map((c) => c.subcategory), tierByCategory);
  const mathSeq = buildCategorySequence(mathCounts, MATH_CATEGORY_ORDER.map((c) => c.subcategory), tierByCategory);

  const assignments: PlanDayAssignment[] = [];
  ENGLISH_DAYS.forEach((day, i) => {
    const subcategory = englishSeq[i];
    if (!subcategory) return;
    assignments.push({ day, subject: "english", subcategory, difficulty: STARTING_DIFFICULTY[tierByCategory[subcategory]] });
  });
  MATH_DAYS.forEach((day, i) => {
    const subcategory = mathSeq[i];
    if (!subcategory) return;
    assignments.push({ day, subject: "math", subcategory, difficulty: STARTING_DIFFICULTY[tierByCategory[subcategory]] });
  });

  return assignments.sort((a, b) => a.day - b.day);
}

/** A category's current state for a manual, post-onboarding reallocation — no diagnostic
 *  accuracy/confidence signal exists anymore, only wherever category_progress.difficulty
 *  has drifted to (see tierFromDifficulty in diagnostic-scoring.ts). */
export interface CategoryState {
  category: string;
  tier: Tier;
  override: Override;
}

/**
 * Same allocate → sequence pipeline generatePlanDays runs, scoped to a caller-supplied set of
 * not-yet-started day numbers for one subject instead of the full 20/10-day onboarding budget.
 * Used by the post-onboarding "Adjust plan" control so a Reduce/Skip can be applied any time
 * without touching completed or in-progress days. Confidence is fixed at neutral (50) for every
 * category since there's nothing left to nudge it with post-diagnostic — tier alone drives the
 * weighting, exactly as it does for onboarding's own reduce/skip (confidence there only ever
 * nudges within a tier, never crosses one).
 */
export function reallocateRemainingDays(
  editableDays: number[],
  categories: CategoryState[],
  canonicalOrder: string[],
  floor: number,
  cap: number
): { day: number; subcategory: string; difficulty: Difficulty }[] {
  const allocInput: AllocInput[] = categories.map((c) => ({
    category: c.category, tier: c.tier, confidence: 50, override: c.override,
  }));
  const counts = allocateDays(allocInput, editableDays.length, floor, cap);

  const tierByCategory: Record<string, Tier> = {};
  for (const c of categories) tierByCategory[c.category] = c.tier;

  const sequence = buildCategorySequence(counts, canonicalOrder, tierByCategory);

  return editableDays
    .map((day, i) => {
      const subcategory = sequence[i];
      return subcategory ? { day, subcategory, difficulty: STARTING_DIFFICULTY[tierByCategory[subcategory]] } : null;
    })
    .filter((x): x is { day: number; subcategory: string; difficulty: Difficulty } => x !== null);
}
