import type { CategoryMastery } from "@/lib/mastery";

/**
 * Optional sprints: a short run of daily practice sets with a clear finish line. One set per
 * day; a sprint's days are picked from the student's weakest categories in its area when it
 * starts. "full-30" is the original 30-day plan (it keeps using plan_days and /plan).
 */

export type SprintKey = "math-3" | "grammar-7" | "weak-7" | "full-30";

export interface SprintDef {
  key: SprintKey;
  title: string;
  tagline: string;
  days: number;
  questionsPerDay: number;
  /** Categories the sprint draws from; null means every practicable category. */
  pool: string[] | null;
}

export const GRAMMAR = ["Boundaries", "Form, Structure, and Sense", "Transitions", "Rhetorical Synthesis"];
export const MATH = ["Algebra", "Advanced Math", "Data Analysis", "Geometry"];

export const SPRINTS: SprintDef[] = [
  { key: "math-3", title: "3-Day Math Cram", tagline: "Your three weakest Math skills, one a day.", days: 3, questionsPerDay: 10, pool: MATH },
  { key: "grammar-7", title: "7-Day Grammar Sprint", tagline: "Punctuation, grammar and transitions, weakest first.", days: 7, questionsPerDay: 10, pool: GRAMMAR },
  { key: "weak-7", title: "7-Day Weak Spots", tagline: "A different weak skill every day for a week.", days: 7, questionsPerDay: 10, pool: null },
  { key: "full-30", title: "30-Day Full Prep", tagline: "The complete plan: every skill, paced over a month.", days: 30, questionsPerDay: 20, pool: null },
];

export function sprintDef(key: string): SprintDef | undefined {
  return SPRINTS.find((s) => s.key === key);
}

/**
 * The category for each day of a short sprint: the pool's categories weakest first (untried
 * ones count as weakest), cycling if the sprint has more days than the pool has categories.
 * `mastery` lists the practicable categories; anything outside it is skipped.
 */
export function planSprintDays(def: SprintDef, mastery: CategoryMastery[]): string[] {
  const pool = mastery.filter((m) => def.pool === null || def.pool.includes(m.subcategory));
  if (pool.length === 0) return [];
  const weakestFirst = pool.slice().sort((a, b) => a.score - b.score);
  return Array.from({ length: def.days }, (_, i) => weakestFirst[i % weakestFirst.length].subcategory);
}
