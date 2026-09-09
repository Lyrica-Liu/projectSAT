"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar, LoadingScreen, SIDEBAR_WIDTH, useIntroReveal, useCloseOnOutsideClick } from "@/components/ui/nav";
import { Badge } from "@/components/ui/ds";
import { Icon } from "@/components/ui/icon";
import {
  PLAN,
  calcStreak,
  isGraceDayUsed,
  getCurrentPlanDay,
  englishSlotNumber,
  ENGLISH_CATEGORY_ORDER,
  MATH_CATEGORY_ORDER,
  ENGLISH_DAYS,
  MATH_DAYS,
  DIFFICULTY_LABELS,
  DIFFICULTY_TONES,
} from "@/lib/plan";
import { tierFromDifficulty, type Tier } from "@/lib/diagnostic-scoring";
import type { PlanDayRow, Difficulty } from "@/lib/types";

type Subject = "english" | "math";

interface CategoryProgressRow {
  subcategory: string;
  difficulty: Difficulty;
}

const TIER_TONE: Record<Tier, "mint" | "butter" | "rose"> = { strong: "mint", medium: "butter", weak: "rose" };

function miniChipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "5px 11px", border: `1px solid ${active ? "var(--text-strong)" : "var(--border-strong)"}`,
    background: active ? "var(--surface-sunken)" : "transparent", borderRadius: "var(--radius-sm)",
    fontFamily: "var(--font-sans)", fontSize: 11, color: active ? "var(--text-strong)" : "var(--text-faint)", cursor: "pointer",
  };
}

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
  const [progressRows, setProgressRows] = useState<CategoryProgressRow[]>([]);
  const todayRef = useRef<HTMLDivElement>(null);

  const [adjusting, setAdjusting] = useState(false);
  const [skip, setSkip] = useState<Record<Subject, string[]>>({ english: [], math: [] });
  const [reduce, setReduce] = useState<Record<Subject, string[]>>({ english: [], math: [] });
  const [applying, setApplying] = useState<Subject | null>(null);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const [swappingDay, setSwappingDay] = useState<number | null>(null);
  const [swapSaving, setSwapSaving] = useState<number | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const swapHint = useIntroReveal("800path-planswap-intro-seen");
  useCloseOnOutsideClick(swappingDay !== null, "[data-swap-container]", () => setSwappingDay(null));

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }

      const [{ data: days }, { data: progress }] = await Promise.all([
        supabase.from("plan_days").select("*").eq("user_id", user.id).order("day_number"),
        supabase.from("category_progress").select("subcategory, difficulty").eq("user_id", user.id),
      ]);
      setPlanRows(days ?? []);
      setProgressRows(progress ?? []);
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

  const difficultyByCategory = new Map(progressRows.map((r) => [r.subcategory, r.difficulty]));
  const tierByCategory: Record<string, Tier> = {};
  for (const { subcategory } of [...ENGLISH_CATEGORY_ORDER, ...MATH_CATEGORY_ORDER]) {
    tierByCategory[subcategory] = tierFromDifficulty(difficultyByCategory.get(subcategory) ?? "medium-low");
  }

  // plan_days.difficulty is only a snapshot from whenever that row was last written (plan
  // generation, or start-plan-day when the day actually begins) — it goes stale the moment
  // category_progress adapts afterward (e.g. a good run on that skill elsewhere in the plan)
  // without that day itself being touched again. For a not-yet-started day, showing the live
  // category_progress value instead is what actually matches what starting it right now would
  // give — the whole point of "adaptive," and what start-plan-day itself always reads fresh.
  function liveDifficulty(row: PlanDayRow | undefined): Difficulty | null {
    if (!row?.subcategory) return null;
    return difficultyByCategory.get(row.subcategory) ?? row.difficulty ?? null;
  }

  function isEditable(day: number): boolean {
    const row = planRows.find((r) => r.day_number === day);
    return !!row?.subcategory && !row.completed_at && !row.session_id;
  }
  const editableEnglishDays = ENGLISH_DAYS.filter(isEditable);
  const editableMathDays = MATH_DAYS.filter(isEditable);
  const editableCount: Record<Subject, number> = { english: editableEnglishDays.length, math: editableMathDays.length };

  function toggleOverride(subject: Subject, category: string, kind: "skip" | "reduce") {
    if (kind === "skip") {
      setSkip((prev) => ({ ...prev, [subject]: prev[subject].includes(category) ? prev[subject].filter((c) => c !== category) : [...prev[subject], category] }));
      setReduce((prev) => ({ ...prev, [subject]: prev[subject].filter((c) => c !== category) }));
    } else {
      setReduce((prev) => ({ ...prev, [subject]: prev[subject].includes(category) ? prev[subject].filter((c) => c !== category) : [...prev[subject], category] }));
      setSkip((prev) => ({ ...prev, [subject]: prev[subject].filter((c) => c !== category) }));
    }
  }

  async function applyAdjust(subject: Subject) {
    setApplying(subject);
    setAdjustError(null);
    try {
      const res = await fetch("/api/adjust-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, skip: skip[subject], reduce: reduce[subject] }),
      });
      const json = await res.json();
      if (!res.ok) { setAdjustError(json.error ?? "Could not adjust the plan."); return; }
      const updates = new Map<number, { subcategory: string; difficulty: Difficulty }>(
        (json.days as { day: number; subcategory: string; difficulty: Difficulty }[]).map((d) => [d.day, d])
      );
      setPlanRows((prev) => prev.map((r) => {
        const u = updates.get(r.day_number);
        return u ? { ...r, subcategory: u.subcategory, difficulty: u.difficulty } : r;
      }));
      setSkip((prev) => ({ ...prev, [subject]: [] }));
      setReduce((prev) => ({ ...prev, [subject]: [] }));
    } finally {
      setApplying(null);
    }
  }

  async function swapDay(day: number, subcategory: string) {
    setSwapSaving(day);
    setSwapError(null);
    try {
      const res = await fetch("/api/swap-plan-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, subcategory }),
      });
      const json = await res.json();
      if (!res.ok) { setSwapError(json.error ?? "Could not swap that day."); return; }
      setPlanRows((prev) => prev.map((r) => r.day_number === day ? { ...r, subcategory: json.subcategory, difficulty: json.difficulty } : r));
      setSwappingDay(null);
    } finally {
      setSwapSaving(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)" }}>
      <Sidebar />

      <main className="pw-main-content" style={{ maxWidth: 1080 + SIDEBAR_WIDTH, marginRight: "auto", padding: "0 56px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, height: 60, borderBottom: "1px solid var(--border)", fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>
          <span>Your study plan</span>
          <span style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{doneCt} of 30 complete</span>
            <button
              onClick={() => setAdjusting((v) => !v)}
              style={{ border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "var(--radius-md)", cursor: "pointer" }}
            >
              {adjusting ? "Close" : "Adjust plan"}
            </button>
          </span>
        </div>

        {adjusting && (
          <div style={{ margin: "24px 0 0", padding: 24, border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", background: "var(--surface)" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
              For anything marked strong, you can reduce or skip it for the rest of the plan. This only touches days you haven&apos;t started yet.
            </p>
            {adjustError && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", margin: "0 0 16px" }}>{adjustError}</p>}
            {(["english", "math"] as const).map((subject) => {
              const cats = subject === "english" ? ENGLISH_CATEGORY_ORDER : MATH_CATEGORY_ORDER;
              const count = editableCount[subject];
              return (
                <div key={subject} style={{ marginBottom: 28 }}>
                  <p style={{ ...microLabel, margin: "0 0 4px" }}>{subject === "english" ? "Reading & Writing" : "Math"}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", margin: "0 0 12px" }}>{count} day{count === 1 ? "" : "s"} left to plan</p>
                  <div style={{ borderTop: "1px solid var(--border)" }}>
                    {cats.map((c) => {
                      const tier = tierByCategory[c.subcategory];
                      return (
                        <div key={c.subcategory} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 14, color: "var(--text-body)" }}>{c.subcategory}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                            <Badge tone={TIER_TONE[tier]} size="sm">{tier}</Badge>
                            {tier === "strong" && (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => toggleOverride(subject, c.subcategory, "reduce")} style={miniChipStyle(reduce[subject].includes(c.subcategory))}>
                                  {reduce[subject].includes(c.subcategory) ? "Reducing" : "Reduce"}
                                </button>
                                <button onClick={() => toggleOverride(subject, c.subcategory, "skip")} style={miniChipStyle(skip[subject].includes(c.subcategory))}>
                                  {skip[subject].includes(c.subcategory) ? "Skipping" : "Skip"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => applyAdjust(subject)}
                    disabled={count === 0 || applying === subject || (skip[subject].length === 0 && reduce[subject].length === 0)}
                    style={{
                      marginTop: 14, border: 0, background: "var(--dark-900)", color: "var(--text-on-dark)",
                      fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, padding: "10px 18px", borderRadius: "var(--radius-md)",
                      cursor: count === 0 ? "default" : "pointer", opacity: count === 0 || applying === subject ? 0.5 : 1,
                    }}
                  >
                    {applying === subject ? "Applying…" : `Apply to remaining ${count} day${count === 1 ? "" : "s"}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

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
                    const todayEditable = isEditable(d);
                    return (
                      <div key={d} ref={todayRef} style={{ margin: "18px 0 22px", background: "var(--dark-900)", color: "var(--text-on-dark)", borderRadius: "var(--radius-2xl)", padding: "40px 44px 38px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, margin: "0 0 26px" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-on-dark-faint)" }}>Today · Day {d} of 30 · {subj}</span>
                            {liveDifficulty(row) && (
                              <Badge tone={DIFFICULTY_TONES[liveDifficulty(row)!] as "mint" | "sky" | "peach" | "rose"} size="sm">
                                {DIFFICULTY_LABELS[liveDifficulty(row)!]}
                              </Badge>
                            )}
                          </span>
                          {todayEditable && (
                            <div data-swap-container="" style={{ position: "relative" }}>
                              <button
                                onClick={() => setSwappingDay((v) => (v === d ? null : d))}
                                aria-label={`Change Day ${d}`}
                                style={{ display: "flex", alignItems: "center", gap: 4, border: "1px solid var(--text-on-dark-faint)", background: "none", padding: "4px 8px", borderRadius: "var(--radius-sm)", cursor: "pointer", color: "var(--text-on-dark-faint)", fontFamily: "var(--font-sans)", fontSize: 11 }}
                              >
                                Swap <Icon name="chevron-down" size={11} />
                              </button>
                              {swappingDay === d && (
                                <SwapPanel
                                  error={swapError}
                                  subject={planDay.subject}
                                  current={row?.subcategory ?? null}
                                  saving={swapSaving === d}
                                  onPick={(cat) => swapDay(d, cat)}
                                />
                              )}
                            </div>
                          )}
                        </div>
                        <h2 style={{ fontWeight: 400, fontSize: 36, lineHeight: 1.08, letterSpacing: "-0.024em", color: "var(--text-on-dark)", margin: "0 0 16px", maxWidth: "22ch", textWrap: "pretty" }}>{focus}</h2>
                        <p style={{ fontSize: 16, lineHeight: 1.66, color: "var(--text-on-dark-muted)", margin: "0 0 32px", maxWidth: "46ch" }}>Steady work compounds. Settle in, take the questions one at a time, and let today&apos;s module do its job.</p>
                        <button onClick={() => router.push(`/plan/${d}`)} style={{ border: 0, background: "var(--text-on-dark)", color: "var(--dark-900)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "14px 28px", borderRadius: "var(--radius-lg)", cursor: "pointer" }}>
                          Begin Day {d}
                        </button>
                      </div>
                    );
                  }

                  const dayEditable = isEditable(d);
                  const rowContent = (
                    <div style={{ display: "grid", gridTemplateColumns: "56px 1fr auto", alignItems: "baseline", gap: 20, padding: "17px 4px", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: isLocked ? "var(--ink-300)" : "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>Day {d}</span>
                      <span style={{ fontSize: 16, color: isLocked ? "var(--ink-400)" : "var(--text-strong)" }}>
                        {focus} {!isPendingAssignment && <span style={{ fontSize: 14, color: isLocked ? "var(--ink-300)" : "var(--text-faint)" }}>· {subj}</span>}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-sans)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                        {!isDone && liveDifficulty(row) && (
                          <Badge tone={DIFFICULTY_TONES[liveDifficulty(row)!] as "mint" | "sky" | "peach" | "rose"} size="sm">
                            {DIFFICULTY_LABELS[liveDifficulty(row)!]}
                          </Badge>
                        )}
                        {isDone && row?.score != null ? (
                          <span style={{ color: row.score >= 75 ? "var(--text-strong)" : row.score >= 58 ? "var(--text-muted)" : "var(--accent)", fontSize: 13 }}>{row.score}%</span>
                        ) : isLocked && !dayEditable ? (
                          <span style={{ color: "var(--ink-300)" }}>{d === currentDay + 1 ? "Opens tomorrow" : isPendingAssignment ? "Locked" : `After Day ${d - 1}`}</span>
                        ) : null}
                        {dayEditable && (
                          <div data-swap-container="" style={{ position: "relative" }}>
                            <button
                              onClick={() => setSwappingDay((v) => (v === d ? null : d))}
                              aria-label={`Change Day ${d}`}
                              style={{ display: "flex", alignItems: "center", gap: 4, border: 0, background: "none", padding: 2, cursor: "pointer", color: "var(--text-faint)" }}
                            >
                              {swapHint && (
                                <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "2px 6px" }}>
                                  Swap
                                </span>
                              )}
                              <Icon name="chevron-down" size={11} />
                            </button>
                            {swappingDay === d && (
                              <SwapPanel
                                error={swapError}
                                subject={planDay.subject}
                                current={row?.subcategory ?? null}
                                saving={swapSaving === d}
                                onPick={(cat) => swapDay(d, cat)}
                              />
                            )}
                          </div>
                        )}
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

function SwapPanel({ subject, current, saving, error, onPick }: {
  subject: "english" | "math";
  current: string | null;
  saving: boolean;
  error?: string | null;
  onPick: (category: string) => void;
}) {
  const cats = subject === "english" ? ENGLISH_CATEGORY_ORDER : MATH_CATEGORY_ORDER;
  return (
    <div style={{
      position: "absolute", top: "100%", right: 0, marginTop: 8, zIndex: 5, minWidth: 210,
      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
      padding: 10, boxShadow: "var(--shadow-lg)",
    }}>
      {error && <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--danger)", margin: "0 0 8px" }}>{error}</p>}
      <select
        autoFocus
        disabled={saving}
        defaultValue={current ?? ""}
        onChange={(e) => onPick(e.target.value)}
        style={{
          width: "100%", fontFamily: "var(--font-sans)", fontSize: 13, border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-sm)", padding: "6px 8px", color: "var(--text-strong)", background: "var(--surface)",
        }}
      >
        {cats.map((c) => (
          <option key={c.subcategory} value={c.subcategory}>
            {c.subcategory}{c.subcategory === current ? " (current)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
