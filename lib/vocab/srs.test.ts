import { test } from "node:test";
import assert from "node:assert/strict";
import { review, buildDeck, vocabStats, NEW_PER_SESSION, RELEARN_MS, type VocabState } from "./srs";

const now = new Date("2026-10-28T12:00:00Z");
const daysFrom = (iso: string) => (new Date(iso).getTime() - now.getTime()) / 86_400_000;
const state = (word: string, box: number, dueOffsetDays: number): VocabState =>
  ({ word, box, due_at: new Date(now.getTime() + dueOffsetDays * 86_400_000).toISOString(), reviews: 3, lapses: 0 });

test("a new word known straight away goes to box 1, due tomorrow", () => {
  const s = review(undefined, "candid", "got_it", now);
  assert.equal(s.box, 1);
  assert.equal(daysFrom(s.due_at), 1);
  assert.equal(s.lapses, 0);
});

test("got it climbs a box and spaces out; box 5 stays at 5", () => {
  const s = review(state("candid", 3, 0), "candid", "got_it", now);
  assert.equal(s.box, 4);
  assert.equal(daysFrom(s.due_at), 16);
  assert.equal(review(state("candid", 5, 0), "candid", "got_it", now).box, 5);
});

test("still learning drops to box 1, comes back in minutes, and counts a lapse only for a seen word", () => {
  const s = review(state("candid", 4, 0), "candid", "still_learning", now);
  assert.equal(s.box, 1);
  assert.equal(new Date(s.due_at).getTime() - now.getTime(), RELEARN_MS);
  assert.equal(s.lapses, 1);
  assert.equal(review(undefined, "candid", "still_learning", now).lapses, 0);
});

test("deck: due words first (most overdue first), then new words in list order, capped", () => {
  const words = ["a", "b", "c", "d", "e"];
  const deck = buildDeck(words, [state("b", 2, -1), state("a", 1, -3), state("c", 3, 2)], now);
  assert.deepEqual(deck, [{ word: "a", isNew: false }, { word: "b", isNew: false }, { word: "d", isNew: true }, { word: "e", isNew: true }]);
});

test("deck: new words limited per sitting and by deck size", () => {
  const words = Array.from({ length: 50 }, (_, i) => `w${i}`);
  assert.equal(buildDeck(words, [], now).length, NEW_PER_SESSION);
  const lotsDue = words.slice(0, 25).map((w) => state(w, 1, -1));
  const deck = buildDeck(words, lotsDue, now, 20);
  assert.equal(deck.length, 20);
  assert.equal(deck.every((c) => !c.isNew), true);
});

test("stats", () => {
  const s = vocabStats(["a", "b", "c", "d"], [state("a", 5, 10), state("b", 2, -1), state("gone", 1, -1)], now);
  assert.deepEqual(s, { total: 4, learned: 1, learning: 1, unseen: 2, dueNow: 1 });
});
