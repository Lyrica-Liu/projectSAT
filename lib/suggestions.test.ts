import { test } from "node:test";
import assert from "node:assert/strict";
import { suggestNext, modeFor, type SuggestionInput } from "./suggestions";
import type { CategoryMastery, MasteryLevel } from "./mastery";

function m(subcategory: string, score: number, level?: MasteryLevel): CategoryMastery {
  const lvl = level ?? (score === 0 ? "not_started" : score < 50 ? "weak" : score < 85 ? "strong" : "mastered");
  return { subcategory, score, level: lvl, answered: lvl === "not_started" ? 0 : 10, hardAnswered: 4, estimate: false };
}

const base: SuggestionInput = {
  mastery: [m("Transitions", 30), m("Boundaries", 45), m("Algebra", 70), m("Geometry", 60), m("Inferences", 0)],
  tiers: { Transitions: "medium-low", Boundaries: "medium-low", Algebra: "medium-high", Geometry: "medium-low" },
  daysToTest: null,
  recentSets: [],
};

test("mode by days to test", () => {
  assert.equal(modeFor(null), "explore");
  assert.equal(modeFor(5), "focus");
  assert.equal(modeFor(30), "balanced");
  assert.equal(modeFor(90), "explore");
});

test("an active sprint wins over everything", () => {
  const s = suggestNext({ ...base, sprintNext: { title: "Day 2 of 7", body: "Transitions", href: "/sprints" }, unfinishedSessionId: "x" });
  assert.equal(s?.kind, "sprint");
});

test("an unfinished set comes next", () => {
  assert.equal(suggestNext({ ...base, unfinishedSessionId: "abc" })?.kind, "resume");
});

test("after a strong set, suggest the next tier up", () => {
  const s = suggestNext({ ...base, justFinished: true, recentSets: [{ subcategory: "Algebra", difficulty: "medium-high", score: 90 }] });
  assert.equal(s?.kind === "practice" && s.reason, "level_up");
  assert.equal(s?.kind === "practice" && s.difficulty, "hard");
  assert.match(s!.title, /strong at Algebra\. Ready for Hard/);
});

test("after a rough set, suggest one tier down", () => {
  const s = suggestNext({ ...base, justFinished: true, recentSets: [{ subcategory: "Boundaries", difficulty: "medium-low", score: 20 }] });
  assert.equal(s?.kind === "practice" && s.reason, "step_down");
  assert.equal(s?.kind === "practice" && s.difficulty, "easy");
});

test("close to the test, only the weakest few are suggested", () => {
  const s = suggestNext({ ...base, daysToTest: 7 });
  assert.equal(s?.kind === "practice" && s.reason, "focus");
  assert.ok(["Transitions", "Boundaries", "Geometry"].includes(s?.kind === "practice" ? s.subcategory : ""));
  assert.match(s!.title, /7 days to go/);
});

test("focus mode rotates instead of repeating the last category", () => {
  const s = suggestNext({ ...base, daysToTest: 7, recentSets: [{ subcategory: "Transitions", difficulty: "medium-low", score: 60 }] });
  assert.equal(s?.kind === "practice" && s.subcategory, "Boundaries");
});

test("balanced mode tries an untried category first", () => {
  const s = suggestNext({ ...base, daysToTest: 30 });
  assert.equal(s?.kind === "practice" && s.reason, "explore");
  assert.equal(s?.kind === "practice" && s.subcategory, "Inferences");
  assert.equal(s?.kind === "practice" && s.count, 5);
});

test("balanced mode with everything started picks the weakest", () => {
  const s = suggestNext({ ...base, daysToTest: 30, mastery: base.mastery.filter((x) => x.level !== "not_started") });
  assert.equal(s?.kind === "practice" && s.subcategory, "Transitions");
  assert.match(s!.title, /Transitions is your weakest area/);
});

test("explore mode rotates untried → level-up → weakest", () => {
  const set = (n: number) => Array.from({ length: n }, () => ({ subcategory: "Geometry", difficulty: "medium-low" as const, score: 60 }));
  const reasons = [0, 1, 2].map((n) => {
    const s = suggestNext({ ...base, recentSets: set(n).map((r, i) => ({ ...r, subcategory: ["Geometry", "Algebra", "Boundaries"][i] })) });
    return s?.kind === "practice" ? s.reason : null;
  });
  assert.deepEqual(reasons, ["explore", "level_up", "weakest"]);
});

test("never a third set in a row in the same category outside focus mode", () => {
  const twice = [{ subcategory: "Transitions", difficulty: "medium-low" as const, score: 60 }, { subcategory: "Transitions", difficulty: "medium-low" as const, score: 55 }];
  const s = suggestNext({ ...base, daysToTest: 30, mastery: base.mastery.filter((x) => x.level !== "not_started"), recentSets: twice });
  assert.notEqual(s?.kind === "practice" && s.subcategory, "Transitions");
});

test("a brand-new student gets an untried category", () => {
  const s = suggestNext({ ...base, mastery: base.mastery.map((x) => m(x.subcategory, 0)), tiers: {} });
  assert.equal(s?.kind === "practice" && s.reason, "explore");
});
