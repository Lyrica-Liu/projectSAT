import { computeSessionState } from "@/lib/adaptive";
import { CATEGORIES } from "@/lib/categories";
import type { CategoryMastery } from "@/lib/mastery";
import type { Difficulty } from "@/lib/types";

/**
 * How Lite's endless card stream picks its next question. Pure: the API routes load the data
 * and do the database work (lib/server/lite-stream.ts).
 *
 *   adaptive  mostly the student's weakest skills, some of everything else, the odd past mistake
 *   clinic    one weakest skill, drilled with its difficulty adapting card by card, every third
 *             card a past mistake when there are any
 *   pick      the categories the student chose (English, Math, or one skill)
 */
export type StreamMode = "adaptive" | "clinic" | "pick";

export const STREAM_MODES: StreamMode[] = ["adaptive", "clinic", "pick"];

/** What "Pick" offers besides a single category. */
export const PICK_GROUPS: Record<"english" | "math", string[]> = {
  english: CATEGORIES.filter((c) => c.subject === "Reading & Writing").map((c) => c.subcategory),
  math: CATEGORIES.filter((c) => c.subject === "Math").map((c) => c.subcategory),
};

/** Fixed when a stream starts (stored on the session) so each card needn't reload the skill map. */
export interface StreamPlan {
  mode: StreamMode;
  /** The categories the stream is about, weakest first. */
  focus: string[];
  /** Adaptive only: every other category, for variety. */
  others: string[];
  /** Each category's tier when the stream started. */
  tiers: Record<string, Difficulty>;
  /** Set when the student stops, so ending twice can't move tiers twice. */
  endedAt?: string;
}

/** A category needs this many cards in one stream before the stream moves its stored tier. */
export const TIER_UPDATE_MIN_CARDS = 5;

export interface StreamCard {
  subcategory: string;
  difficulty: Difficulty;
  correct: boolean;
  /** Re-asked from the student's past mistakes rather than drawn from the bank. */
  mistake: boolean;
}

export type NextPick = { kind: "mistake" } | { kind: "bank"; subcategory: string; difficulty: Difficulty };

const ADAPTIVE_FOCUS_SIZE = 3;
const ADAPTIVE_MISTAKE_RATE = 0.1;
const ADAPTIVE_OTHER_RATE = 0.2;
const CLINIC_MISTAKE_EVERY = 3;
const DEFAULT_TIER: Difficulty = "medium-low";

/**
 * `mastery` lists the practicable categories (the skill map's). Returns null when there's
 * nothing to draw from, e.g. a Pick of categories that have no questions.
 */
export function buildStreamPlan(
  mode: StreamMode,
  mastery: CategoryMastery[],
  tiers: Record<string, Difficulty>,
  pick: string[] = [],
): StreamPlan | null {
  // Untried categories score 0, so they count as weakest, the same as sprints.
  const weakestFirst = mastery.slice().sort((a, b) => a.score - b.score).map((m) => m.subcategory);
  let focus: string[];
  let others: string[] = [];
  if (mode === "adaptive") {
    focus = weakestFirst.slice(0, ADAPTIVE_FOCUS_SIZE);
    others = weakestFirst.slice(ADAPTIVE_FOCUS_SIZE);
  } else if (mode === "clinic") {
    focus = weakestFirst.slice(0, 1);
  } else {
    focus = weakestFirst.filter((s) => pick.includes(s));
  }
  if (focus.length === 0) return null;
  const all = [...focus, ...others];
  return { mode, focus, others, tiers: Object.fromEntries(all.map((s) => [s, tiers[s] ?? DEFAULT_TIER])) };
}

/** A category's tier right now: where it started, moved by this stream's answers (2 right up, 3 wrong down). */
export function currentTier(plan: StreamPlan, history: StreamCard[], subcategory: string): Difficulty {
  const own = history.filter((c) => !c.mistake && c.subcategory === subcategory);
  return computeSessionState(
    own.map((c) => ({ difficulty: c.difficulty, isCorrect: c.correct })),
    plan.tiers[subcategory] ?? DEFAULT_TIER,
  ).currentDifficulty;
}

/** Avoids the category just asked when there's another choice, so the stream doesn't feel stuck. */
function choose(options: string[], history: StreamCard[], rand: () => number): string {
  const last = [...history].reverse().find((c) => !c.mistake)?.subcategory;
  const fresh = options.length > 1 ? options.filter((s) => s !== last) : options;
  return fresh[Math.floor(rand() * fresh.length)];
}

/** `history` is this stream's answered cards, oldest first. */
export function pickNext(
  plan: StreamPlan,
  history: StreamCard[],
  { mistakesAvailable }: { mistakesAvailable: boolean },
  rand: () => number = Math.random,
): NextPick {
  const lastWasMistake = history.at(-1)?.mistake ?? false;
  const canMistake = mistakesAvailable && !lastWasMistake;
  const bank = (subcategory: string): NextPick => ({ kind: "bank", subcategory, difficulty: currentTier(plan, history, subcategory) });

  if (plan.mode === "clinic") {
    if (canMistake && history.length % CLINIC_MISTAKE_EVERY === CLINIC_MISTAKE_EVERY - 1) return { kind: "mistake" };
    return bank(plan.focus[0]);
  }

  if (plan.mode === "adaptive") {
    const r = rand();
    if (canMistake && r < ADAPTIVE_MISTAKE_RATE) return { kind: "mistake" };
    if (plan.others.length > 0 && r < ADAPTIVE_MISTAKE_RATE + ADAPTIVE_OTHER_RATE) return bank(choose(plan.others, history, rand));
  }

  return bank(choose(plan.focus, history, rand));
}
