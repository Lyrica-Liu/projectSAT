import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { QuestionSkill } from "@/lib/types";

const SKILL_LABELS: Record<QuestionSkill, string> = {
  central_idea: "Central Idea",
  command_of_evidence: "Command of Evidence",
  inferences: "Inferences",
  words_in_context: "Words in Context",
  cross_text_connections: "Cross-Text Connections",
  text_structure: "Text Structure",
  boundaries: "Boundaries",
  form_structure_sense: "Form, Structure & Sense",
  transitions: "Transitions",
};

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) redirect("/dashboard");
  if (!session.completed_at) redirect(`/practice/${sessionId}`);

  const { data: answers } = await supabase
    .from("answers")
    .select("*, question:questions(*)")
    .eq("session_id", sessionId)
    .order("id");

  const rows = answers ?? [];
  const totalCount = rows.length;
  const correctCount = rows.filter((r) => r.is_correct).length;
  const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  const skillMap: Record<string, { total: number; correct: number }> = {};
  rows.forEach((row) => {
    const skill = row.question?.skill as QuestionSkill | undefined;
    if (!skill) return;
    if (!skillMap[skill]) skillMap[skill] = { total: 0, correct: 0 };
    skillMap[skill].total++;
    if (row.is_correct) skillMap[skill].correct++;
  });

  const scoreColor =
    score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600";

  const scoreBg =
    score >= 80 ? "bg-emerald-50" : score >= 60 ? "bg-amber-50" : "bg-red-50";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-slate-900 tracking-tight">
            PrepWise
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Score hero */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
            Session complete
          </p>
          <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full ${scoreBg} mb-4`}>
            <span className={`text-4xl font-bold ${scoreColor}`}>{score}%</span>
          </div>
          <p className="text-base font-semibold text-slate-900 mb-1">
            {correctCount} of {totalCount} correct
          </p>
          <p className="text-sm text-slate-500 capitalize">
            {session.domain_filter === "both" ? "Reading & Writing" : session.domain_filter}
          </p>

          {session.feedback_text && (
            <div className="mt-6 text-left bg-indigo-50 border border-indigo-100 rounded-xl p-5">
              <p className="text-xs font-semibold text-indigo-500 mb-2 uppercase tracking-wide">
                AI Feedback
              </p>
              <p className="text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">
                {session.feedback_text}
              </p>
            </div>
          )}
        </div>

        {/* Skill breakdown */}
        {Object.keys(skillMap).length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-5">
              Skill breakdown
            </h2>
            <div className="flex flex-col gap-4">
              {Object.entries(skillMap)
                .sort(([, a], [, b]) => a.correct / a.total - b.correct / b.total)
                .map(([skill, { total, correct }]) => {
                  const pct = Math.round((correct / total) * 100);
                  return (
                    <div key={skill}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-700">
                          {SKILL_LABELS[skill as QuestionSkill] ?? skill}
                        </span>
                        <span className="text-xs font-semibold text-slate-900">
                          {correct}/{total} · {pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              pct >= 75 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Answer review */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-5">
            Question review
          </h2>
          <div className="flex flex-col gap-4">
            {rows.map((row, i) => {
              const q = row.question;
              if (!q) return null;
              const isCorrect = row.is_correct;

              return (
                <div
                  key={row.id}
                  className={`rounded-xl border p-5 ${
                    isCorrect
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-600">
                        Q{i + 1}
                      </span>
                      <span className="text-xs text-slate-400 ml-2 capitalize">
                        {q.skill?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                        isCorrect
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 mb-3 leading-relaxed">
                    {q.stem}
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs mb-3">
                    <span className="text-slate-600">
                      Your answer:{" "}
                      <strong className={isCorrect ? "text-emerald-700" : "text-red-700"}>
                        {row.user_answer ?? "Skipped"}
                      </strong>
                    </span>
                    {!isCorrect && (
                      <span className="text-slate-600">
                        Correct:{" "}
                        <strong className="text-emerald-700">{q.answer}</strong>
                      </span>
                    )}
                  </div>
                  <div className="bg-white/80 rounded-lg px-4 py-3 border border-white">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/practice"
            className="flex-1 text-center bg-indigo-600 text-white text-sm font-semibold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Practice again →
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 text-center bg-white text-slate-700 text-sm font-semibold py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
