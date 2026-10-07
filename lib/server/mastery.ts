import type { SupabaseClient } from "@supabase/supabase-js";
import { CATEGORIES, subcategoryForSkill } from "@/lib/categories";
import { computeMastery, masteryFor, type CategoryMastery, type GradedAnswer } from "@/lib/mastery";
import type { RecentSet } from "@/lib/suggestions";
import { getQuestionBank, resolveCommandOfEvidenceSubcategory } from "@/lib/questions/parser";
import { getMathQuestionBank } from "@/lib/questions/mathParser";
import type { Difficulty } from "@/lib/types";

/** What the skill map and "Next up" need about one student. Server-only (reads the banks). */
export interface SkillMapData {
  /** Practicable categories in display order. */
  mastery: CategoryMastery[];
  tiers: Record<string, Difficulty>;
  /** Finished single-category sets, newest first. */
  recentSets: RecentSet[];
  /** With `compareSession`: that set's category before and after it (single-category sets only). */
  change: { before: CategoryMastery; after: CategoryMastery } | null;
  /** True when `compareSession` is the newest finished single-category set. */
  compareIsLatest: boolean;
}

interface AnswerRow {
  is_correct: boolean;
  position: number;
  session_id: string;
  question: { id: string; skill: string; subcategory: string | null; difficulty: Difficulty } | null;
  session: { completed_at: string | null } | null;
}

const one = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? x[0] ?? null : x);

/** Categories with at least one bank question — a tile with nothing behind it would start an empty set. */
export function practicableCategories(): string[] {
  const en = getQuestionBank();
  const math = getMathQuestionBank();
  const count = (tiers: Record<string, unknown[]> | undefined) => Object.values(tiers ?? {}).reduce((n, qs) => n + qs.length, 0);
  return CATEGORIES.map((c) => c.subcategory).filter((s) => count(en[s]) + count(math[s]) > 0);
}

export async function loadSkillMapData(supabase: SupabaseClient, opts: { compareSession?: string } = {}): Promise<SkillMapData> {
  const [answersRes, progressRes] = await Promise.all([
    supabase.from("answers")
      .select("is_correct, position, session_id, question:questions(id, skill, subcategory, difficulty), session:sessions(completed_at)")
      .not("is_correct", "is", null),
    supabase.from("category_progress").select("subcategory, difficulty"),
  ]);

  const rows = ((answersRes.data ?? []) as unknown[]).map((r) => {
    const row = r as AnswerRow & { question: unknown; session: unknown };
    return { ...row, question: one(row.question as AnswerRow["question"] | AnswerRow["question"][]), session: one(row.session as AnswerRow["session"] | AnswerRow["session"][]) };
  });

  // Older rows have no subcategory. Every skill but Command of Evidence maps to one category;
  // those two are told apart by looking the question up in the bank.
  const unresolved = rows.filter((r) => r.question && !r.question.subcategory && !subcategoryForSkill(r.question.skill));
  const resolved = new Map<string, string>();
  if (unresolved.length > 0) {
    const ids = [...new Set(unresolved.map((r) => r.question!.id))];
    for (let i = 0; i < ids.length; i += 200) {
      const { data } = await supabase.from("questions").select("id, passage, stem").in("id", ids.slice(i, i + 200));
      for (const q of data ?? []) {
        const sub = resolveCommandOfEvidenceSubcategory(q.passage, q.stem);
        if (sub) resolved.set(q.id as string, sub);
      }
    }
  }

  const graded: (GradedAnswer & { sessionId: string })[] = [];
  for (const r of rows) {
    if (!r.question || !r.session?.completed_at) continue;
    const sub = r.question.subcategory ?? subcategoryForSkill(r.question.skill) ?? resolved.get(r.question.id);
    if (!sub) continue;
    graded.push({
      subcategory: sub,
      difficulty: r.question.difficulty,
      correct: r.is_correct,
      // Newest last: session finish time, then position within the set.
      order: new Date(r.session.completed_at).getTime() + r.position,
      sessionId: r.session_id,
    });
  }

  const available = practicableCategories();
  const byCategory = computeMastery(available, graded);

  // A "set" for the suggestion rules is a finished session whose questions are all one category.
  const sessions = new Map<string, typeof graded>();
  for (const g of graded) sessions.set(g.sessionId, [...(sessions.get(g.sessionId) ?? []), g]);
  const recentSets: (RecentSet & { at: number; sessionId: string })[] = [];
  for (const list of sessions.values()) {
    const subs = new Set(list.map((g) => g.subcategory));
    if (subs.size !== 1) continue;
    // The tier the set was mostly at.
    const tierCounts = new Map<Difficulty, number>();
    list.forEach((g) => tierCounts.set(g.difficulty, (tierCounts.get(g.difficulty) ?? 0) + 1));
    const difficulty = [...tierCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    recentSets.push({
      subcategory: list[0].subcategory,
      difficulty,
      score: Math.round((list.filter((g) => g.correct).length / list.length) * 100),
      at: Math.max(...list.map((g) => g.order)),
      sessionId: list[0].sessionId,
    });
  }
  recentSets.sort((a, b) => b.at - a.at);

  let change: SkillMapData["change"] = null;
  const compared = opts.compareSession ? recentSets.find((r) => r.sessionId === opts.compareSession) : undefined;
  if (compared) {
    change = {
      before: masteryFor(compared.subcategory, graded.filter((g) => g.sessionId !== compared.sessionId)),
      after: byCategory[compared.subcategory] ?? masteryFor(compared.subcategory, graded),
    };
  }

  return {
    change,
    compareIsLatest: !!compared && recentSets[0]?.sessionId === compared.sessionId,
    mastery: available.map((s) => byCategory[s]),
    tiers: Object.fromEntries((progressRes.data ?? []).map((p) => [p.subcategory as string, p.difficulty as Difficulty])),
    recentSets: recentSets.slice(0, 10).map(({ subcategory, difficulty, score }) => ({ subcategory, difficulty, score })),
  };
}

/** Whole days from today until the student's test date, or null if none is set. */
export function daysUntil(testDate: string | null | undefined, now = new Date()): number | null {
  if (!testDate) return null;
  const t = new Date(`${testDate}T00:00:00`);
  if (isNaN(t.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((t.getTime() - today.getTime()) / 86_400_000);
}
