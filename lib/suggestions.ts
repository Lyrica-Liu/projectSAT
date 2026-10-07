import { nextTier } from "@/lib/adaptive";
import { DIFFICULTY_LABELS } from "@/lib/plan";
import type { CategoryMastery } from "@/lib/mastery";
import type { Difficulty } from "@/lib/types";

/**
 * "Next up": one suggested action, from fixed rules (no AI). The first rule that applies wins:
 *   1. an active sprint's next day
 *   2. an unfinished practice set
 *   3. right after a set: ≥ 80% → try the next tier up; < 40% → one tier down
 *   4. by days until the test:
 *        < 14 days ("focus")      — only the 3 weakest practiced categories
 *        14–60 days ("balanced")  — an untried category first, then the weakest
 *        > 60 or no date ("explore") — rotate: untried → level-up → weakest
 *   5. variety: never a third set in a row in the same category (except in focus mode)
 */

export const LEVEL_UP_AT = 80;
export const STEP_DOWN_BELOW = 40;
export const FOCUS_DAYS = 14;
export const BALANCED_DAYS = 60;
export const FOCUS_POOL = 3;
export const SET_SIZE = 10;
export const EXPLORE_SET_SIZE = 5;
const START_TIER: Difficulty = "medium-low";

export interface RecentSet {
  subcategory: string;
  difficulty: Difficulty;
  /** 0–100 */
  score: number;
}

export interface SprintNext {
  title: string;
  body: string;
  href: string;
}

export interface SuggestionInput {
  /** Categories that can be practiced right now, in display order. */
  mastery: CategoryMastery[];
  /** Current tier per category (category_progress); missing means not set yet. */
  tiers: Record<string, Difficulty>;
  daysToTest: number | null;
  /** Finished single-category practice sets, newest first. */
  recentSets: RecentSet[];
  unfinishedSessionId?: string | null;
  sprintNext?: SprintNext | null;
  /** True on a results page, where rule 3 looks at recentSets[0]. */
  justFinished?: boolean;
}

export type PracticeReason = "level_up" | "step_down" | "focus" | "weakest" | "explore";

export type Suggestion =
  | { kind: "sprint"; title: string; body: string; href: string }
  | { kind: "resume"; title: string; body: string; sessionId: string }
  | { kind: "practice"; title: string; body: string; reason: PracticeReason; subcategory: string; difficulty: Difficulty; count: number };

export type Mode = "focus" | "balanced" | "explore";

export function modeFor(daysToTest: number | null): Mode {
  if (daysToTest === null || daysToTest < 0) return "explore";
  if (daysToTest < FOCUS_DAYS) return "focus";
  if (daysToTest <= BALANCED_DAYS) return "balanced";
  return "explore";
}

const label = (d: Difficulty) => DIFFICULTY_LABELS[d] ?? d;

function practice(reason: PracticeReason, subcategory: string, difficulty: Difficulty, count: number, title: string, body: string): Suggestion {
  return { kind: "practice", reason, subcategory, difficulty, count, title, body };
}

