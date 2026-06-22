import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Session, SkillStat, QuestionSkill } from "@/lib/types";

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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(10);

  const { data: skillRows } = await supabase
    .from("answers")
    .select("is_correct, question:questions(skill)")
    .eq("sessions.user_id", user.id);

  const skillMap: Record<string, { total: number; correct: number }> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (skillRows ?? []).forEach((row: any) => {
    const q = Array.isArray(row.question) ? row.question[0] : row.question;
    const skill: string | undefined = q?.skill;
    if (!skill) return;
    if (!skillMap[skill]) skillMap[skill] = { total: 0, correct: 0 };
    skillMap[skill].total++;
    if (row.is_correct) skillMap[skill].correct++;
  });

  const skillStats: SkillStat[] = Object.entries(skillMap).map(
    ([skill, { total, correct }]) => ({
      skill: skill as QuestionSkill,
      total,
      correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    })
  );

  const recentSessions: Session[] = sessions ?? [];
  const totalSessions = recentSessions.length;
  const avgScore =
    totalSessions > 0
      ? Math.round(
          recentSessions.reduce((acc, s) => acc + (s.score ?? 0), 0) /
            totalSessions
        )
      : null;

  const displayName =
    user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "there";

  const weakestSkill =
    skillStats.length > 0
      ? SKILL_LABELS[
          [...skillStats].sort((a, b) => a.accuracy - b.accuracy)[0].skill
        ]
      : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-slate-900 tracking-tight">
            PrepWise
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="/history"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              History
            </Link>
            <form action="/auth/signout" method="post">
              <button className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Hey, {displayName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ready for a session? Let&apos;s keep the streak going.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 mb-2">Sessions done</p>
            <p className="text-2xl font-bold text-slate-900">{totalSessions}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 mb-2">Avg. score</p>
            <p className="text-2xl font-bold text-slate-900">
              {avgScore !== null ? `${avgScore}%` : "—"}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 mb-2">Skills tracked</p>
            <p className="text-2xl font-bold text-slate-900">{skillStats.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 mb-2">Weakest skill</p>
            <p className="text-base font-bold text-slate-900 leading-tight mt-1">
              {weakestSkill ?? "—"}
            </p>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Start session CTA */}
          <div className="lg:col-span-1">
            <div className="bg-indigo-600 text-white rounded-2xl p-6 flex flex-col gap-4 h-full min-h-50">
              <div>
                <h2 className="text-lg font-bold mb-2">Start a session</h2>
                <p className="text-indigo-200 text-sm leading-relaxed">
                  10 questions. ~8 minutes. Instant AI feedback.
                </p>
              </div>
              <Link
                href="/practice"
                className="mt-auto inline-flex items-center justify-center bg-white text-indigo-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                Practice now →
              </Link>
            </div>
          </div>

          {/* Skill breakdown */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full">
              <h2 className="text-sm font-semibold text-slate-900 mb-5">
                Skill accuracy
              </h2>
              {skillStats.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <p className="text-sm text-slate-400 text-center">
                    Complete a session to see your skill breakdown.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {[...skillStats]
                    .sort((a, b) => a.accuracy - b.accuracy)
                    .map((s) => (
                      <div key={s.skill}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-slate-700">
                            {SKILL_LABELS[s.skill]}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">
                            {s.accuracy}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${s.accuracy}%`,
                              backgroundColor:
                                s.accuracy >= 75
                                  ? "#16a34a"
                                  : s.accuracy >= 50
                                  ? "#d97706"
                                  : "#dc2626",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent sessions */}
        {recentSessions.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Recent sessions
              </h2>
              <Link
                href="/history"
                className="text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentSessions.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 capitalize">
                      {s.domain_filter === "both" ? "Reading & Writing" : s.domain_filter}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {s.completed_at
                        ? new Date(s.completed_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-sm font-bold ${
                        (s.score ?? 0) >= 75
                          ? "text-emerald-600"
                          : (s.score ?? 0) >= 50
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {s.score ?? "—"}%
                    </span>
                    <Link
                      href={`/results/${s.id}`}
                      className="text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      Review →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
