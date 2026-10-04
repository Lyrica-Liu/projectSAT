"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/** Unfinished sets older than this aren't worth surfacing — the student has moved on. */
const MAX_AGE_DAYS = 14;

interface Unfinished {
  id: string;
  startedAt: string;
  total: number;
  answered: number;
}

/**
 * "Continue where you left off" for an unfinished extra-practice set (bank, AI, Math or
 * notebook review). Plan days and the diagnostic aren't included — they resume through
 * /plan and /onboarding. Renders nothing when there's no such set.
 */
export function ResumeCard({ style }: { style?: React.CSSProperties }) {
  const [unfinished, setUnfinished] = useState<Unfinished | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const since = new Date(Date.now() - MAX_AGE_DAYS * 86_400_000).toISOString();
      const [sessionsRes, planRes] = await Promise.all([
        supabase.from("sessions").select("id, started_at, question_count")
          .eq("user_id", user.id).is("completed_at", null).gte("started_at", since)
          .order("started_at", { ascending: false }).limit(10),
        supabase.from("plan_days").select("session_id").eq("user_id", user.id).not("session_id", "is", null),
      ]);
      const excluded = new Set<string>((planRes.data ?? []).map((r) => r.session_id as string));
      const diagnosticId = user.user_metadata?.diagnostic_session_id as string | undefined;
      if (diagnosticId) excluded.add(diagnosticId);

      const latest = (sessionsRes.data ?? []).find((s) => !excluded.has(s.id));
      if (!latest) return;

      const { data: rows } = await supabase.from("answers")
        .select("user_answer, user_grid_answer").eq("session_id", latest.id);
      const answered = (rows ?? []).filter((r) => r.user_answer !== null || r.user_grid_answer !== null).length;
      setUnfinished({ id: latest.id, startedAt: latest.started_at, total: latest.question_count ?? rows?.length ?? 0, answered });
    })();
  }, []);

  if (!unfinished) return null;

  const started = new Date(unfinished.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap",
      padding: "18px 24px", background: "var(--surface)", border: "1px solid var(--border)",
      borderLeft: "2px solid var(--accent)", borderRadius: "0 var(--radius-md) var(--radius-md) 0", ...style,
    }}>
      <div>
        <p style={{ fontSize: 16, color: "var(--text-strong)", margin: "0 0 4px" }}>Continue where you left off</p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          Extra practice from {started} · {unfinished.answered} of {unfinished.total} answered
        </p>
      </div>
      <Link href={`/practice/${unfinished.id}`} style={{
        flexShrink: 0, background: "var(--brand)", color: "var(--text-on-brand)",
        fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "12px 24px", borderRadius: "var(--radius-lg)",
      }}>
        Resume
      </Link>
    </div>
  );
}
