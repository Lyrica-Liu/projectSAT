import type { CategoryMastery } from "@/lib/mastery";
import type { Suggestion } from "@/lib/suggestions";
import type { Difficulty } from "@/lib/types";

/** Response of GET /api/skill-map. */
export interface SkillMapResponse {
  mastery: CategoryMastery[];
  tiers: Record<string, Difficulty>;
  testDate: string | null;
  daysToTest: number | null;
  suggestion: Suggestion | null;
  change: { before: CategoryMastery; after: CategoryMastery } | null;
  recentSessions: { id: string; completed_at: string; score: number | null }[];
  isAnonymous: boolean;
  quickStart: { status: "none" | "in_progress" | "done"; sessionId: string | null; questions: number };
}

/** Starts a bank practice set in one category and returns its session id. */
export async function startPracticeSet(subcategory: string, difficulty: Difficulty, count: number): Promise<string> {
  const res = await fetch("/api/start-bank-practice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subcategories: [subcategory], difficulty, count }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.sessionId) throw new Error(body.error ?? "Could not start the set.");
  return body.sessionId as string;
}

export const LEVEL_LABEL: Record<CategoryMastery["level"], string> = {
  not_started: "Not started",
  weak: "Weak",
  strong: "Strong",
  mastered: "Mastered",
};

/** Muted palette: grey → claret (weak) → light moss (strong) → deep moss (mastered). */
export const LEVEL_STYLE: Record<CategoryMastery["level"], { background: string; border: string; ink: string; sub: string }> = {
  not_started: { background: "transparent", border: "1px dashed var(--line-strong)", ink: "var(--text-muted)", sub: "var(--text-faint)" },
  weak: { background: "var(--claret-50)", border: "1px solid var(--claret-100)", ink: "var(--text-strong)", sub: "var(--claret-500)" },
  strong: { background: "var(--moss-100)", border: "1px solid var(--moss-100)", ink: "var(--text-strong)", sub: "var(--moss-600)" },
  mastered: { background: "var(--moss-500)", border: "1px solid var(--moss-500)", ink: "var(--text-on-brand)", sub: "var(--moss-50)" },
};