export function suggestNext(input: SuggestionInput): Suggestion | null {
  const { mastery, tiers, daysToTest, recentSets } = input;
  if (mastery.length === 0) return null;
  const tierOf = (s: string) => tiers[s] ?? START_TIER;

  // 1–2
  if (input.sprintNext) return { kind: "sprint", ...input.sprintNext };
  if (input.unfinishedSessionId) {
    return { kind: "resume", title: "Finish the set you started", body: "Your answers are saved — pick up where you left off.", sessionId: input.unfinishedSessionId };
  }

  // 3
  const last = recentSets[0];
  if (input.justFinished && last && mastery.some((m) => m.subcategory === last.subcategory)) {
    if (last.score >= LEVEL_UP_AT && last.difficulty !== "hard") {
      const up = nextTier(last.difficulty, "up");
      return practice("level_up", last.subcategory, up, SET_SIZE, `You're strong at ${last.subcategory}. Ready for ${label(up)}?`, `${SET_SIZE} questions at ${label(up)}.`);
    }
    if (last.score < STEP_DOWN_BELOW && last.difficulty !== "easy") {
      const down = nextTier(last.difficulty, "down");
      return practice("step_down", last.subcategory, down, SET_SIZE, `${last.subcategory} was tough. Try ${label(down)}?`, `Build it back up with ${SET_SIZE} questions at ${label(down)}.`);
    }
  }

  // 5 (applied to 4): a category done twice in a row is skipped, unless it's all that's left.
  const mode = modeFor(daysToTest);
  const repeated = recentSets.length >= 2 && recentSets[0].subcategory === recentSets[1].subcategory ? recentSets[0].subcategory : null;
  const allowed = (s: string) => mode === "focus" || s !== repeated;

  const started = mastery.filter((m) => m.level !== "not_started");
  const weakestFirst = started.slice().sort((a, b) => a.score - b.score);
  const untried = mastery.filter((m) => m.level === "not_started" && allowed(m.subcategory));
  const weakest = weakestFirst.filter((m) => allowed(m.subcategory));
  // A level-up candidate: strong or mastered, and not already at the top tier.
  const climbable = started
    .filter((m) => (m.level === "strong" || m.level === "mastered") && tierOf(m.subcategory) !== "hard" && allowed(m.subcategory))
    .sort((a, b) => b.score - a.score);

  const suggestWeakest = (m: CategoryMastery, reason: "focus" | "weakest") => {
    const t = tierOf(m.subcategory);
    return reason === "focus"
      ? practice("focus", m.subcategory, t, SET_SIZE, `${daysToTest} days to go: focus on ${m.subcategory}`, `One of your ${FOCUS_POOL} weakest areas — ${SET_SIZE} questions at ${label(t)}.`)
      : practice("weakest", m.subcategory, t, SET_SIZE, `${m.subcategory} is your weakest area. Try ${SET_SIZE} questions?`, `At ${label(t)}, where you are now.`);
  };
  const suggestUntried = (m: CategoryMastery) =>
    practice("explore", m.subcategory, START_TIER, EXPLORE_SET_SIZE, `Try ${m.subcategory}`, `You haven't practiced it yet — ${EXPLORE_SET_SIZE} quick questions.`);
  const suggestClimb = (m: CategoryMastery) => {
    const up = nextTier(tierOf(m.subcategory), "up");
    return practice("level_up", m.subcategory, up, SET_SIZE, `You're strong at ${m.subcategory}. Ready for ${label(up)}?`, `${SET_SIZE} questions at ${label(up)}.`);
  };

  // 4
  if (mode === "focus" && weakestFirst.length > 0) {
    // Rotate through the weakest few so focus mode isn't the same set every time.
    const pool = weakestFirst.slice(0, FOCUS_POOL);
    const pick = pool.find((m) => m.subcategory !== last?.subcategory) ?? pool[0];
    return suggestWeakest(pick, "focus");
  }
  if (mode === "balanced") {
    if (untried.length > 0) return suggestUntried(untried[0]);
    if (weakest.length > 0) return suggestWeakest(weakest[0], "weakest");
  }
  if (mode === "explore" || mode === "focus") {
    const order = [
      () => (untried.length > 0 ? suggestUntried(untried[0]) : null),
      () => (climbable.length > 0 ? suggestClimb(climbable[0]) : null),
      () => (weakest.length > 0 ? suggestWeakest(weakest[0], "weakest") : null),
    ];
    const start = recentSets.length % order.length;
    for (let i = 0; i < order.length; i++) {
      const s = order[(start + i) % order.length]();
      if (s) return s;
    }
  }

  // Everything filtered out by the variety rule: fall back to the weakest overall.
  return weakestFirst[0] ? suggestWeakest(weakestFirst[0], "weakest") : suggestUntried(mastery[0]);
}
