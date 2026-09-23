import type { createClient } from "@/lib/supabase/server";
import { computeSubjectResults, type SubjectResult } from "@/lib/diagnostic-scoring";

interface DiagnosticUser {
  id: string;
  user_metadata: Record<string, unknown> | null | undefined;
}

interface AnswerRow {
  is_correct: boolean | null;
  question: { domain: "reading" | "writing" | "math" } | { domain: "reading" | "writing" | "math" }[] | null;
}

type Outcome = { ok: true; results: SubjectResult[] } | { ok: false; error: string; status: number };

/**
 * Shared by /api/diagnostic-results and /api/generate-plan: loads the user's diagnostic
 * session and scores its graded answers into two subject-level results (English, Math) — no
 * per-category breakdown. Subject comes straight off each question's own `domain` column
 * (reading/writing -> english, math -> math), so unlike the old per-category version, this
 * doesn't need any out-of-band question-id -> category map.
 */
export async function getDiagnosticSubjectResults(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: DiagnosticUser
): Promise<Outcome> {
  const sessionId = user.user_metadata?.diagnostic_session_id as string | undefined;
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
    .select("is_correct, question:questions(domain)")
    .eq("session_id", sessionId);
  if (aErr || !answerRows) {
    return { ok: false, error: `Could not load diagnostic answers: ${aErr?.message ?? "unknown error"}`, status: 500 };
  }

  const rows = answerRows as unknown as AnswerRow[];
  const graded = rows
    .map((row) => {
      const q = Array.isArray(row.question) ? row.question[0] : row.question;
      if (!q || row.is_correct === null) return null;
      const subject: "english" | "math" = q.domain === "math" ? "math" : "english";
      return { subject, isCorrect: row.is_correct };
    })
    .filter((r): r is { subject: "english" | "math"; isCorrect: boolean } => r !== null);

  const mathBaseline = (user.user_metadata?.math_baseline_score as number | null | undefined) ?? null;
  const englishBaseline = (user.user_metadata?.english_baseline_score as number | null | undefined) ?? null;
  return { ok: true, results: computeSubjectResults(graded, mathBaseline, englishBaseline) };
}
