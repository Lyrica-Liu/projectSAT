import type { Difficulty } from "./types";

export type Tier = "strong" | "medium" | "weak";

export const STRONG_THRESHOLD = 75;
export const WEAK_THRESHOLD = 45;

/** Diagnostic-accuracy-only classification — never touched by the self-reported score. */
export function classify(accuracy: number): Tier {
  if (accuracy >= STRONG_THRESHOLD) return "strong";
  if (accuracy < WEAK_THRESHOLD) return "weak";
  return "medium";
}

export interface CategoryResult {
  category: string;
  subject: "english" | "math";
  correct: number;
  total: number;
  accuracy: number;
  tier: Tier;
  /** 0-100, diagnostic accuracy plus a small self-reported-score nudge — used only by plan-generation weighting, never displayed. */
  confidence: number;
}

interface GradedAnswer {
  category: string;
  subject: "english" | "math";
  isCorrect: boolean;
}

/** Groups graded diagnostic answers by category and computes accuracy/tier. `confidence` defaults to the raw accuracy until `withConfidence` folds in a baseline nudge. */
export function computeCategoryResults(answers: GradedAnswer[]): CategoryResult[] {
  const groups = new Map<string, { subject: "english" | "math"; correct: number; total: number }>();
  for (const a of answers) {
    const g = groups.get(a.category) ?? { subject: a.subject, correct: 0, total: 0 };
    g.total++;
    if (a.isCorrect) g.correct++;
    groups.set(a.category, g);
  }
  return Array.from(groups.entries()).map(([category, g]) => {
    const accuracy = g.total > 0 ? Math.round((g.correct / g.total) * 100) : 0;
    return { category, subject: g.subject, correct: g.correct, total: g.total, accuracy, tier: classify(accuracy), confidence: accuracy };
  });
}

/** A 200-800 section score nudges confidence by up to ±8 points, centered on a neutral 500. */
function baselineNudge(sectionScore: number | null): number {
  if (sectionScore == null) return 0;
  return Math.round(((sectionScore - 500) / 300) * 8);
}

/**
 * Post-onboarding, there's no diagnostic accuracy left to classify from — only wherever
 * category_progress.difficulty has adaptively drifted to since. This is the inverse-ish of
 * STARTING_DIFFICULTY, used to derive a live "how are they doing now" tier for the manual
 * plan-edit controls (both to decide what to show and, server-side, what's skip/reduce-eligible).
 */
export function tierFromDifficulty(d: Difficulty): Tier {
  if (d === "easy") return "weak";
  if (d === "medium-low") return "medium";
  return "strong"; // medium-high | hard
}

/** Folds the matching self-reported section score into each category's confidence — Math score nudges math categories, English/R&W score nudges English categories. Never changes `tier`. */
export function withConfidence(
  results: CategoryResult[],
  mathBaselineScore: number | null,
  englishBaselineScore: number | null
): CategoryResult[] {
  return results.map((r) => {
    const nudge = r.subject === "math" ? baselineNudge(mathBaselineScore) : baselineNudge(englishBaselineScore);
    return { ...r, confidence: Math.max(0, Math.min(100, r.accuracy + nudge)) };
  });
}
