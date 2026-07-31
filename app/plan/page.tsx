"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppNav, LoadingScreen } from "@/components/ui/nav";
import { Card, Badge, ProgressBar } from "@/components/ui/ds";
import {
  PLAN_PHASES,
  DIFFICULTY_LABELS,
  DIFFICULTY_TONES,
  calcStreak,
  isGraceDayUsed,
  getCurrentPlanDay,
  englishSlotNumber,
} from "@/lib/plan";
import type { PlanDayRow } from "@/lib/types";

const MILESTONE_DAYS = [10, 20, 30];
const MILESTONE_LABELS: Record<number, string> = { 10: "Foundations", 20: "Momentum", 30: "Summit" };

export default function PlanPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [planRows, setPlanRows] = useState<PlanDayRow[]>([]);
  const [baselineScore, setBaselineScore] = useState<number | null>(null);
  const [targetScore, setTargetScore] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }

      const { data } = await supabase
        .from("plan_days")
        .select("*")
        .eq("user_id", user.id)
        .order("day_number");

      setPlanRows(data ?? []);
      setBaselineScore(user.user_metadata?.baseline_score ?? null);
      setTargetScore(user.user_metadata?.target_score ?? null);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading && todayRef.current) {
      requestAnimationFrame(() => {
        todayRef.current?.scrollIntoView({ block: "center" });
      });
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
  const pct = Math.round((doneCt / 30) * 100);

  // Score projection: linear from your starting score to your target across
  // the 30 days, using real onboarding/account numbers (not a guess).
  const projBaseline = baselineScore ?? 1050;
  const projTarget = targetScore ?? 1450;
  const projScoreAt = (d: number) => projBaseline + ((projTarget - projBaseline) * d) / 30;
  const currentProjection = Math.round(projScoreAt(doneCt) / 10) * 10;

  const projW = 240, projH = 78, projPadL = 6, projPadR = 6;
  const projYMin = Math.min(projBaseline, projTarget) - 20;
  const projYMax = Math.max(projBaseline, projTarget) + 20;
  const projX = (d: number) => projPadL + (d / 30) * (projW - projPadL - projPadR);
  const projY = (score: number) => projH - 10 - ((score - projYMin) / (projYMax - projYMin)) * (projH - 20);
  const pastPts: string[] = [];
  for (let d = 0; d <= doneCt; d++) pastPts.push(`${projX(d).toFixed(1)},${projY(projScoreAt(d)).toFixed(1)}`);
  const futurePts: string[] = [];
  for (let d = doneCt; d <= 30; d++) futurePts.push(`${projX(d).toFixed(1)},${projY(projScoreAt(d)).toFixed(1)}`);
  const [lastPastX, lastPastY] = (pastPts[pastPts.length - 1] ?? `${projX(0)},${projY(projBaseline)}`).split(",");

  const avgScore =
    completedRows.length > 0
      ? Math.round(completedRows.reduce((s, r) => s + (r.score ?? 0), 0) / completedRows.length)
      : null;

  const eyebrow: React.CSSProperties = {
    fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: 700,
    letterSpacing: "var(--tracking-caps)", textTransform: "uppercase",
    color: "var(--text-faint)", margin: "0 0 10px", display: "block",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
      <AppNav />

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 34 }}>
          <span style={eyebrow}>Your study plan</span>
          <h1 style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500,
            fontSize: "var(--text-2xl)", color: "var(--text-strong)",
            margin: "0 0 8px", letterSpacing: "var(--tracking-snug)",
          }}>
            The 30-Day Path
          </h1>
          <p style={{
            fontSize: "var(--text-md)", color: "var(--text-muted)",
            margin: 0, maxWidth: 560, lineHeight: "var(--leading-relaxed)",
          }}>
            Twenty days of English, ten of Math — two English, one Math, repeating.
            One day at a time; the next opens when today is done.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 32, alignItems: "start" }}>

          {/* ── Sidebar ── */}
          <aside style={{ position: "sticky", top: 86, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Progress */}
            <Card tone="surface" padding="md" radius="xl" shadow="sm">
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={eyebrow}>Progress</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-strong)" }}>
                  Day {Math.min(currentDay, 30)} <span style={{ color: "var(--text-faint)", fontWeight: 500 }}>/ 30</span>
                </span>
              </div>
              <ProgressBar value={pct} />
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <div style={{ flex: 1, background: "var(--surface-sunken)", borderRadius: "var(--radius-lg)", padding: 12, textAlign: "center" }}>
                  <p style={{ fontWeight: 800, fontSize: "var(--text-xl)", color: "var(--text-strong)", margin: 0, lineHeight: 1.1 }}>
                    {streak > 0 ? streak : "—"}
                  </p>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: "4px 0 0" }}>day streak 🔥</p>
                </div>
                <div style={{ flex: 1, background: "var(--surface-sunken)", borderRadius: "var(--radius-lg)", padding: 12, textAlign: "center" }}>
                  <p style={{ fontWeight: 800, fontSize: "var(--text-xl)", color: "var(--text-strong)", margin: 0, lineHeight: 1.1 }}>{doneCt}</p>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: "4px 0 0" }}>days done ⭐</p>
                </div>
              </div>
            </Card>

            {/* Avg score */}
            {avgScore !== null && (
              <Card tone="surface" padding="md" radius="xl" shadow="sm">
                <span style={eyebrow}>Avg. accuracy</span>
                <p style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "var(--text-2xl)", color: "var(--brand)", margin: 0 }}>
                  {avgScore}%
                </p>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: "var(--leading-relaxed)" }}>
                  Across {doneCt} completed {doneCt === 1 ? "session" : "sessions"}.
                </p>
              </Card>
            )}

            {/* Score projection */}
            <Card tone="surface" padding="md" radius="xl" shadow="sm">
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={eyebrow}>Score projection</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--indigo-ink)" }}>
                  {currentProjection}
                </span>
              </div>
              <svg viewBox={`0 0 ${projW} ${projH}`} style={{ display: "block", width: "100%", height: "auto" }}>
                <polyline points={futurePts.join(" ")} fill="none" stroke="var(--line-strong)" strokeWidth={2} strokeDasharray="3 4" strokeLinecap="round" />
                <polyline points={pastPts.join(" ")} fill="none" stroke="var(--indigo-ink)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={lastPastX} cy={lastPastY} r={4} fill="var(--indigo-ink)" />
              </svg>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: "8px 0 0", lineHeight: "var(--leading-normal)" }}>
                Updates after every completed day. Target: <strong style={{ color: "var(--text-strong)" }}>{projTarget}</strong> by Day 30.
              </p>
            </Card>

            {/* Grace day */}
            <Card tone="lilac" padding="md" radius="xl" shadow="none">
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--brand-ink)", margin: "0 0 4px" }}>Grace day</p>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--brand-ink)", margin: 0, lineHeight: "var(--leading-normal)" }}>
                {graceUsed
                  ? "Used this week — the streak pauses if you miss another day. Back on track next week."
                  : "One missed day per week won't break your streak. Unused this week — nicely done."}
              </p>
            </Card>

            {/* Milestones */}
            <Card tone="surface" padding="md" radius="xl" shadow="sm">
              <span style={eyebrow}>Milestones</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {MILESTONE_DAYS.map((d) => {
                  const earned = completedSet.has(d);
                  const locked = !earned;
                  return (
                    <div key={d} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                        background: earned ? "var(--dark-900)" : "var(--surface-sunken)",
                        border: locked ? "1px dashed var(--line-strong)" : "none",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, color: earned ? "var(--pop-pink)" : "var(--ink-300)",
                      }}>★</div>
                      <div>
                        <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: earned ? "var(--text-strong)" : "var(--text-faint)", margin: 0 }}>
                          {MILESTONE_LABELS[d]}
                        </p>
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", margin: "2px 0 0" }}>
                          Complete Day {d}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </aside>

          {/* ── Journey path ── */}
          <div
            ref={scrollContainerRef}
            style={{
              height: "calc(100vh - 180px)",
              overflowY: "auto",
              paddingRight: 6,
              display: "flex",
              flexDirection: "column",
              gap: 32,
            }}
          >
            {PLAN_PHASES.map((phase, pi) => (
              <div key={pi}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <Badge tone={pi === 0 ? "mint" : pi === 1 ? "sky" : "rose"}>{phase.label}</Badge>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {phase.days.map((planDay) => {
                    const isDone = completedSet.has(planDay.day);
                    const isToday = planDay.day === currentDay;
                    const isFuture = !isDone && !isToday;
                    const row = planRows.find((r) => r.day_number === planDay.day);

                    const slot = englishSlotNumber(planDay.day);
                    const isPendingAssignment = slot !== null && slot >= 12 && !row?.subcategory;
                    const displayFocus = isPendingAssignment
                      ? "Complete more study days to unlock"
                      : row?.subcategory ?? planDay.focus;
                    const displayDifficulty = isPendingAssignment
                      ? null
                      : (row?.difficulty as typeof planDay.difficulty) ?? planDay.difficulty;

                    const borderColor = isToday
                      ? "var(--brand)"
                      : isDone
                      ? "var(--lilac-100)"
                      : "var(--border)";

                    const isLocked = isFuture || isPendingAssignment;

                    return (
                      <Link
                        key={planDay.day}
                        ref={isToday ? todayRef : undefined}
                        href={isLocked ? "#" : `/plan/${planDay.day}`}
                        style={{
                          display: "flex", alignItems: "center", gap: 16,
                          padding: "14px 18px",
                          background: isToday ? "var(--lilac-50)" : "var(--surface)",
                          border: `1.5px solid ${borderColor}`,
                          borderRadius: "var(--radius-lg)",
                          textDecoration: "none",
                          opacity: isLocked ? 0.55 : 1,
                          cursor: isLocked ? "default" : "pointer",
                          boxShadow: isToday ? "var(--shadow-md)" : "var(--shadow-xs)",
                          transition: "box-shadow var(--dur-base)",
                        }}
                      >
                        {/* Day circle */}
                        <div style={{
                          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                          background: isDone
                            ? "var(--brand)"
                            : isToday
                            ? "var(--gradient-radiant)"
                            : "var(--surface-sunken)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: isDone || isToday ? "#fff" : "var(--text-faint)",
                          fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13,
                          boxShadow: isDone || isToday ? "var(--shadow-sm)" : "none",
                        }}>
                          {isDone
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                            : planDay.day}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <span style={{
                              fontFamily: "var(--font-sans)", fontWeight: 600,
                              fontSize: "var(--text-sm)", color: isPendingAssignment ? "var(--text-faint)" : "var(--text-strong)",
                              fontStyle: isPendingAssignment ? "italic" : "normal",
                            }}>{displayFocus}</span>
                            {isToday && (
                              <Badge tone="lilac">Today</Badge>
                            )}
                          </div>
                          {!isPendingAssignment && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Badge tone={planDay.subject === "english" ? "lilac" : "peach"}>
                                {planDay.subject === "english" ? "English" : "Math"}
                              </Badge>
                              {displayDifficulty && (
                                <Badge tone={DIFFICULTY_TONES[displayDifficulty] as "mint" | "sky" | "peach" | "rose"}>
                                  {DIFFICULTY_LABELS[displayDifficulty]}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Score / lock */}
                        <div style={{ flexShrink: 0, textAlign: "right" }}>
                          {isDone && row?.score != null ? (
                            <span style={{
                              fontFamily: "var(--font-mono)", fontWeight: 700,
                              fontSize: "var(--text-sm)", color: "var(--brand)",
                            }}>{row.score}%</span>
                          ) : isLocked ? (
                            <span style={{ fontSize: 16, color: "var(--ink-300)" }}>🔒</span>
                          ) : (
                            <span style={{ fontSize: "var(--text-xs)", color: "var(--brand)", fontWeight: 600 }}>Start →</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {currentDay > 30 && (
              <Card tone="lilac" padding="lg" radius="xl" shadow="sm" style={{ textAlign: "center" }}>
                <p style={{ fontSize: 32, margin: "0 0 10px" }}>🎉</p>
                <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: "var(--text-xl)", color: "var(--brand-ink)", margin: "0 0 8px" }}>
                  You finished the 30-Day Path.
                </p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: 0 }}>
                  Extra practice is still available from the nav.
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
