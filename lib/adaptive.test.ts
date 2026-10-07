import { test } from "node:test";
import assert from "node:assert/strict";
import { tierAfterPracticeSet } from "./adaptive";

test("a strong set at your tier moves you up one", () => {
  assert.equal(tierAfterPracticeSet("medium-low", "medium-low", 90), "medium-high");
});

test("a rough set at your tier moves you down one", () => {
  assert.equal(tierAfterPracticeSet("medium-high", "medium-high", 30), "medium-low");
});

test("holding your own on a harder set moves you to it", () => {
  assert.equal(tierAfterPracticeSet("easy", "medium-high", 60), "medium-high");
});

test("an easy warm-up doesn't move a strong student, and failing one drops only a tier", () => {
  assert.equal(tierAfterPracticeSet("hard", "easy", 100), "hard");
  assert.equal(tierAfterPracticeSet("hard", "easy", 60), "hard");
  assert.equal(tierAfterPracticeSet("hard", "easy", 30), "medium-high");
});

test("struggling on a harder set leaves your tier alone", () => {
  assert.equal(tierAfterPracticeSet("medium-low", "hard", 20), "medium-low");
});

test("first set in a category starts from the set's tier", () => {
  assert.equal(tierAfterPracticeSet(null, "medium-low", 85), "medium-high");
  assert.equal(tierAfterPracticeSet(null, "medium-low", 60), "medium-low");
});

test("tiers stop at the ends", () => {
  assert.equal(tierAfterPracticeSet("hard", "hard", 100), "hard");
  assert.equal(tierAfterPracticeSet("easy", "easy", 0), "easy");
});
