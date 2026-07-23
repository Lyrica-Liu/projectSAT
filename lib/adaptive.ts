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
