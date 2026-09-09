import type { createClient } from "@/lib/supabase/server";
import { computeCategoryResults, withConfidence, type CategoryResult } from "@/lib/diagnostic-scoring";

interface DiagnosticUser {
  id: string;
  user_metadata: Record<string, unknown> | null | undefined;
}

interface AnswerRow {
  question_id: string;
  is_correct: boolean | null;
  question: { domain: "reading" | "writing" | "math" } | { domain: "reading" | "writing" | "math" }[] | null;
}

type Outcome = { ok: true; results: CategoryResult[] } | { ok: false; error: string; status: number };

/**
 * Shared by /api/diagnostic-results and /api/generate-plan: loads the user's diagnostic
 * session, regroups its graded answers by category (via the question-id -> category map
 * start-diagnostic stashed in user_metadata, since two English subcategories share a `skill`
 * value and questions has no free-form category column), and scores them.
 */
export async function getDiagnosticCategoryResults(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: DiagnosticUser
): Promise<Outcome> {
  const sessionId = user.user_metadata?.diagnostic_session_id as string | undefined;
  const categories = (user.user_metadata?.diagnostic_categories ?? {}) as Record<string, string>;
  if (!sessionId) {
    return { ok: false, error: "No diagnostic session found.", status: 400 };
  }

  const { data: sessionData } = await supabase
    .from("sessions").select("completed_at").eq("id", sessionId).eq("user_id", user.id).maybeSingle();
  if (!sessionData?.completed_at) {
    return { ok: false, error: "The diagnostic hasn't been finished yet.", status: 400 };
  }

  const { data: answerRows, error: aErr } = await supabase
    .from("answers")
    .select("question_id, is_correct, question:questions(domain)")
    .eq("session_id", sessionId);
  if (aErr || !answerRows) {
    return { ok: false, error: `Could not load diagnostic answers: ${aErr?.message ?? "unknown error"}`, status: 500 };
  }

  const rows = answerRows as unknown as AnswerRow[];
  const graded = rows
    .map((row) => {
      const category = categories[row.question_id];
      const q = Array.isArray(row.question) ? row.question[0] : row.question;
      if (!category || !q || row.is_correct === null) return null;
      const subject: "english" | "math" = q.domain === "math" ? "math" : "english";
      return { category, subject, isCorrect: row.is_correct };
    })
    .filter((r): r is { category: string; subject: "english" | "math"; isCorrect: boolean } => r !== null);

  const raw = computeCategoryResults(graded);
  const mathBaseline = (user.user_metadata?.math_baseline_score as number | null | undefined) ?? null;
  const englishBaseline = (user.user_metadata?.english_baseline_score as number | null | undefined) ?? null;
  return { ok: true, results: withConfidence(raw, mathBaseline, englishBaseline) };
}
