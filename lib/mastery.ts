import type { Difficulty } from "@/lib/types";

/**
 * Skill-map mastery, from a student's graded answers in one category.
 *
 *   mastery = Σ(weight × credit) / Σ(weight), on 0–100
 *   weight  = RECENCY_DECAY ^ k   (k = 0 for the newest answer, 1 for the one before, …)
 *   credit  = TIER_CREDIT[tier] for a correct answer, 0 for a wrong one
 *
 * Recency counts answers rather than days, so a break doesn't fade a tile. Tier credit means
 * acing easy questions tops out near 55 — reaching "mastered" takes harder ones.
 */

export const RECENCY_DECAY = 0.85;

export const TIER_CREDIT: Record<Difficulty, number> = {
  easy: 0.55,
  "medium-low": 0.7,
  "medium-high": 0.85,
  hard: 1,
};

export const WEAK_BELOW = 50;
export const MASTERED_AT = 85;
/** "Mastered" also needs enough evidence, and enough of it at the harder tiers. */
export const MASTERED_MIN_ANSWERS = 10;
export const MASTERED_MIN_HARD = 4;
/** Fewer answers than this and the tile is shown as an estimate. */
export const ESTIMATE_BELOW = 5;

export type MasteryLevel = "not_started" | "weak" | "strong" | "mastered";

export interface GradedAnswer {
  subcategory: string;
  difficulty: Difficulty;
  correct: boolean;
  /** Sort key, newest largest — e.g. session completion time, then position within the set. */
  order: number;
}

export interface CategoryMastery {
  subcategory: string;
  score: number;
  level: MasteryLevel;
  answered: number;
  /** Answers at medium-high or hard. */
  hardAnswered: number;
  /** Too few answers to trust the color yet. */
  estimate: boolean;
}

export function masteryFor(subcategory: string, answers: GradedAnswer[]): CategoryMastery {
  const mine = answers.filter((a) => a.subcategory === subcategory).sort((a, b) => b.order - a.order);
  if (mine.length === 0) {
    return { subcategory, score: 0, level: "not_started", answered: 0, hardAnswered: 0, estimate: false };
  }

  let earned = 0, possible = 0;
  mine.forEach((a, k) => {
    const w = RECENCY_DECAY ** k;
    possible += w;
    if (a.correct) earned += w * TIER_CREDIT[a.difficulty];
  });
  const score = Math.round((earned / possible) * 100);
  const hardAnswered = mine.filter((a) => a.difficulty === "medium-high" || a.difficulty === "hard").length;

  let level: MasteryLevel = score < WEAK_BELOW ? "weak" : "strong";
  if (score >= MASTERED_AT && mine.length >= MASTERED_MIN_ANSWERS && hardAnswered >= MASTERED_MIN_HARD) level = "mastered";

  return { subcategory, score, level, answered: mine.length, hardAnswered, estimate: mine.length < ESTIMATE_BELOW };
}

/** Mastery for each listed category (categories with no answers come back "not_started"). */
export function computeMastery(subcategories: string[], answers: GradedAnswer[]): Record<string, CategoryMastery> {
  return Object.fromEntries(subcategories.map((s) => [s, masteryFor(s, answers)]));
}
