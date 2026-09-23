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

export interface SubjectResult {
  subject: "english" | "math";
  correct: number;
  total: number;
  accuracy: number;
  tier: Tier;
  /** 0-100, diagnostic accuracy plus a small self-reported-score nudge — used only by plan-generation weighting, never displayed. */
  confidence: number;
}

interface GradedAnswer {
  subject: "english" | "math";
  isCorrect: boolean;
}

/** A 200-800 section score nudges confidence by up to ±8 points, centered on a neutral 500. */
function baselineNudge(sectionScore: number | null): number {
  if (sectionScore == null) return 0;
  return Math.round(((sectionScore - 500) / 300) * 8);
}

/**
 * Groups graded diagnostic answers by subject (english/math only — no per-category breakdown)
 * and computes each subject's accuracy/tier, with the matching self-reported baseline score
 * folded into confidence (math score nudges the math result, English/R&W score nudges the
 * English result). Never returns a subject with no graded answers at all.
 */
export function computeSubjectResults(
  answers: GradedAnswer[],
  mathBaselineScore: number | null,
  englishBaselineScore: number | null
): SubjectResult[] {
  const groups = new Map<"english" | "math", { correct: number; total: number }>();
  for (const a of answers) {
    const g = groups.get(a.subject) ?? { correct: 0, total: 0 };
    g.total++;
    if (a.isCorrect) g.correct++;
    groups.set(a.subject, g);
  }

  return (["english", "math"] as const)
    .filter((subject) => groups.has(subject))
    .map((subject) => {
      const g = groups.get(subject)!;
      const accuracy = g.total > 0 ? Math.round((g.correct / g.total) * 100) : 0;
      const nudge = subject === "math" ? baselineNudge(mathBaselineScore) : baselineNudge(englishBaselineScore);
      const confidence = Math.max(0, Math.min(100, accuracy + nudge));
      return { subject, correct: g.correct, total: g.total, accuracy, tier: classify(accuracy), confidence };
    });
}

/**
 * Maps a subject's diagnostic accuracy directly to a starting Difficulty — the actual "tier
 * mapping" a diagnostic result drives (foundational/medium/medium-high/high, i.e.
 * easy/medium-low/medium-high/hard). This is deliberately finer-grained than `classify`'s 3-way
 * Tier: the WEAK_THRESHOLD/STRONG_THRESHOLD boundaries (45/75) still bound the two ends, with a
 * single new midpoint (60) splitting the broad "medium" band in two, so a mid-band diagnostic
 * result no longer collapses down to one flat starting difficulty. `classify`/Tier itself is
 * untouched and still drives everything else that depends on it (day-count allocation weighting,
 * the live category_progress-derived tier `/api/adjust-plan` uses) — this only decides where a
 * subject's questions actually start.
 */
export function difficultyFromAccuracy(accuracy: number): Difficulty {
  if (accuracy < WEAK_THRESHOLD) return "easy";
  if (accuracy < 60) return "medium-low";
  if (accuracy < STRONG_THRESHOLD) return "medium-high";
  return "hard";
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
