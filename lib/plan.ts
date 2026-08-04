import type { QuestionSkill, MathSkill, Difficulty } from "./types";

export type PlanSubject = "english" | "math";

/** Every English plan-day session runs this many adaptive questions. */
export const ENGLISH_SESSION_LENGTH = 20;

/** Every math plan-day session runs this many adaptive questions. */
export const MATH_SESSION_LENGTH = 20;

export interface PlanDay {
  day: number;
  subject: PlanSubject;
  skill: QuestionSkill | MathSkill | null;
  subcategory: string | null; // name used by the question bank; null = not yet determined
  difficulty: Difficulty | null; // starting difficulty; null = not yet determined
  focus: string;
  durationMins: number;
}

/** The 3 DSAT math categories, cycled repeatedly across the 10 math plan-days. */
export const MATH_CATEGORY_ORDER: { subcategory: string; skill: MathSkill; focus: string }[] = [
  { subcategory: "Algebra",       skill: "algebra",       focus: "Algebra" },
  { subcategory: "Data Analysis", skill: "data_analysis", focus: "Data Analysis" },
  { subcategory: "Geometry",      skill: "geometry",       focus: "Geometry" },
];

/**
 * The 11 SAT categories, in the order the first 11 English slots introduce
 * them (matches the question bank's order and the practice-setup page).
 * Every category always starts at medium-low the first time it's practiced.
 */
export const ENGLISH_CATEGORY_ORDER: { subcategory: string; skill: QuestionSkill; focus: string }[] = [
  { subcategory: "Central Ideas and Details",          skill: "central_idea",           focus: "Central Ideas & Details" },
  { subcategory: "Command of Evidence (Textual)",       skill: "command_of_evidence",    focus: "Command of Evidence (Textual)" },
  { subcategory: "Command of Evidence (Quantitative)",  skill: "command_of_evidence",    focus: "Command of Evidence (Quantitative)" },
  { subcategory: "Inferences",                          skill: "inferences",             focus: "Inferences" },
  { subcategory: "Words in Context",                    skill: "words_in_context",       focus: "Words in Context" },
  { subcategory: "Text Structure and Purpose",          skill: "text_structure",         focus: "Text Structure & Purpose" },
  { subcategory: "Cross-Text Connections",              skill: "cross_text_connections", focus: "Cross-Text Connections" },
  { subcategory: "Transitions",                         skill: "transitions",            focus: "Transitions" },
  { subcategory: "Rhetorical Synthesis",                skill: "rhetorical_synthesis",   focus: "Rhetorical Synthesis" },
  { subcategory: "Boundaries",                          skill: "boundaries",             focus: "Boundaries" },
  { subcategory: "Form, Structure, and Sense",          skill: "form_structure_sense",   focus: "Form, Structure & Sense" },
];

/**
 * Calendar pattern: E, E, M repeating across 30 days.
 */
const CALENDAR: { day: number; subject: PlanSubject; durationMins: number }[] = [
  { day:  1, subject: "english", durationMins: 14 },
  { day:  2, subject: "english", durationMins: 14 },
  { day:  3, subject: "math",    durationMins: 15 },
  { day:  4, subject: "english", durationMins: 14 },
  { day:  5, subject: "english", durationMins: 14 },
  { day:  6, subject: "math",    durationMins: 15 },
  { day:  7, subject: "english", durationMins: 14 },
  { day:  8, subject: "english", durationMins: 14 },
  { day:  9, subject: "math",    durationMins: 15 },
  { day: 10, subject: "english", durationMins: 16 },
  { day: 11, subject: "english", durationMins: 16 },
  { day: 12, subject: "math",    durationMins: 15 },
  { day: 13, subject: "english", durationMins: 16 },
  { day: 14, subject: "english", durationMins: 16 },
  { day: 15, subject: "math",    durationMins: 15 },
  { day: 16, subject: "english", durationMins: 16 },
  { day: 17, subject: "english", durationMins: 18 },
  { day: 18, subject: "math",    durationMins: 15 },
  { day: 19, subject: "english", durationMins: 18 },
  { day: 20, subject: "english", durationMins: 18 },
  { day: 21, subject: "math",    durationMins: 15 },
  { day: 22, subject: "english", durationMins: 18 },
  { day: 23, subject: "english", durationMins: 18 },
  { day: 24, subject: "math",    durationMins: 15 },
  { day: 25, subject: "english", durationMins: 18 },
  { day: 26, subject: "english", durationMins: 18 },
  { day: 27, subject: "math",    durationMins: 15 },
  { day: 28, subject: "english", durationMins: 18 },
  { day: 29, subject: "english", durationMins: 18 },
  { day: 30, subject: "math",    durationMins: 20 },
];

export const ENGLISH_DAYS = CALENDAR.filter((c) => c.subject === "english").map((c) => c.day);
export const MATH_DAYS = CALENDAR.filter((c) => c.subject === "math").map((c) => c.day);

