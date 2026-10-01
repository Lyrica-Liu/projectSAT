import { nextTier } from "@/lib/adaptive";
import { DIFFICULTY_LABELS, DIFFICULTY_TONES } from "@/lib/plan";
import type { QuestionSkill, MathSkill, Difficulty } from "@/lib/types";

/**
 * Per-skill "where you stand / what to practice next" insights, shared by For You and the
 * Extra practice page so both recommend the same skills at the same difficulty.
 */

export const GRASP_LABEL_BY_N = ["", "Emerging", "Developing", "Proficient", "Strong"];
export const GRASP_N: Record<Difficulty, number> = { easy: 1, "medium-low": 2, "medium-high": 3, hard: 4 };
export const TIER_RANK: Record<Difficulty, number> = { easy: 0, "medium-low": 1, "medium-high": 2, hard: 3 };

export interface TierStats { correct: number; total: number }

export interface SkillInsight {
  skill: QuestionSkill | MathSkill;
  label: string;
  note: string;
  hasData: boolean;
  currentTier: Difficulty;
  graspN: number;
  grasp: string;
  accuracy: number;
  totalAnswered: number;
  suggestedTier: Difficulty;
  suggestedLabel: string;
  suggestedTone: string;
  advice: string;
}

export function buildSkillInsight(
  skill: QuestionSkill | MathSkill,
  label: string,
  note: string,
  subcats: string[],
  byTier: Partial<Record<QuestionSkill | MathSkill, Partial<Record<Difficulty, TierStats>>>>,
  progressBySubcategory: Map<string, Difficulty>
): SkillInsight {
  const tiers = byTier[skill] ?? {};
  const totalAnswered = Object.values(tiers).reduce((a, t) => a + (t?.total ?? 0), 0);
  const hasData = totalAnswered > 0;

  const progressTiers = subcats.map((sc) => progressBySubcategory.get(sc)).filter((t): t is Difficulty => !!t);
  let currentTier: Difficulty = "medium-low";
  if (progressTiers.length > 0) {
    currentTier = progressTiers.sort((a, b) => TIER_RANK[b] - TIER_RANK[a])[0];
  } else if (hasData) {
    currentTier = (Object.entries(tiers).sort((a, b) => (b[1]?.total ?? 0) - (a[1]?.total ?? 0))[0]?.[0] as Difficulty) ?? "medium-low";
  }

  const atTier = tiers[currentTier];
  const overallCorrect = Object.values(tiers).reduce((a, t) => a + (t?.correct ?? 0), 0);
  const accuracy = atTier && atTier.total > 0
    ? Math.round((atTier.correct / atTier.total) * 100)
    : hasData ? Math.round((overallCorrect / totalAnswered) * 100) : 0;

  const suggestedTier: Difficulty = !hasData ? currentTier : accuracy > 83 ? nextTier(currentTier, "up") : accuracy < 50 ? nextTier(currentTier, "down") : currentTier;
  const direction = suggestedTier === currentTier ? "hold" : accuracy > 83 ? "up" : "down";
  const tierLabel = DIFFICULTY_LABELS[currentTier];
  const advice = !hasData
    ? "Not practiced yet — a quick session here will unlock suggestions."
    : direction === "up"
    ? `Acing ${tierLabel} at ${accuracy}% — moving you up to find your ceiling.`
    : direction === "down"
    ? `Under 50% at ${tierLabel} — dropping a notch to rebuild confidence.`
    : `Steady at ${tierLabel} — ${accuracy}% and holding the sweet spot.`;

  return {
    skill, label, note, hasData,
    currentTier, graspN: GRASP_N[currentTier], grasp: GRASP_LABEL_BY_N[GRASP_N[currentTier]],
    accuracy, totalAnswered,
    suggestedTier, suggestedLabel: DIFFICULTY_LABELS[suggestedTier], suggestedTone: DIFFICULTY_TONES[suggestedTier],
    advice,
  };
}

/** Weakest first: lowest grasp level, then lowest accuracy. */
export const byWeakness = (a: SkillInsight, b: SkillInsight) => a.graspN - b.graspN || a.accuracy - b.accuracy;

export type TierTally = Partial<Record<QuestionSkill | MathSkill, Partial<Record<Difficulty, TierStats>>>>;

/** Tallies graded answers (rows of `is_correct, question:questions(skill, difficulty)`) by skill and tier. */
export function tallyByTier(rows: { is_correct: boolean | null; question: unknown }[]): TierTally {
  const byTier: TierTally = {};
  for (const row of rows) {
    const q = (Array.isArray(row.question) ? row.question[0] : row.question) as { skill: QuestionSkill | MathSkill; difficulty: Difficulty } | null;
    if (!q || row.is_correct === null) continue;
    const tiers = (byTier[q.skill] ??= {});
    const t = (tiers[q.difficulty] ??= { correct: 0, total: 0 });
    t.total++;
    if (row.is_correct) t.correct++;
  }
  return byTier;
}
