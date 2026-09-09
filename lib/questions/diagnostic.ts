import { getBankQuestions } from "./parser";
import { getMathBankQuestions } from "./mathParser";
import { ENGLISH_CATEGORY_ORDER, MATH_CATEGORY_ORDER } from "@/lib/plan";
import type { Difficulty } from "@/lib/types";

/** Every English subcategory gets 3 questions, spread across these tiers. */
const ENGLISH_TIERS: Difficulty[] = ["easy", "medium-high", "hard"];

/** Every math category gets 5 questions, spread across these tiers (medium-high twice). */
const MATH_TIERS: Difficulty[] = ["easy", "medium-low", "medium-high", "medium-high", "hard"];

export interface DiagnosticPoolItem {
  /** Exact subcategory/category string — matches plan_days.subcategory and category_progress.subcategory. */
  category: string;
  subject: "english" | "math";
  domain: "reading" | "writing" | "math";
  skill: string;
  difficulty: Difficulty;
  passage: string | null;
  stem: string;
  options: { A: string; B: string; C: string; D: string } | null;
  answer: "A" | "B" | "C" | "D" | null;
  gridAnswer: string | null;
  explanation: string;
  questionType: "multiple_choice" | "grid_in";
}

/**
 * Builds the ~48-question diagnostic pool: all 11 English subcategories at 3 questions each
 * (33 total) and all 3 math categories at 5 questions each (15 total), each spread across
 * mixed difficulty tiers. Every bank cell has 30-40 questions, so — unlike the modulo-wrap
 * pooling used by start-bank-practice/start-math-practice — this guarantees the exact requested
 * count per category with no repeats, tracked via a keys-seen set across the whole build.
 *
 * The uniqueness key deliberately isn't just `stem`: some subcategories (Transitions is the
 * clearest case) reuse one fixed instruction stem across all 30 questions in a cell — what
 * actually varies is the passage and options. Keying on all three avoids treating those as
 * duplicates and silently starving that category down to a single pickable question.
 */
export function buildDiagnosticPool(): DiagnosticPoolItem[] {
  const pool: DiagnosticPoolItem[] = [];
  const usedKeys = new Set<string>();

  function keyFor(q: { passage: string | null; stem: string; options: unknown; gridAnswer?: string | null }): string {
    return `${q.passage ?? ""}|||${q.stem}|||${JSON.stringify(q.options)}|||${q.gridAnswer ?? ""}`;
  }

  function pickOne<T extends { passage: string | null; stem: string; options: unknown; gridAnswer?: string | null }>(candidates: T[]): T | null {
    const fresh = candidates.filter((q) => !usedKeys.has(keyFor(q)));
    if (fresh.length === 0) return null;
    const picked = fresh[Math.floor(Math.random() * fresh.length)];
    usedKeys.add(keyFor(picked));
    return picked;
  }

  for (const { subcategory, skill } of ENGLISH_CATEGORY_ORDER) {
    for (const tier of ENGLISH_TIERS) {
      const picked = pickOne(getBankQuestions(subcategory, tier));
      if (!picked) continue; // bank cell exhausted (shouldn't happen at these sizes, but don't crash the diagnostic over it)
      pool.push({
        category: subcategory, subject: "english", domain: picked.domain, skill,
        difficulty: picked.difficulty, passage: picked.passage, stem: picked.stem,
        options: picked.options, answer: picked.answer, gridAnswer: null,
        explanation: picked.explanation, questionType: "multiple_choice",
      });
    }
  }

  for (const { subcategory, skill } of MATH_CATEGORY_ORDER) {
    for (const tier of MATH_TIERS) {
      const picked = pickOne(getMathBankQuestions(subcategory, tier));
      if (!picked) continue;
      pool.push({
        category: subcategory, subject: "math", domain: "math", skill,
        difficulty: picked.difficulty, passage: picked.passage, stem: picked.stem,
        options: picked.options, answer: picked.answer, gridAnswer: picked.gridAnswer,
        explanation: picked.explanation, questionType: picked.questionType,
      });
    }
  }

  // Shuffle so the diagnostic doesn't march through categories in a predictable block order.
  return pool
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}
