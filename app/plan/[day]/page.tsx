"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LoadingScreen, Wordmark } from "@/components/ui/nav";
import { Button, Card, Badge } from "@/components/ui/ds";
import {
  getPlanDay,
  getCurrentPlanDay,
  englishSlotNumber,
  ENGLISH_SESSION_LENGTH,
  MATH_SESSION_LENGTH,
  DIFFICULTY_LABELS,
  DIFFICULTY_TONES,
  calcStreak,
} from "@/lib/plan";
import type { PlanDayRow, Difficulty } from "@/lib/types";

type PageState = "loading" | "locked" | "done" | "intro" | "starting";

interface WrapStats {
  streak: number;
  projectedPts: number;
  tomorrow: { day: number; subj: string; focus: string } | null;
}

export default function DailySessionPage() {
  const { day } = useParams<{ day: string }>();
  const dayNum = parseInt(day, 10);
  const router = useRouter();
  const supabase = createClient();

  const [state, setState] = useState<PageState>("loading");
  const [completedRow, setCompletedRow] = useState<PlanDayRow | null>(null);
  const [rowInfo, setRowInfo] = useState<{ subcategory: string | null; difficulty: Difficulty | null }>({
    subcategory: null, difficulty: null,
  });
  const [wrapStats, setWrapStats] = useState<WrapStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const planDay = getPlanDay(dayNum);
  const displayFocus = rowInfo.subcategory ?? planDay?.focus ?? "";
  const displayDifficulty = rowInfo.difficulty ?? planDay?.difficulty ?? null;

  useEffect(() => {
    if (!planDay || isNaN(dayNum)) {
      router.replace("/plan");
      return;
    }

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }

      const { data: allRows } = await supabase
        .from("plan_days")
        .select("*")
        .eq("user_id", user.id)
        .order("day_number");

      const rows: PlanDayRow[] = allRows ?? [];
      const completedNums = rows.filter((r) => r.completed_at).map((r) => r.day_number);
      const currentDay = getCurrentPlanDay(completedNums);

      const thisRow = rows.find((r) => r.day_number === dayNum) ?? null;
      setRowInfo({ subcategory: thisRow?.subcategory ?? null, difficulty: thisRow?.difficulty ?? null });

      if (thisRow?.completed_at) {
        setCompletedRow(thisRow);

        const streak = calcStreak(rows);
        const baseline = user.user_metadata?.baseline_score ?? 1050;
        const target = user.user_metadata?.target_score ?? 1450;
        const projectedPts = Math.round((target - baseline) / 30);

        const nextDayNum = dayNum + 1;
        const nextRow = rows.find((r) => r.day_number === nextDayNum);
        const nextPlanDay = nextDayNum <= 30 ? getPlanDay(nextDayNum) : undefined;
        const tomorrow = nextPlanDay
          ? {
              day: nextDayNum,
              subj: nextPlanDay.subject === "math" ? "Math" : "English",
              focus: nextRow?.subcategory ?? nextPlanDay.focus,
            }
          : null;

        setWrapStats({ streak, projectedPts, tomorrow });
        setState("done");
        return;
      }

      if (dayNum > currentDay) {
        setState("locked");
        return;
      }

      // Slots 12-20 aren't assigned a category until slot 11 finishes.
      const slot = englishSlotNumber(dayNum);
      if (slot !== null && slot >= 12 && !thisRow?.subcategory) {
        setState("locked");
        return;
      }

      // Resumeable: session started but not completed
      if (thisRow?.session_id) {
        router.replace(`/practice/${thisRow.session_id}`);
        return;
      }

      setState("intro");
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayNum]);

  async function beginModule() {
    setState("starting");
    setError(null);
    try {
      const res = await fetch("/api/start-plan-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayNumber: dayNum }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start session");
      router.push(`/practice/${data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("intro");
    }
  }

  const eyebrow: React.CSSProperties = {
    fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: 700,
    letterSpacing: "var(--tracking-caps)", textTransform: "uppercase",
    color: "var(--text-faint)", margin: "0 0 8px", display: "block",
  };

  const headerRow = (
    <header style={{
      position: "sticky", top: 0, zIndex: 10,
      background: "var(--surface)", borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Wordmark href="/dashboard" />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/plan" style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--text-muted)", textDecoration: "none" }}>
            ← My plan
          </Link>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-faint)" }}>
            Day {dayNum} · {planDay?.subject === "math" ? "Math" : "English"}
          </span>
        </div>
      </div>
    </header>
  );

  if (state === "loading") return <LoadingScreen />;

  if (state === "locked") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
        {headerRow}
        <main style={{ maxWidth: 520, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "var(--text-xl)", color: "var(--text-strong)", margin: "0 0 10px" }}>
            Day {dayNum} is locked
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "0 0 28px", lineHeight: "var(--leading-relaxed)" }}>
            Complete the previous day before unlocking this one.
          </p>
          <Button onClick={() => router.push("/plan")} variant="secondary">Back to plan</Button>
        </main>
      </div>
    );
  }

  if (state === "done" && planDay) {
    const accuracy = completedRow?.score ?? null;
    const wrapLine = accuracy == null
      ? "Nicely done — that's another day in the books."
      : accuracy >= 67
      ? "Solid, careful work today. Your projection ticked up — come back tomorrow and keep it climbing."
      : "Every day counts, even the hard ones. Tomorrow's module will revisit what tripped you up.";

    return (
      <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
        {headerRow}
        <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 80px" }}>
          <div style={{
            background: "linear-gradient(var(--surface),var(--surface)) padding-box, var(--gradient-radiant) border-box",
            border: "4px solid transparent", borderRadius: "var(--radius-2xl)", boxShadow: "var(--shadow-md)",
            padding: "var(--space-12)", textAlign: "center",
          }}>
            <div style={{
              display: "inline-flex", width: 56, height: 56, borderRadius: "50%", background: "var(--brand)",
              color: "#fff", alignItems: "center", justifyContent: "center", marginBottom: 18,
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <span style={eyebrow}>Day {dayNum} of 30 complete</span>
            <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: "var(--text-2xl)", color: "var(--text-strong)", margin: "0 0 10px", letterSpacing: "var(--tracking-snug)" }}>
              Well earned.
            </h1>
            <p style={{ fontSize: "var(--text-md)", color: "var(--text-muted)", lineHeight: "var(--leading-relaxed)", margin: "0 auto 26px", maxWidth: 420 }}>
              {wrapLine}
            </p>

            <div style={{ display: "flex", gap: 12, maxWidth: 440, margin: "0 auto 26px" }}>
              <div style={{ flex: 1, background: "var(--surface-sunken)", borderRadius: "var(--radius-lg)", padding: "var(--space-4)" }}>
                <p style={{ fontWeight: 800, fontSize: "var(--text-xl)", color: "var(--text-strong)", margin: 0, lineHeight: 1.1 }}>
                  {accuracy != null ? `${accuracy}%` : "—"}
                </p>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: "4px 0 0" }}>today&apos;s accuracy</p>
              </div>
              <div style={{ flex: 1, background: "var(--surface-sunken)", borderRadius: "var(--radius-lg)", padding: "var(--space-4)" }}>
                <p style={{ fontWeight: 800, fontSize: "var(--text-xl)", color: "var(--text-strong)", margin: 0, lineHeight: 1.1 }}>
                  {wrapStats?.streak ?? "—"}
                </p>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: "4px 0 0" }}>day streak</p>
              </div>
              <div style={{ flex: 1, background: "var(--surface-sunken)", borderRadius: "var(--radius-lg)", padding: "var(--space-4)" }}>
                <p style={{ fontWeight: 800, fontSize: "var(--text-xl)", color: "var(--indigo-ink)", margin: 0, lineHeight: 1.1 }}>
                  +{wrapStats?.projectedPts ?? 0}
                </p>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: "4px 0 0" }}>projected pts</p>
              </div>
            </div>

            {wrapStats?.tomorrow && (
              <div style={{
                background: "var(--surface-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
                padding: "var(--space-4) var(--space-5)", maxWidth: 440, margin: "0 auto 28px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              }}>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", textAlign: "left" }}>
                  Tomorrow · <strong style={{ color: "var(--text-strong)" }}>Day {wrapStats.tomorrow.day} · {wrapStats.tomorrow.subj}</strong> — {wrapStats.tomorrow.focus}
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", whiteSpace: "nowrap" }}>Opens tomorrow</span>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {completedRow?.session_id && (
                <Button size="lg" onClick={() => router.push(`/results/${completedRow.session_id}`)}>
                  See full results →
                </Button>
              )}
              <Button size="lg" variant="secondary" onClick={() => router.push("/plan")}>
                Back to my plan
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Intro state
  if (!planDay) return null;

  const isMath = planDay.subject === "math";
  const sessionLength = isMath ? MATH_SESSION_LENGTH : ENGLISH_SESSION_LENGTH;

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
      {headerRow}

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 80px" }}>
        <Card tone="surface" padding="xl" radius="2xl" shadow="lg" style={{ textAlign: "center" }}>
          {/* Day badge */}
          <div style={{
            display: "inline-flex", width: 56, height: 56, borderRadius: "50%",
            background: "var(--gradient-radiant)", color: "#fff",
            alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 22, boxShadow: "var(--shadow-md)", marginBottom: 18,
          }}>
            {dayNum}
          </div>

          <span style={eyebrow}>Day {dayNum} of 30 · {isMath ? "Math" : "English"}</span>

          <h1 style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500,
            fontSize: "var(--text-2xl)", color: "var(--text-strong)",
            margin: "0 0 10px", letterSpacing: "var(--tracking-snug)",
          }}>
            {displayFocus}
          </h1>

          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
            <Badge tone={isMath ? "peach" : "lilac"}>{isMath ? "Math" : "English"}</Badge>
            {displayDifficulty && (
              <Badge tone={DIFFICULTY_TONES[displayDifficulty] as "mint" | "sky" | "peach" | "rose"}>
                {DIFFICULTY_LABELS[displayDifficulty]}
              </Badge>
            )}
          </div>

          <p style={{ fontSize: "var(--text-md)", color: "var(--text-muted)", lineHeight: "var(--leading-relaxed)", margin: "0 auto 28px", maxWidth: 400 }}>
            Work carefully — accuracy first, pace second.
          </p>

          {/* Session breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360, margin: "0 auto 28px", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: "10px 14px" }}>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Questions</span>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-strong)" }}>{sessionLength}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: "10px 14px" }}>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Estimated time</span>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-strong)" }}>~{planDay.durationMins} min</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: "10px 14px" }}>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Counts toward</span>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-strong)" }}>Streak · Day {dayNum}</span>
            </div>
          </div>

          {error && (
            <p style={{ fontSize: "var(--text-sm)", color: "var(--danger)", marginBottom: 14 }}>{error}</p>
          )}

          <Button
            size="lg"
            onClick={beginModule}
            disabled={state === "starting"}
            full
          >
            {state === "starting" ? "Generating questions…" : "Begin the module →"}
          </Button>

          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", margin: "14px 0 0", lineHeight: "var(--leading-relaxed)" }}>
            Questions are generated fresh for each session. Day {dayNum + 1} opens after this is complete.
          </p>
        </Card>
      </main>
    </div>
  );
}
