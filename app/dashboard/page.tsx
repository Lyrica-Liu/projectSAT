"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar, LoadingScreen, SIDEBAR_WIDTH } from "@/components/ui/nav";
import { NextUpCard } from "@/components/home/next-up";
import { SkillMapView } from "@/components/home/mind-map";
import { SaveProgressPrompt } from "@/components/home/save-progress";
import { QuickStartCard } from "@/components/home/quick-start";
import type { SkillMapResponse } from "@/components/home/practice";

const microLabel: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500,
  letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)",
};

/** Home: the skill map, one "Next up" suggestion, and an optional test date. */
export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [data, setData] = useState<SkillMapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState(false);
  /** Bumped to refetch (e.g. after the test date changes, which changes the suggestion). */
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/skill-map").then(async (res) => {
      if (cancelled) return;
      if (res.status === 401) { router.replace("/auth"); return; }
      if (!res.ok) { setError("Couldn't load your skill map. Please refresh."); return; }
      const body = await res.json();
      if (!cancelled) setData(body);
    });
    return () => { cancelled = true; };
  }, [reloadKey, router]);

  async function saveTestDate(value: string) {
    setEditingDate(false);
    await supabase.auth.updateUser({ data: { test_date: value || null } });
    setReloadKey((k) => k + 1);
  }

  if (error) {
    return <LoadingScreen message={error} />;
  }
  if (!data) return <LoadingScreen message="Loading your skill map…" />;

  const started = data.mastery.filter((m) => m.level !== "not_started").length;
  const mastered = data.mastery.filter((m) => m.level === "mastered").length;
  const dateLabel = data.testDate
    ? `${new Date(`${data.testDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}${data.daysToTest !== null && data.daysToTest >= 0 ? ` · ${data.daysToTest} ${data.daysToTest === 1 ? "day" : "days"}` : ""}`
    : "Not set";

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)" }}>
      <Sidebar />

      <main className="pw-main-content" style={{ maxWidth: 1240 + SIDEBAR_WIDTH, marginRight: "auto", padding: "32px 48px 96px" }}>
        {/* The map is the page: a title row, the one suggestion, then the map filling the screen. */}
        <section aria-label="Skill map">
          <SkillMapView
            mastery={data.mastery} tiers={data.tiers} history={data.history}
            height="max(520px, calc(100vh - 260px))"
            header={
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
                <div>
                  <h1 style={{ fontWeight: 400, fontSize: 36, lineHeight: 1.05, letterSpacing: "-0.024em", color: "var(--text-strong)", margin: 0 }}>Your skill map</h1>
                  <p style={{ fontSize: 15, color: "var(--text-muted)", margin: "6px 0 0" }}>
                    {started === 0 ? "Tap any skill to start." : `${started} of ${data.mastery.length} skills started${mastered ? ` · ${mastered} mastered` : ""}`}
                    {data.activeSprint && <> · <Link href="/sprints" style={{ color: "var(--accent)" }}>{data.activeSprint.title}, day {Math.min(data.activeSprint.completed + 1, data.activeSprint.total)} of {data.activeSprint.total}</Link></>}
                  </p>
                </div>
                <span style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>
                  {data.isAnonymous && (
                    <Link href="/auth" style={{ fontSize: 13, fontWeight: 600, letterSpacing: "normal", textTransform: "none", color: "var(--text-strong)", padding: "7px 16px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--surface)" }}>
                      Guest · <span style={{ color: "var(--accent)" }}>Sign in</span>
                    </Link>
                  )}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    Test day:
                    {editingDate ? (
                      <input
                        type="date" autoFocus defaultValue={data.testDate ?? ""}
                        onBlur={(e) => saveTestDate(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveTestDate((e.target as HTMLInputElement).value); if (e.key === "Escape") setEditingDate(false); }}
                        style={{ fontFamily: "var(--font-sans)", fontSize: 12, padding: "3px 6px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)" }}
                      />
                    ) : (
                      <button onClick={() => setEditingDate(true)} style={{ border: 0, background: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", letterSpacing: "inherit", textTransform: "inherit", color: "var(--text-strong)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                        {dateLabel}
                      </button>
                    )}
                  </span>
                </span>
              </div>
            }
            banner={data.suggestion && <NextUpCard compact suggestion={data.suggestion} style={{ margin: "0 0 14px" }} />}
          />
        </section>

        {data.isAnonymous && data.recentSessions.length > 0 && <SaveProgressPrompt style={{ margin: "28px 0 0" }} />}

        {/* Offered until it's done — or until half the map is filled in anyway. */}
        {data.quickStart.status !== "done" && started < data.mastery.length / 2 && (
          <QuickStartCard quickStart={data.quickStart} style={{ margin: "16px 0 0" }} />
        )}

        {data.recentSessions.length > 0 && (
          <section aria-label="Recent sets" style={{ margin: "56px 0 0" }}>
            <p style={{ ...microLabel, margin: "0 0 10px", paddingBottom: 10, borderBottom: "1px solid var(--line-strong)" }}>Recent sets</p>
            {data.recentSessions.map((s) => (
              <Link key={s.id} href={`/results/${s.id}`} className="pw-lrow" style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16,
                padding: "14px 4px", borderBottom: "1px solid var(--border)",
              }}>
                <span style={{ fontSize: 15, color: "var(--text-strong)" }}>
                  {new Date(s.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                  {s.score ?? "—"}% · See results →
                </span>
              </Link>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
