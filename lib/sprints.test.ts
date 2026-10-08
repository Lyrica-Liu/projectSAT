import { test } from "node:test";
import assert from "node:assert/strict";
import { planSprintDays, sprintDef } from "./sprints";
import type { CategoryMastery } from "./mastery";

const m = (subcategory: string, score: number): CategoryMastery =>
  ({ subcategory, score, level: score === 0 ? "not_started" : score < 50 ? "weak" : "strong", answered: score ? 10 : 0, hardAnswered: 0, estimate: false });

const map = [
  m("Algebra", 70), m("Data Analysis", 30), m("Geometry", 55),
  m("Boundaries", 40), m("Form, Structure, and Sense", 80), m("Transitions", 20), m("Rhetorical Synthesis", 0),
  m("Inferences", 10), m("Words in Context", 90),
];

test("math cram: three weakest math skills, weakest first", () => {
  assert.deepEqual(planSprintDays(sprintDef("math-3")!, map), ["Data Analysis", "Geometry", "Algebra"]);
});

test("math cram skips Advanced Math when it has no questions (not in the map)", () => {
  assert.ok(!planSprintDays(sprintDef("math-3")!, map).includes("Advanced Math"));
});

test("grammar sprint: 7 days, untried first, then cycles weakest-first", () => {
  assert.deepEqual(planSprintDays(sprintDef("grammar-7")!, map), [
    "Rhetorical Synthesis", "Transitions", "Boundaries", "Form, Structure, and Sense",
    "Rhetorical Synthesis", "Transitions", "Boundaries",
  ]);
});

test("weak spots: the seven weakest across everything", () => {
  const days = planSprintDays(sprintDef("weak-7")!, map);
  assert.equal(days.length, 7);
  assert.deepEqual(days.slice(0, 3), ["Rhetorical Synthesis", "Inferences", "Transitions"]);
  assert.ok(!days.includes("Words in Context"));
});

test("an empty pool plans nothing", () => {
  assert.deepEqual(planSprintDays(sprintDef("math-3")!, map.filter((x) => !["Algebra", "Data Analysis", "Geometry"].includes(x.subcategory))), []);
});
