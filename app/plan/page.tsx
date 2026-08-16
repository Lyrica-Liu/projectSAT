"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar, LoadingScreen, SIDEBAR_WIDTH } from "@/components/ui/nav";
import {
  PLAN,
  calcStreak,
  isGraceDayUsed,
  getCurrentPlanDay,
  englishSlotNumber,
} from "@/lib/plan";
import type { PlanDayRow } from "@/lib/types";

const WEEKS = [
  { from: 1, to: 7, label: "Week 1 · Laying foundations" },
  { from: 8, to: 14, label: "Week 2 · Building momentum" },
  { from: 15, to: 21, label: "Week 3 · Sharpening skills" },
  { from: 22, to: 28, label: "Week 4 · Approaching mastery" },
  { from: 29, to: 30, label: "Final stretch" },
];

const MILESTONE_DAYS = [10, 20, 30];
const MILESTONE_LABELS: Record<number, string> = { 10: "Foundations", 20: "Momentum", 30: "Summit" };

const microLabel: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500,
  letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-faint)",
};

export default function PlanPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [planRows, setPlanRows] = useState<PlanDayRow[]>([]);
  const todayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }

      const { data } = await supabase.from("plan_days").select("*").eq("user_id", user.id).order("day_number");
      setPlanRows(data ?? []);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading && todayRef.current) {
      requestAnimationFrame(() => todayRef.current?.scrollIntoView({ block: "center" }));
    }
  }, [loading]);

  if (loading) return <LoadingScreen message="Loading your plan…" />;

  const completedRows = planRows.filter((r) => r.completed_at);
  const completedNums = completedRows.map((r) => r.day_number);
  const completedSet = new Set(completedNums);
  const currentDay = getCurrentPlanDay(completedNums);
  const streak = calcStreak(planRows);
  const graceUsed = isGraceDayUsed(planRows);
  const doneCt = completedNums.length;
  const allDone = currentDay > 30;

  const todayPlan = PLAN.find((p) => p.day === currentDay);
  const todayRow = planRows.find((r) => r.day_number === currentDay);
  const todayFocus = todayRow?.subcategory ?? todayPlan?.focus ?? "";

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)" }}>
      <Sidebar />

      <main style={{ maxWidth: 1080 + SIDEBAR_WIDTH, marginLeft: SIDEBAR_WIDTH, marginRight: "auto", padding: "0 56px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, height: 60, borderBottom: "1px solid var(--border)", fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>
          <span>Your study plan</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{doneCt} of 30 complete</span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, flexWrap: "wrap", padding: "52px 0 0" }}>
          <h1 style={{ fontWeight: 400, fontSize: 46, lineHeight: 1.04, letterSpacing: "-0.026em", color: "var(--text-strong)", margin: 0 }}>The Thirty-Day Path</h1>
          <p style={{ fontSize: 15, lineHeight: 1.62, color: "var(--text-muted)", margin: 0, maxWidth: "38ch", textWrap: "pretty" }}>
            Twenty days of English, ten of Math — two English, one Math, repeating. The next day opens only when today&apos;s work is done.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 252px", gap: 64, alignItems: "start", margin: "52px 0 0" }}>

          {/* Ledger */}
          <div>
            {WEEKS.map((week) => (
              <div key={week.label}>
                <p style={{ ...microLabel, margin: "44px 0 14px", paddingBottom: 12, borderBottom: "1px solid var(--line-strong)" }}>{week.label}</p>
                {Array.from({ length: week.to - week.from + 1 }, (_, i) => week.from + i).map((d) => {
                  const planDay = PLAN.find((p) => p.day === d);
                  if (!planDay) return null;
                  const isDone = completedSet.has(d);
                  const isToday = d === currentDay;
                  const row = planRows.find((r) => r.day_number === d);
                  const slot = englishSlotNumber(d);
                  const isPendingAssignment = slot !== null && slot >= 12 && !row?.subcategory;
                  const focus = isPendingAssignment ? "Complete more study days to unlock" : row?.subcategory ?? planDay.focus;
                  const subj = planDay.subject === "english" ? "English" : "Math";
                  const isLocked = (!isDone && !isToday) || isPendingAssignment;

                  if (isToday) {
                    return (
                      <div key={d} ref={todayRef} style={{ margin: "18px 0 22px", background: "var(--dark-900)", color: "var(--text-on-dark)", borderRadius: "var(--radius-2xl)", padding: "40px 44px 38px" }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 24, margin: "0 0 26px" }}>
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-on-dark-faint)" }}>Today · Day {d} of 30 · {subj}</span>
                        </div>
                        <h2 style={{ fontWeight: 400, fontSize: 36, lineHeight: 1.08, letterSpacing: "-0.024em", color: "var(--text-on-dark)", margin: "0 0 16px", maxWidth: "22ch", textWrap: "pretty" }}>{focus}</h2>
                        <p style={{ fontSize: 16, lineHeight: 1.66, color: "var(--text-on-dark-muted)", margin: "0 0 32px", maxWidth: "46ch" }}>Steady work compounds. Settle in, take the questions one at a time, and let today&apos;s module do its job.</p>
                        <button onClick={() => router.push(`/plan/${d}`)} style={{ border: 0, background: "var(--text-on-dark)", color: "var(--dark-900)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "14px 28px", borderRadius: "var(--radius-lg)", cursor: "pointer" }}>
                          Begin Day {d}
                        </button>
                      </div>
                    );
                  }

                  const rowContent = (
                    <div style={{ display: "grid", gridTemplateColumns: "56px 1fr auto", alignItems: "baseline", gap: 20, padding: "17px 4px", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: isLocked ? "var(--ink-300)" : "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>Day {d}</span>
                      <span style={{ fontSize: 16, color: isLocked ? "var(--ink-400)" : "var(--text-strong)" }}>
                        {focus} {!isPendingAssignment && <span style={{ fontSize: 14, color: isLocked ? "var(--ink-300)" : "var(--text-faint)" }}>· {subj}</span>}
                      </span>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                        {isDone && row?.score != null ? (
                          <span style={{ color: row.score >= 75 ? "var(--text-strong)" : row.score >= 58 ? "var(--text-muted)" : "var(--accent)", fontSize: 13 }}>{row.score}%</span>
                        ) : isLocked ? (
                          <span style={{ color: "var(--ink-300)" }}>{d === currentDay + 1 ? "Opens tomorrow" : isPendingAssignment ? "Locked" : `After Day ${d - 1}`}</span>
                        ) : null}
                      </span>
                    </div>
                  );

                  return isLocked ? (
                    <div key={d}>{rowContent}</div>
                  ) : (
                    <Link key={d} href={`/plan/${d}`} style={{ display: "block" }} className="pw-lrow">{rowContent}</Link>
                  );
                })}
                {week.to === 10 && completedSet.has(10) && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "16px 4px", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)" }}>Milestone · Day 10</span>
                    <span style={{ fontSize: 15, color: "var(--text-muted)" }}>Foundations — ten days unbroken</span>
                  </div>
                )}
              </div>
            ))}

            {allDone && (
              <div style={{ marginTop: 44, paddingTop: 40, borderTop: "1px solid var(--border)", textAlign: "center" }}>
                <p style={{ fontSize: 21, color: "var(--text-strong)", margin: "0 0 8px" }}>You finished the Thirty-Day Path.</p>
                <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>Extra practice is still available from the sidebar.</p>
              </div>
            )}
          </div>

          {/* Aside */}
          <aside style={{ position: "sticky", top: 88 }}>
            <div style={{ borderTop: "1px solid var(--line-strong)", padding: "20px 0 0" }}>
              <p style={{ ...microLabel, margin: "0 0 16px" }}>Progress</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 38, fontWeight: 500, color: "var(--text-strong)", margin: 0, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {Math.min(currentDay, 30)}<span style={{ fontSize: 18, color: "var(--text-faint)" }}> / 30</span>
              </p>
              <div style={{ height: 2, background: "var(--surface-2)", margin: "20px 0 0" }}>
                <div style={{ width: `${Math.round((doneCt / 30) * 100)}%`, height: "100%", background: "var(--brand)" }} />
              </div>
              <div style={{ display: "flex", gap: 32, margin: "22px 0 0" }}>
                <span><span style={{ fontFamily: "var(--font-sans)", fontSize: 20, fontWeight: 500, color: "var(--text-strong)", fontVariantNumeric: "tabular-nums" }}>{streak}</span><span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", display: "block", marginTop: 4 }}>day streak</span></span>
                <span><span style={{ fontFamily: "var(--font-sans)", fontSize: 20, fontWeight: 500, color: "var(--text-strong)", fontVariantNumeric: "tabular-nums" }}>{doneCt}</span><span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", display: "block", marginTop: 4 }}>days done</span></span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", margin: "32px 0 0", padding: "20px 0 0" }}>
              <p style={{ ...microLabel, margin: "0 0 6px" }}>Milestones</p>
              {MILESTONE_DAYS.map((d) => {
                const earned = completedSet.has(d);
                return (
                  <div key={d} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 15, color: earned ? "var(--text-strong)" : "var(--ink-400)" }}>{MILESTONE_LABELS[d]}</span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>Day {d}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: "1px solid var(--border)", margin: "32px 0 0", padding: "20px 0 0" }}>
              <p style={{ ...microLabel, margin: "0 0 10px" }}>Grace day</p>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)", margin: 0 }}>
                {graceUsed
                  ? "Used this week — the streak pauses if you miss another day. Back on track next week."
                  : "One missed day per week won't break your streak. Unused this week."}
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