/** 1-20 for English calendar days, null for math days / out-of-range days. */
export function englishSlotNumber(day: number): number | null {
  const idx = ENGLISH_DAYS.indexOf(day);
  return idx === -1 ? null : idx + 1;
}

/** Inverse of englishSlotNumber: the calendar day for English slot 1-20. */
export function dayForEnglishSlot(slot: number): number | undefined {
  return ENGLISH_DAYS[slot - 1];
}

/** 1-10 for math calendar days, null for English days / out-of-range days. */
export function mathSlotNumber(day: number): number | null {
  const idx = MATH_DAYS.indexOf(day);
  return idx === -1 ? null : idx + 1;
}

/** Inverse of mathSlotNumber: the calendar day for math slot 1-10. */
export function dayForMathSlot(slot: number): number | undefined {
  return MATH_DAYS[slot - 1];
}

/**
 * Static plan-day info. English slots 1-11 are fully determined (fixed
 * category order, always starting medium-low). Slots 12-20 depend on how
 * the user performed across slots 1-11, so subcategory/difficulty come back
 * null here — callers merge in the persisted `plan_days.subcategory` /
 * `plan_days.difficulty` columns once that assignment has been computed.
 */
export function getPlanDay(day: number): PlanDay | undefined {
  const cal = CALENDAR.find((c) => c.day === day);
  if (!cal) return undefined;

  if (cal.subject === "math") {
    const slot = mathSlotNumber(day)!;
    const cat = MATH_CATEGORY_ORDER[(slot - 1) % MATH_CATEGORY_ORDER.length];
    return {
      day: cal.day, subject: "math", skill: cat.skill, subcategory: cat.subcategory,
      difficulty: "medium-low", focus: cat.focus, durationMins: cal.durationMins,
    };
  }

  const slot = englishSlotNumber(day)!;
  if (slot <= 11) {
    const cat = ENGLISH_CATEGORY_ORDER[slot - 1];
    return {
      day: cal.day, subject: "english", skill: cat.skill, subcategory: cat.subcategory,
      difficulty: "medium-low", focus: cat.focus, durationMins: cal.durationMins,
    };
  }

  return {
    day: cal.day, subject: "english", skill: null, subcategory: null, difficulty: null,
    focus: "English Review", durationMins: cal.durationMins,
  };
}

export const PLAN: PlanDay[] = CALENDAR.map((c) => getPlanDay(c.day)!);

export type PlanPhase = { label: string; days: PlanDay[] };

export const PLAN_PHASES: PlanPhase[] = [
  { label: "Phase 1 — Foundation",   days: PLAN.slice(0, 10)  },
  { label: "Phase 2 — Development",  days: PLAN.slice(10, 20) },
  { label: "Phase 3 — Mastery",      days: PLAN.slice(20, 30) },
];

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Easy",
  "medium-low": "Medium",
  "medium-high": "Medium+",
  hard: "Hard",
};

export const DIFFICULTY_TONES: Record<string, string> = {
  easy: "mint",
  "medium-low": "sky",
  "medium-high": "peach",
  hard: "rose",
};

/**
 * Consecutive calendar days with at least one plan completion, ending today
 * or yesterday. Tolerates one missed day per rolling 7-day window (a "grace
 * day") without breaking the streak — that day just doesn't add to the count.
 */
export function calcStreak(rows: { completed_at: string | null }[]): number {
  return walkStreak(rows).streak;
}

/** Whether this week's grace day (one forgiven miss per 7-day window) has already been used. */
export function isGraceDayUsed(rows: { completed_at: string | null }[]): boolean {
  return walkStreak(rows).graceUsed;
}

function walkStreak(rows: { completed_at: string | null }[]): { streak: number; graceUsed: boolean } {
  const dates = new Set(
    rows
      .filter((r) => r.completed_at)
      .map((r) => r.completed_at!.slice(0, 10))
  );

  let streak = 0;
  let graceUsed = false;
  let daysSinceWindowStart = 0;
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let offset = 0; offset < 60; offset++) {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    const key = d.toISOString().slice(0, 10);

    daysSinceWindowStart++;
    if (daysSinceWindowStart > 7) {
      daysSinceWindowStart = 1;
      graceUsed = false;
    }

    if (dates.has(key)) {
      streak++;
    } else if (offset === 0) {
      // Today not done yet — still count from yesterday
      daysSinceWindowStart--;
      continue;
    } else if (!graceUsed) {
      graceUsed = true;
    } else {
      break;
    }
  }

  return { streak, graceUsed };
}

/** Next day the user should work on (first incomplete day, or 31 if all done). */
export function getCurrentPlanDay(completedDayNumbers: number[]): number {
  const done = new Set(completedDayNumbers);
  for (let d = 1; d <= 30; d++) {
    if (!done.has(d)) return d;
  }
  return 31; // all complete
}
