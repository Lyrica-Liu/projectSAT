import { getBankQuestions } from "./parser";
import { getMathBankQuestions } from "./mathParser";
import { ENGLISH_CATEGORY_ORDER, MATH_CATEGORY_ORDER } from "@/lib/plan";
import type { Difficulty } from "@/lib/types";

/**
 * A trimmed slice of ENGLISH_CATEGORY_ORDER (7 of 11) — one subcategory kept from each of the
 * SAT's 4 real domains (Information & Ideas, Craft & Structure, Expression of Ideas, Standard
 * English Conventions) so the English average still draws from every domain, just not every
 * subcategory. The diagnostic no longer scores per-category (see diagnostic-scoring.ts), so
 * breadth here is about a representative sample for one English average, not per-subcategory
 * coverage.
 */
const DIAGNOSTIC_ENGLISH_SUBCATEGORIES = new Set([
  "Central Ideas and Details", "Command of Evidence (Textual)", "Inferences", // Information & Ideas
  "Words in Context", "Text Structure and Purpose",                          // Craft & Structure
  "Transitions",                                                             // Expression of Ideas
  "Boundaries",                                                              // Standard English Conventions
]);

/**
 * Two questions per English subcategory, alternating between two tier-pairs by position so the
 * ~14-question English pool still spans all 4 difficulty levels overall (easy/hard from the
 * even-indexed subcategories, medium-low/medium-high from the odd-indexed ones) rather than
 * every subcategory sampling the identical two tiers.
 */
const ENGLISH_TIER_PAIRS: Difficulty[][] = [["easy", "hard"], ["medium-low", "medium-high"]];

/** Three questions per math category — all 3 categories are kept (there are only 3 to begin
 *  with), spread across the same 3-tier shape the trimmed English side uses. */
const MATH_TIERS: Difficulty[] = ["easy", "medium-high", "hard"];

export interface DiagnosticPoolItem {
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
 * Builds the ~23-question diagnostic pool: 7 English subcategories at 2 questions each (14) and
 * all 3 math categories at 3 questions each (9). Scoring is subject-level only now (see
 * diagnostic-scoring.ts) — there's no per-category tracking at all, so a question only needs to
 * know which subject it belongs to, not which subcategory. Every bank cell has 30-40 questions,
 * so — unlike the modulo-wrap pooling used by start-bank-practice/start-math-practice — this
 * guarantees the exact requested count with no repeats, tracked via a keys-seen set across the
 * whole build.
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

  const englishSubcategories = ENGLISH_CATEGORY_ORDER.filter((c) => DIAGNOSTIC_ENGLISH_SUBCATEGORIES.has(c.subcategory));
  englishSubcategories.forEach(({ subcategory, skill }, i) => {
    const tiers = ENGLISH_TIER_PAIRS[i % 2];
    for (const tier of tiers) {
      const picked = pickOne(getBankQuestions(subcategory, tier));
      if (!picked) continue; // bank cell exhausted (shouldn't happen at these sizes, but don't crash the diagnostic over it)
      pool.push({
        subject: "english", domain: picked.domain, skill,
        difficulty: picked.difficulty, passage: picked.passage, stem: picked.stem,
        options: picked.options, answer: picked.answer, gridAnswer: null,
        explanation: picked.explanation, questionType: "multiple_choice",
      });
    }
  });

  for (const { subcategory, skill } of MATH_CATEGORY_ORDER) {
    for (const tier of MATH_TIERS) {
      const picked = pickOne(getMathBankQuestions(subcategory, tier));
      if (!picked) continue;
      pool.push({
        subject: "math", domain: "math", skill,
        difficulty: picked.difficulty, passage: picked.passage, stem: picked.stem,
        options: picked.options, answer: picked.answer, gridAnswer: picked.gridAnswer,
        explanation: picked.explanation, questionType: picked.questionType,
      });
    }
  }

  // Shuffle so the diagnostic doesn't march through subjects in a predictable block order.
  return pool
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}
