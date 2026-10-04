import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Corrections to the hand-built question banks, applied when a bank is loaded.
 *
 * lib/questions/bank-overrides.json maps a question's key (a hash of its original passage,
 * stem and choices) to either a replacement version or a removal. It's written by
 * scripts/repair-question-bank.ts after a blind re-check, so the bank text files stay as
 * originally written and every correction is reviewable (and revertible) in one place.
 */

export interface OverrideQuestion {
  passage: string | null;
  stem: string;
  options: { A: string; B: string; C: string; D: string } | null;
  /** A–D for multiple choice; null for grid-in. */
  answer: "A" | "B" | "C" | "D" | null;
  /** Numeric answer for grid-in; null for multiple choice. */
  gridAnswer: string | null;
  explanation: string;
}

export type Override =
  | { action: "replace"; category: string; difficulty: string; reason: string; question: OverrideQuestion }
  | { action: "remove"; category: string; difficulty: string; reason: string };

export function questionKey(q: { passage: string | null; stem: string; options: unknown }): string {
  return createHash("sha1").update(JSON.stringify([q.passage ?? null, q.stem, q.options ?? null])).digest("hex").slice(0, 16);
}

let _overrides: Record<string, Override> | null = null;

export function loadOverrides(): Record<string, Override> {
  if (_overrides) return _overrides;
  const p = join(process.cwd(), "lib/questions/bank-overrides.json");
  _overrides = existsSync(p) ? (JSON.parse(readFileSync(p, "utf-8")) as Record<string, Override>) : {};
  return _overrides;
}

/** Drops removed questions and swaps in replacements, keeping everything else as parsed. */
export function applyOverrides<T extends { passage: string | null; stem: string; options: unknown }>(
  questions: T[],
  replace: (original: T, fixed: OverrideQuestion) => T,
): T[] {
  const overrides = loadOverrides();
  const out: T[] = [];
  for (const q of questions) {
    const o = overrides[questionKey(q)];
    if (!o) out.push(q);
    else if (o.action === "replace") out.push(replace(q, o.question));
  }
  return out;
}
