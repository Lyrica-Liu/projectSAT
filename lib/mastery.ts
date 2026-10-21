import type { Difficulty } from "@/lib/types";

/**
 * Skill-map mastery as an ability estimate (a small Elo/IRT-style model), one per category.
 *
 * Each category has an ability θ on the same scale as the four difficulty tiers. The chance
 * of answering a question right is a logistic curve:
 *
 *     P(correct) = 1 / (1 + e^-(θ − tierDifficulty))
 *
 * Every finished set updates θ in one step — a Bayesian (MAP) update whose prior is the
 * previous estimate — so the order of questions inside a set doesn't matter. Older evidence
 * fades by SET_DECAY per later set, which keeps recent sets weightier and θ able to move.
 * Beating harder questions raises θ more; missing easy ones lowers it more; missing a Hard
 * question barely hurts (it was expected).
 *
 * Levels describe what the student can probably answer:
 *   weak      under WEAK_BELOW chance on a Medium question
 *   strong    otherwise
 *   mastered  ≥ MASTERED_AT chance on a Hard question, enough certainty, and real Hard evidence
 */

/** Where each tier sits on the ability scale. */
export const TIER_DIFFICULTY: Record<Difficulty, number> = {
  easy: -1.5,
  "medium-low": -0.5,
  "medium-high": 0.5,
  hard: 1.5,
};

/** Starting belief: an average student, held loosely. */
export const PRIOR_ABILITY = 0;
export const PRIOR_INFORMATION = 1;
/** How much of the earlier evidence carries into each later set. */
export const SET_DECAY = 0.8;

export const WEAK_BELOW = 0.6; // chance on a Medium question
export const MASTERED_AT = 0.7; // chance on a Hard question
/** Mastered also needs certainty (standard error) and some Hard answers to back it. */
export const MASTERED_MAX_UNCERTAINTY = 0.6;
export const MASTERED_MIN_HARD = 3;
/** Above this uncertainty the tile is shown as an estimate. */
export const ESTIMATE_ABOVE = 0.75;

export type MasteryLevel = "not_started" | "weak" | "strong" | "mastered";

export interface GradedAnswer {
  subcategory: string;
  difficulty: Difficulty;
  correct: boolean;
  /** Sort key, newest largest — e.g. session completion time, then position within the set. */
  order: number;
  /** The set (session) it was answered in. Answers without one count as their own set. */
  setId?: string;
}

export interface CategoryMastery {
  subcategory: string;
  /** Chance (0–100) of answering a Medium+ question right — used for ordering and display. */
  score: number;
  level: MasteryLevel;
  answered: number;
  /** Answers at the Hard tier. */
  hardAnswered: number;
  /** Not enough certainty yet; show the tile faded. */
  estimate: boolean;
  /** The ability estimate θ and its standard error. */
  ability: number;
  uncertainty: number;
}

export function pCorrect(ability: number, difficulty: Difficulty): number {
  return 1 / (1 + Math.exp(-(ability - TIER_DIFFICULTY[difficulty])));
}

/**
 * One set's update: maximize the set's likelihood plus a Gaussian prior centered on the
 * current estimate (Newton's method), then add the set's information.
 */
export function updateAbility(
  ability: number,
  information: number,
  set: { difficulty: Difficulty; correct: boolean }[],
): { ability: number; information: number } {
  let theta = ability;
  for (let i = 0; i < 8; i++) {
    let gradient = -information * (theta - ability);
    let curvature = information;
    for (const a of set) {
      const p = pCorrect(theta, a.difficulty);
      gradient += (a.correct ? 1 : 0) - p;
      curvature += p * (1 - p);
    }
    const step = gradient / curvature;
    theta += Math.max(-1.5, Math.min(1.5, step));
    if (Math.abs(step) < 1e-6) break;
  }
  const gained = set.reduce((sum, a) => { const p = pCorrect(theta, a.difficulty); return sum + p * (1 - p); }, 0);
  return { ability: theta, information: information + gained };
}

export function masteryFor(subcategory: string, answers: GradedAnswer[]): CategoryMastery {
  const mine = answers.filter((a) => a.subcategory === subcategory);
  const base = { subcategory, answered: mine.length, hardAnswered: mine.filter((a) => a.difficulty === "hard").length };
  if (mine.length === 0) {
    return { ...base, score: 0, level: "not_started", estimate: false, ability: PRIOR_ABILITY, uncertainty: 1 / Math.sqrt(PRIOR_INFORMATION) };
  }

  // Group into sets, oldest first.
  const sets = new Map<string, GradedAnswer[]>();
  mine.forEach((a, i) => {
    const key = a.setId ?? `answer-${i}`;
    sets.set(key, [...(sets.get(key) ?? []), a]);
  });
  const ordered = [...sets.values()].sort((x, y) => Math.max(...x.map((a) => a.order)) - Math.max(...y.map((a) => a.order)));

  let ability = PRIOR_ABILITY;
  let information = PRIOR_INFORMATION;
  ordered.forEach((set, i) => {
    ({ ability, information } = updateAbility(ability, i === 0 ? information : information * SET_DECAY, set));
  });

  const uncertainty = 1 / Math.sqrt(information);
  let level: MasteryLevel = pCorrect(ability, "medium-low") < WEAK_BELOW ? "weak" : "strong";
  if (
    pCorrect(ability, "hard") >= MASTERED_AT &&
    uncertainty <= MASTERED_MAX_UNCERTAINTY &&
    base.hardAnswered >= MASTERED_MIN_HARD
  ) level = "mastered";

  return {
    ...base,
    score: Math.round(pCorrect(ability, "medium-high") * 100),
    level,
    estimate: uncertainty > ESTIMATE_ABOVE,
    ability,
    uncertainty,
  };
}

/** Mastery for each listed category (categories with no answers come back "not_started"). */
export function computeMastery(subcategories: string[], answers: GradedAnswer[]): Record<string, CategoryMastery> {
  return Object.fromEntries(subcategories.map((s) => [s, masteryFor(s, answers)]));
}
