import { test } from "node:test";
import assert from "node:assert/strict";
import { masteryFor, computeMastery, type GradedAnswer } from "./mastery";
import type { Difficulty } from "./types";

/** Answers listed oldest → newest. */
function answers(sub: string, list: [Difficulty, boolean][]): GradedAnswer[] {
  return list.map(([difficulty, correct], i) => ({ subcategory: sub, difficulty, correct, order: i }));
}
const repeat = <T>(x: T, n: number) => Array.from({ length: n }, () => x);

test("no answers is not started", () => {
  const m = masteryFor("Transitions", []);
  assert.equal(m.level, "not_started");
  assert.equal(m.score, 0);
});

test("perfect on easy questions tops out near 55, never mastered", () => {
  const m = masteryFor("Transitions", answers("Transitions", repeat(["easy", true], 20)));
  assert.equal(m.score, 55);
  assert.equal(m.level, "strong");
});

test("perfect on hard questions with enough evidence is mastered", () => {
  const m = masteryFor("Algebra", answers("Algebra", repeat(["hard", true], 10)));
  assert.equal(m.score, 100);
  assert.equal(m.level, "mastered");
});

test("a high score without enough hard answers stays strong", () => {
  const list: [Difficulty, boolean][] = [...repeat<[Difficulty, boolean]>(["medium-low", true], 8), ...repeat<[Difficulty, boolean]>(["hard", true], 3)];
  const m = masteryFor("Algebra", answers("Algebra", list));
  assert.ok(m.score < 85 || m.hardAnswered < 4);
  assert.notEqual(m.level, "mastered");
});

test("mostly wrong is weak", () => {
  const m = masteryFor("Boundaries", answers("Boundaries", [["medium-low", false], ["medium-low", false], ["medium-low", true], ["medium-low", false]]));
  assert.equal(m.level, "weak");
});

test("recent answers outweigh old ones", () => {
  const improving = masteryFor("Inferences", answers("Inferences", [...repeat<[Difficulty, boolean]>(["medium-high", false], 10), ...repeat<[Difficulty, boolean]>(["medium-high", true], 10)]));
  const slipping = masteryFor("Inferences", answers("Inferences", [...repeat<[Difficulty, boolean]>(["medium-high", true], 10), ...repeat<[Difficulty, boolean]>(["medium-high", false], 10)]));
  assert.ok(improving.score > 60, `improving ${improving.score}`);
  assert.ok(slipping.score < 25, `slipping ${slipping.score}`);
});

test("fewer than 5 answers is flagged as an estimate", () => {
  assert.equal(masteryFor("Geometry", answers("Geometry", repeat(["easy", true], 3))).estimate, true);
  assert.equal(masteryFor("Geometry", answers("Geometry", repeat(["easy", true], 5))).estimate, false);
});

test("computeMastery keeps categories separate", () => {
  const all = [...answers("Algebra", repeat(["hard", true], 10)), ...answers("Geometry", repeat(["easy", false], 3))];
  const m = computeMastery(["Algebra", "Geometry", "Data Analysis"], all);
  assert.equal(m["Algebra"].level, "mastered");
  assert.equal(m["Geometry"].level, "weak");
  assert.equal(m["Data Analysis"].level, "not_started");
});
