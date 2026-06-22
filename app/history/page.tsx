import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Session } from "@/lib/types";

export default async function HistoryPage() {
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
    .order("completed_at", { ascending: false });

  const allSessions: Session[] = sessions ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-slate-900 tracking-tight">
            PrepWise
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Session history</h1>

        {allSessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <p className="text-sm text-slate-500 mb-5">
              No completed sessions yet.
            </p>
            <Link
              href="/practice"
              className="inline-block text-sm font-semibold bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Start your first session →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {allSessions.map((s, idx) => {
              const scoreColor =
                (s.score ?? 0) >= 80
                  ? "text-emerald-600"
                  : (s.score ?? 0) >= 60
                  ? "text-amber-600"
                  : "text-red-600";

              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between px-6 py-4 ${
                    idx !== allSessions.length - 1 ? "border-b border-slate-100" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 capitalize">
                      {s.domain_filter === "both"
                        ? "Reading & Writing"
                        : s.domain_filter}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {s.completed_at
                        ? new Date(s.completed_at).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                      {" · "}
                      {s.question_count} questions
                    </p>
                  </div>
                  <div className="flex items-center gap-5">
                    <span className={`text-base font-bold ${scoreColor}`}>
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
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
