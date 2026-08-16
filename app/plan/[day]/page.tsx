"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingScreen, Wordmark } from "@/components/ui/nav";
import {
  getPlanDay,
  getCurrentPlanDay,
  englishSlotNumber,
  ENGLISH_SESSION_LENGTH,
  MATH_SESSION_LENGTH,
  calcStreak,
} from "@/lib/plan";
import type { PlanDayRow, Difficulty } from "@/lib/types";

type PageState = "loading" | "locked" | "done" | "intro" | "starting";

interface WrapStats {
  streak: number;
  tomorrow: { day: number; subj: string; focus: string } | null;
}

const microLabel: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500,
  letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-faint)",
};

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
        const nextDayNum = dayNum + 1;
        const nextRow = rows.find((r) => r.day_number === nextDayNum);
        const nextPlanDay = nextDayNum <= 30 ? getPlanDay(nextDayNum) : undefined;
        const tomorrow = nextPlanDay
          ? { day: nextDayNum, subj: nextPlanDay.subject === "math" ? "Math" : "English", focus: nextRow?.subcategory ?? nextPlanDay.focus }
          : null;

        setWrapStats({ streak, tomorrow });
        setState("done");
        return;
      }

      if (dayNum > currentDay) {
        setState("locked");
        return;
      }

      const slot = englishSlotNumber(dayNum);
      if (slot !== null && slot >= 12 && !thisRow?.subcategory) {
        setState("locked");
        return;
      }

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

  const header = (
    <header style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--canvas)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 44px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, height: 64 }}>
        <Wordmark href="/dashboard" />
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-faint)" }}>
          Day {dayNum} · {planDay?.subject === "math" ? "Math" : "English"}
        </span>
      </div>
    </header>
  );

  if (state === "loading") return <LoadingScreen />;

  if (state === "locked") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)" }}>
        {header}
        <main style={{ maxWidth: 1080, margin: "0 auto", padding: "112px 44px", textAlign: "center" }}>
          <h1 style={{ fontWeight: 400, fontSize: 40, letterSpacing: "-0.024em", color: "var(--text-strong)", margin: "0 0 12px" }}>
            Day {dayNum} is locked
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-muted)", margin: "0 0 28px" }}>Complete the previous day before this one opens.</p>
          <button onClick={() => router.push("/plan")} style={{ border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-strong)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "13px 24px", borderRadius: "var(--radius-lg)", cursor: "pointer" }}>
            Back to plan
          </button>
        </main>
      </div>
    );
  }

  if (state === "done" && planDay) {
    const accuracy = completedRow?.score ?? null;
    const wrapLine = accuracy == null
      ? "Nicely done — that's another day in the books."
      : accuracy >= 67
      ? "Careful work. Your record for today is written — come back tomorrow and keep the line unbroken."
      : "Every day counts, the hard ones most. Tomorrow's module revisits what tripped you up here.";

    return (
      <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)" }}>
        {header}
        <main style={{ maxWidth: 1080, margin: "0 auto", padding: "88px 44px 112px" }}>
          <p style={{ ...microLabel, margin: "0 0 26px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 26, height: 1, background: "var(--line-strong)" }} />
            Day {dayNum} of thirty · complete
          </p>
          <h1 style={{ fontWeight: 400, fontSize: 52, lineHeight: 1.06, letterSpacing: "-0.026em", color: "var(--text-strong)", margin: 0 }}>Well earned.</h1>
          <p style={{ fontSize: 18, lineHeight: 1.66, color: "var(--text-muted)", margin: "24px 0 0", maxWidth: "48ch", textWrap: "pretty" }}>{wrapLine}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", margin: "48px 0 0", borderTop: "1px solid var(--line-strong)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ padding: "24px 32px 24px 0" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 30, fontWeight: 500, color: "var(--text-strong)", margin: 0, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{accuracy != null ? `${accuracy}%` : "—"}</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", margin: "9px 0 0" }}>accuracy today</p>
            </div>
            <div style={{ padding: "24px 32px", borderLeft: "1px solid var(--border)" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 30, fontWeight: 500, color: "var(--text-strong)", margin: 0, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{wrapStats?.streak ?? "—"}</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", margin: "9px 0 0" }}>day streak</p>
            </div>
            <div style={{ padding: "24px 0 24px 32px", borderLeft: "1px solid var(--border)" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 30, fontWeight: 500, color: "var(--text-strong)", margin: 0, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{Math.max(0, 30 - dayNum)}</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", margin: "9px 0 0" }}>days remaining</p>
            </div>
          </div>

          {wrapStats?.tomorrow && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 24, padding: "20px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 16, color: "var(--text-muted)" }}>
                Tomorrow · <span style={{ color: "var(--text-strong)" }}>Day {wrapStats.tomorrow.day}, {wrapStats.tomorrow.subj}</span> — {wrapStats.tomorrow.focus}
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap" }}>Opens tomorrow</span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 26, margin: "40px 0 0" }}>
            {completedRow?.session_id && (
              <button onClick={() => router.push(`/results/${completedRow.session_id}`)} style={{ border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "15px 30px", borderRadius: "var(--radius-lg)", cursor: "pointer" }}>
                See full results
              </button>
            )}
            <button onClick={() => router.push("/plan")} style={{ border: 0, background: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)", cursor: "pointer", padding: 0 }}>
              Back to my plan
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!planDay) return null;

  const isMath = planDay.subject === "math";
  const sessionLength = isMath ? MATH_SESSION_LENGTH : ENGLISH_SESSION_LENGTH;

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)" }}>
      {header}
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "88px 44px 112px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 64, alignItems: "start" }}>
          <div>
            <p style={{ ...microLabel, margin: "0 0 26px", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ width: 26, height: 1, background: "var(--line-strong)" }} />
              Day {dayNum} of thirty · {isMath ? "Math" : "English"}
            </p>
            <h1 style={{ fontWeight: 400, fontSize: 52, lineHeight: 1.06, letterSpacing: "-0.026em", color: "var(--text-strong)", margin: 0, maxWidth: "20ch", textWrap: "pretty" }}>{displayFocus}</h1>
            <p style={{ fontSize: 18, lineHeight: 1.66, color: "var(--text-muted)", margin: "26px 0 0", maxWidth: "48ch", textWrap: "pretty" }}>
              One warm-up question, then the timed module. Accuracy first, pace second — the clock is here to make the pressure familiar, not to rush you.
            </p>
            {error && <p style={{ fontSize: 14, color: "var(--danger)", margin: "20px 0 0" }}>{error}</p>}
            <div style={{ display: "flex", alignItems: "center", gap: 24, margin: "40px 0 0" }}>
              <button onClick={beginModule} disabled={state === "starting"} style={{
                border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)",
                fontSize: 14, fontWeight: 500, padding: "15px 30px", borderRadius: "var(--radius-lg)",
                cursor: state === "starting" ? "default" : "pointer", opacity: state === "starting" ? 0.7 : 1,
              }}>
                {state === "starting" ? "Generating questions…" : "Begin the module"}
              </button>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>The timer starts when you begin.</span>
            </div>
          </div>
          <div style={{ borderLeft: "1px solid var(--border)", padding: "4px 0 4px 24px" }}>
            <p style={{ ...microLabel, margin: "0 0 18px" }}>Today&apos;s sitting</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 0 12px", borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
              <span style={{ fontSize: 15, color: "var(--text-muted)" }}>Module</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-strong)", fontVariantNumeric: "tabular-nums" }}>{sessionLength} questions · {planDay.durationMins} min</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 15, color: "var(--text-muted)" }}>Counts toward</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-strong)" }}>Streak</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
