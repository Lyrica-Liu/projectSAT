import type { Difficulty } from "./types";

export const TIER_ORDER: Difficulty[] = ["easy", "medium-low", "medium-high", "hard"];

export function nextTier(current: Difficulty, direction: "up" | "down"): Difficulty {
  const i = TIER_ORDER.indexOf(current);
  const j = direction === "up" ? i + 1 : i - 1;
  return TIER_ORDER[Math.min(TIER_ORDER.length - 1, Math.max(0, j))];
}

export interface SessionState {
  currentDifficulty: Difficulty;
  correctStreak: number;
  wrongStreak: number;
}

/**
 * Replays the streak rule over an ordered history of answered questions:
 * 2 correct in a row levels up, 3 wrong in a row levels down, and either
 * resets both streaks. Pure function — the single source of truth for
 * "what tier are we at right now."
 */
export function computeSessionState(
  history: { difficulty: Difficulty; isCorrect: boolean }[],
  startDifficulty: Difficulty
): SessionState {
  let currentDifficulty = startDifficulty;
  let correctStreak = 0;
  let wrongStreak = 0;

  for (const { isCorrect } of history) {
    if (isCorrect) {
      correctStreak++;
      wrongStreak = 0;
      if (correctStreak === 2) {
        currentDifficulty = nextTier(currentDifficulty, "up");
        correctStreak = 0;
        wrongStreak = 0;
      }
    } else {
      wrongStreak++;
      correctStreak = 0;
      if (wrongStreak === 3) {
        currentDifficulty = nextTier(currentDifficulty, "down");
        correctStreak = 0;
        wrongStreak = 0;
      }
    }
  }

  return { currentDifficulty, correctStreak, wrongStreak };
}

/**
 * ~80% of slots stay at the current tier; ~20% pull from a random
 * neighboring tier for review/challenge variety.
 */
export function pickNextTier(currentDifficulty: Difficulty): Difficulty {
  const i = TIER_ORDER.indexOf(currentDifficulty);
  const neighbors: Difficulty[] = [];
  if (i > 0) neighbors.push(TIER_ORDER[i - 1]);
  if (i < TIER_ORDER.length - 1) neighbors.push(TIER_ORDER[i + 1]);

  if (neighbors.length === 0 || Math.random() < 0.8) return currentDifficulty;
  return neighbors[Math.floor(Math.random() * neighbors.length)];
}

/**
 * A category's stored tier after a fixed-difficulty practice set (plan days adapt question by
 * question instead — see computeSessionState). Uses the same thresholds as "Next up":
 *   ≥ 80% at or above the stored tier → one tier above the set
 *   < 40% at or below the stored tier → one tier below the stored tier (never a freefall)
 *   ≥ 40% on a set harder than the stored tier → the set's tier (they've shown they can handle it)
 *   anything else → unchanged (an easy warm-up shouldn't drag a strong student down)
 */
export function tierAfterPracticeSet(stored: Difficulty | null, setTier: Difficulty, score: number): Difficulty {
  const current = stored ?? setTier;
  const rank = (d: Difficulty) => TIER_ORDER.indexOf(d);
  if (score >= 80 && rank(setTier) >= rank(current)) return nextTier(setTier, "up");
  if (score < 40 && rank(setTier) <= rank(current)) return nextTier(current, "down");
  if (score >= 40 && rank(setTier) > rank(current)) return setTier;
  return current;
}
