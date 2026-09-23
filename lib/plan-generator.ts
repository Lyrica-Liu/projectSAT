import type { Tier } from "./diagnostic-scoring";
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

/** A category's state for a reallocation scoped to some subset of days. `confidence` is
 *  optional and defaults to a neutral 50 — the post-onboarding "Adjust plan" control has no
 *  diagnostic-accuracy signal left to give (only wherever category_progress.difficulty has
 *  drifted to, tracked separately via tierFromDifficulty in diagnostic-scoring.ts) so it omits
 *  this; generate-plan passes the real diagnostic/baseline-derived confidence when it's
 *  redoing onboarding around already-locked days. */
export interface CategoryState {
  category: string;
  tier: Tier;
  confidence?: number;
  override: Override;
}

/**
 * Same allocate → sequence pipeline generatePlanDays runs, scoped to a caller-supplied set of
 * not-yet-started day numbers for one subject instead of the full 20/10-day onboarding budget.
 * Used by the post-onboarding "Adjust plan" control (Reduce/Skip any time, without touching
 * completed or in-progress days) and by generate-plan itself when it's redoing onboarding
 * around a prior plan's already-locked days.
 */
export function reallocateRemainingDays(
  editableDays: number[],
  categories: CategoryState[],
  canonicalOrder: string[],
  floor: number,
  cap: number
): { day: number; subcategory: string; difficulty: Difficulty }[] {
  const allocInput: AllocInput[] = categories.map((c) => ({
    category: c.category, tier: c.tier, confidence: c.confidence ?? 50, override: c.override,
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
