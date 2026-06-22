"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { QuestionDomain } from "@/lib/types";

const DOMAIN_OPTIONS: { value: QuestionDomain | "both"; label: string; desc: string }[] = [
  { value: "both", label: "Reading & Writing", desc: "Mix of both domains" },
  { value: "reading", label: "Reading", desc: "Passages & comprehension" },
  { value: "writing", label: "Writing", desc: "Grammar & expression" },
];

const COUNT_OPTIONS = [5, 10, 15, 20];

export default function PracticeSetupPage() {
  const router = useRouter();
  const [domain, setDomain] = useState<QuestionDomain | "both">("both");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSession() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        question_count: count,
        domain_filter: domain,
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setError("Could not create session. Please try again.");
      setLoading(false);
      return;
    }

    router.push(`/practice/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-bold text-slate-900 tracking-tight">
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

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Set up your session
          </h1>
          <p className="text-sm text-slate-500 mb-8">
            Pick what you want to practice and how many questions.
          </p>

          {/* Domain */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 block">
              Domain
            </label>
            <div className="flex flex-col gap-2">
              {DOMAIN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDomain(opt.value)}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-all ${
                    domain === opt.value
                      ? "border-indigo-500 bg-indigo-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${domain === opt.value ? "text-indigo-700" : "text-slate-800"}`}>
                      {opt.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${domain === opt.value ? "text-indigo-500" : "text-slate-400"}`}>
                      {opt.desc}
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ml-4 shrink-0 transition-all ${
                    domain === opt.value ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
                  }`}>
                    {domain === opt.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Question count */}
          <div className="mb-8">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 block">
              Number of questions
            </label>
            <div className="flex gap-2">
              {COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    count === n
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              ~{Math.round(count * 0.8)} min estimated
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-4">
              {error}
            </p>
          )}

          <button
            onClick={startSession}
            disabled={loading}
            className="w-full bg-indigo-600 text-white text-sm font-semibold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? "Starting…" : "Start session →"}
          </button>
        </div>
      </main>
    </div>
  );
}
