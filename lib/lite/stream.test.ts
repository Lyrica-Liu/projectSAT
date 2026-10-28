import { test } from "node:test";
import assert from "node:assert/strict";
import { buildStreamPlan, pickNext, currentTier, type StreamCard, type StreamPlan } from "./stream";
import type { CategoryMastery } from "../mastery";

function m(subcategory: string, score: number): CategoryMastery {
  return { subcategory, score, level: score === 0 ? "not_started" : "weak", answered: 10, hardAnswered: 0, estimate: false, ability: 0, uncertainty: 0.5 };
}

const mastery = [m("Algebra", 70), m("Transitions", 20), m("Boundaries", 40), m("Geometry", 55), m("Inferences", 30)];
const card = (subcategory: string, correct: boolean, difficulty: StreamCard["difficulty"] = "medium-low", mistake = false): StreamCard =>
  ({ subcategory, difficulty, correct, mistake });
const fixed = (...values: number[]) => { let i = 0; return () => values[i++ % values.length]; };

test("adaptive focuses on the three weakest and keeps the rest for variety", () => {
  const plan = buildStreamPlan("adaptive", mastery, { Transitions: "easy" })!;
  assert.deepEqual(plan.focus, ["Transitions", "Inferences", "Boundaries"]);
  assert.deepEqual(plan.others, ["Geometry", "Algebra"]);
  assert.equal(plan.tiers.Transitions, "easy");
  assert.equal(plan.tiers.Algebra, "medium-low"); // no stored tier yet
});

test("clinic drills the single weakest category", () => {
  assert.deepEqual(buildStreamPlan("clinic", mastery, {})!.focus, ["Transitions"]);
});

test("pick keeps only the chosen categories, weakest first", () => {
  const plan = buildStreamPlan("pick", mastery, {}, ["Algebra", "Geometry", "Not A Category"])!;
  assert.deepEqual(plan.focus, ["Geometry", "Algebra"]);
  assert.equal(buildStreamPlan("pick", mastery, {}, ["Nothing"]), null);
});

test("difficulty moves within the stream: 2 right up, 3 wrong down; mistakes don't count", () => {
  const plan = buildStreamPlan("clinic", mastery, { Transitions: "medium-low" })!;
  assert.equal(currentTier(plan, [card("Transitions", true), card("Transitions", true)], "Transitions"), "medium-high");
  assert.equal(currentTier(plan, [card("Transitions", false), card("Transitions", false), card("Transitions", false)], "Transitions"), "easy");
  assert.equal(currentTier(plan, [card("Transitions", true), card("Transitions", true, "hard", true)], "Transitions"), "medium-low");
});

test("clinic asks a past mistake every third card, never two in a row", () => {
  const plan = buildStreamPlan("clinic", mastery, {})!;
  const two = [card("Transitions", true), card("Transitions", false)];
  assert.deepEqual(pickNext(plan, two, { mistakesAvailable: true }), { kind: "mistake" });
  assert.equal(pickNext(plan, two, { mistakesAvailable: false }).kind, "bank");
  assert.equal(pickNext(plan, [card("Transitions", true)], { mistakesAvailable: true }).kind, "bank");
  // Five cards in (a mistake slot again) but the last card was already a mistake.
  const afterMistake = [...two, card("Transitions", true), card("Transitions", true), card("Transitions", true, "medium-low", true)];
  assert.equal(pickNext(plan, afterMistake, { mistakesAvailable: true }).kind, "bank");
});

test("adaptive: low rolls give a mistake, middling rolls another category, the rest the focus", () => {
  const plan = buildStreamPlan("adaptive", mastery, {})!;
  assert.deepEqual(pickNext(plan, [], { mistakesAvailable: true }, fixed(0.05)), { kind: "mistake" });
  const other = pickNext(plan, [], { mistakesAvailable: true }, fixed(0.2, 0));
  assert.equal(other.kind === "bank" && plan.others.includes(other.subcategory), true);
  const focus = pickNext(plan, [], { mistakesAvailable: true }, fixed(0.9, 0));
  assert.equal(focus.kind === "bank" && plan.focus.includes(focus.subcategory), true);
  // Without mistakes available, a low roll falls through to another category instead.
  assert.equal(pickNext(plan, [], { mistakesAvailable: false }, fixed(0.05, 0)).kind, "bank");
});

test("doesn't repeat the category just asked when there's a choice", () => {
  const plan: StreamPlan = { mode: "pick", focus: ["Algebra", "Geometry"], others: [], tiers: { Algebra: "easy", Geometry: "easy" } };
  for (const r of [0, 0.5, 0.99]) {
    const next = pickNext(plan, [card("Algebra", true)], { mistakesAvailable: false }, fixed(r));
    assert.deepEqual(next, { kind: "bank", subcategory: "Geometry", difficulty: "easy" });
  }
});
