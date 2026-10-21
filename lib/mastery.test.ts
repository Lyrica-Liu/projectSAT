import { test } from "node:test";
import assert from "node:assert/strict";
import { masteryFor, computeMastery, pCorrect, type GradedAnswer } from "./mastery";
import type { Difficulty } from "./types";

let clock = 0;
/** One set of n answers at a tier, `right` of them correct (right answers first unless rightLast). */
function set(id: string, difficulty: Difficulty, right: number, n = 10, rightLast = false, sub = "S"): GradedAnswer[] {
  return Array.from({ length: n }, (_, i) => ({
    subcategory: sub, difficulty, order: ++clock, setId: id,
    correct: rightLast ? i >= n - right : i < right,
  }));
}

test("no answers is not started", () => {
  const m = masteryFor("S", []);
  assert.equal(m.level, "not_started");
  assert.equal(m.score, 0);
});

test("acing Easy is strong but can't reach mastered", () => {
  const once = masteryFor("S", set("a", "easy", 10));
  assert.equal(once.level, "strong");
  const many = masteryFor("S", [...set("a", "easy", 10), ...set("b", "easy", 10), ...set("c", "easy", 10), ...set("d", "easy", 10)]);
  assert.equal(many.level, "strong", "no Hard evidence, so never mastered");
});

test("missing most Easy questions is weak", () => {
  assert.equal(masteryFor("S", set("a", "easy", 3)).level, "weak");
});

test("order inside a set doesn't matter", () => {
  const wrongLast = masteryFor("S", set("a", "medium-high", 7));
  const wrongFirst = masteryFor("S", set("b", "medium-high", 7, 10, true));
  assert.equal(wrongLast.score, wrongFirst.score);
  assert.equal(wrongLast.level, "strong");
});

test("strong Hard results lead to mastered; a decent Hard set is strong", () => {
  assert.equal(masteryFor("S", [...set("a", "hard", 9), ...set("b", "hard", 9)]).level, "mastered");
  const decent = masteryFor("S", set("a", "hard", 6));
  assert.equal(decent.level, "strong");
});

test("mastered needs real Hard evidence", () => {
  // Excellent at Medium+, but only 2 Hard answers.
  const m = masteryFor("S", [...set("a", "medium-high", 10), ...set("b", "medium-high", 10), ...set("c", "hard", 2, 2)]);
  assert.notEqual(m.level, "mastered");
});

test("harder questions count for more", () => {
  const easyWin = masteryFor("S", set("a", "easy", 8));
  const hardWin = masteryFor("S", set("b", "hard", 8));
  assert.ok(hardWin.score > easyWin.score);
});

test("missing Hard questions barely hurts; missing Easy ones hurts a lot", () => {
  const base = set("a", "medium-high", 9);
  const before = masteryFor("S", base).score;
  const afterHardMisses = masteryFor("S", [...base, ...set("b", "hard", 0, 3)]).score;
  const afterEasyMisses = masteryFor("S", [...base, ...set("c", "easy", 0, 3)]).score;
  assert.ok(before - afterHardMisses < before - afterEasyMisses, `${before} → hard ${afterHardMisses}, easy ${afterEasyMisses}`);
});

test("recent sets count more than old ones", () => {
  const improving = masteryFor("S", [...set("a", "medium-high", 3), ...set("b", "medium-high", 9)]);
  const slipping = masteryFor("S", [...set("c", "medium-high", 9), ...set("d", "medium-high", 3)]);
  assert.ok(improving.score > slipping.score);
});

test("a couple of answers is only an estimate", () => {
  const quick = masteryFor("S", [...set("q", "easy", 1, 1), ...set("q", "hard", 1, 1)]);
  assert.equal(quick.estimate, true);
  assert.equal(masteryFor("S", set("a", "medium-low", 6)).estimate, false);
});

test("the score is the chance on a Medium+ question", () => {
  const m = masteryFor("S", set("a", "medium-high", 7));
  assert.equal(m.score, Math.round(pCorrect(m.ability, "medium-high") * 100));
});

test("computeMastery keeps categories separate", () => {
  const all = [...set("a", "hard", 10, 10, false, "Algebra"), ...set("b", "hard", 10, 10, false, "Algebra"), ...set("c", "easy", 0, 3, false, "Geometry")];
  const m = computeMastery(["Algebra", "Geometry", "Data Analysis"], all);
  assert.equal(m["Algebra"].level, "mastered");
  assert.equal(m["Geometry"].level, "weak");
  assert.equal(m["Data Analysis"].level, "not_started");
});
