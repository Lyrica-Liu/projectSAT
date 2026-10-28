/**
 * Spaced repetition for vocab flashcards: a Leitner system with five boxes. "Got it" moves a
 * word up a box and pushes its next review further out; "Still learning" sends it back to box 1
 * and brings it back soon. A word in box 5 counts as learned. Pure — see app/api/lite/vocab.
 */

export type ReviewResult = "got_it" | "still_learning";

export interface VocabState {
  word: string;
  box: number; // 1–5
  due_at: string; // ISO
  reviews: number;
  lapses: number;
}

const DAY = 86_400_000;
/** Days until the next review after landing in each box (index = box). */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 16, 35];
export const LEARNED_BOX = 5;
/** A missed word comes back after this long (later in the same sitting, or next time). */
export const RELEARN_MS = 10 * 60_000;
export const NEW_PER_SESSION = 10;
export const DECK_SIZE = 20;

export function review(state: VocabState | undefined, word: string, result: ReviewResult, now: Date): VocabState {
  const prev = state ?? { word, box: 0, due_at: now.toISOString(), reviews: 0, lapses: 0 };
  if (result === "still_learning") {
    return { word, box: 1, due_at: new Date(now.getTime() + RELEARN_MS).toISOString(), reviews: prev.reviews + 1, lapses: prev.lapses + (state ? 1 : 0) };
  }
  const box = Math.min(LEARNED_BOX, prev.box + 1);
  return { word, box, due_at: new Date(now.getTime() + BOX_INTERVAL_DAYS[box] * DAY).toISOString(), reviews: prev.reviews + 1, lapses: prev.lapses };
}

/**
 * Today's deck: words that are due (most overdue first), topped up with words never seen (in
 * list order, which is roughly most-useful-first), at most NEW_PER_SESSION new ones.
 */
export function buildDeck(allWords: string[], progress: VocabState[], now: Date, size = DECK_SIZE): { word: string; isNew: boolean }[] {
  const seen = new Set(progress.map((p) => p.word));
  const due = progress
    .filter((p) => new Date(p.due_at).getTime() <= now.getTime())
    .sort((a, b) => a.due_at.localeCompare(b.due_at))
    .map((p) => ({ word: p.word, isNew: false }));
  const fresh = allWords
    .filter((w) => !seen.has(w))
    .slice(0, Math.min(NEW_PER_SESSION, Math.max(0, size - due.length)))
    .map((word) => ({ word, isNew: true }));
  return [...due.slice(0, size), ...fresh].slice(0, size);
}

export function vocabStats(allWords: string[], progress: VocabState[], now: Date) {
  const known = new Set(allWords);
  const mine = progress.filter((p) => known.has(p.word));
  return {
    total: allWords.length,
    learned: mine.filter((p) => p.box >= LEARNED_BOX).length,
    learning: mine.filter((p) => p.box < LEARNED_BOX).length,
    unseen: allWords.length - mine.length,
    dueNow: mine.filter((p) => new Date(p.due_at).getTime() <= now.getTime()).length,
  };
}
