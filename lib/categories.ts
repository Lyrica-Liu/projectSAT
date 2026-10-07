import { ENGLISH_CATEGORY_ORDER, MATH_CATEGORY_ORDER } from "@/lib/plan";
import type { MathSkill, QuestionSkill } from "@/lib/types";

/**
 * Every practicable category, grouped the way the SAT groups them: Reading & Writing's four
 * content domains, then Math. The skill map, the practice picker and the suggestion rules all
 * read from here. `subcategory` is the name used everywhere else (bank, plan_days,
 * category_progress).
 */

export type Subject = "Reading & Writing" | "Math";

export interface Category {
  subcategory: string;
  skill: QuestionSkill | MathSkill;
  subject: Subject;
  domain: string;
}

const RW_DOMAINS: Record<string, string[]> = {
  "Information and Ideas": ["Central Ideas and Details", "Command of Evidence (Textual)", "Command of Evidence (Quantitative)", "Inferences"],
  "Craft and Structure": ["Words in Context", "Text Structure and Purpose", "Cross-Text Connections"],
  "Expression of Ideas": ["Transitions", "Rhetorical Synthesis"],
  "Standard English Conventions": ["Boundaries", "Form, Structure, and Sense"],
};

export const CATEGORIES: Category[] = [
  ...Object.entries(RW_DOMAINS).flatMap(([domain, subs]) => subs.map((subcategory) => ({
    subcategory,
    skill: ENGLISH_CATEGORY_ORDER.find((c) => c.subcategory === subcategory)!.skill,
    subject: "Reading & Writing" as const,
    domain,
  }))),
  ...MATH_CATEGORY_ORDER.map((c) => ({ subcategory: c.subcategory, skill: c.skill, subject: "Math" as const, domain: "Math" })),
];

/** Domains in display order, each with its categories. */
export const DOMAINS: { domain: string; subject: Subject; categories: Category[] }[] = [
  ...Object.keys(RW_DOMAINS).map((domain) => ({ domain, subject: "Reading & Writing" as const, categories: CATEGORIES.filter((c) => c.domain === domain) })),
  { domain: "Math", subject: "Math", categories: CATEGORIES.filter((c) => c.subject === "Math") },
];

export function categoryFor(subcategory: string): Category | undefined {
  return CATEGORIES.find((c) => c.subcategory === subcategory);
}

/**
 * The category for a saved question whose `subcategory` column is empty (rows saved before it
 * existed). Every skill maps to one category except Command of Evidence, which the caller
 * resolves separately; returns null for that.
 */
export function subcategoryForSkill(skill: string): string | null {
  const matches = CATEGORIES.filter((c) => c.skill === skill);
  return matches.length === 1 ? matches[0].subcategory : null;
}
