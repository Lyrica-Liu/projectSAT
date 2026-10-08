"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar, LoadingScreen, SIDEBAR_WIDTH } from "@/components/ui/nav";
import { NextUpCard } from "@/components/home/next-up";
import { SkillMap } from "@/components/home/skill-map";
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

      <main className="pw-main-content" style={{ maxWidth: 1080 + SIDEBAR_WIDTH, marginRight: "auto", padding: "0 56px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, height: 60, borderBottom: "1px solid var(--border)", fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>
          <span>Home</span>
          <span style={{ display: "flex", alignItems: "center", gap: 20 }}>
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
            <form action="/auth/signout" method="post">
              <button type="submit" style={{
                border: "1px solid var(--border)", background: "none", fontFamily: "var(--font-sans)",
                fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)",
                cursor: "pointer", padding: "6px 12px", borderRadius: "var(--radius-md)",
              }}>
                Sign out
              </button>
            </form>
          </span>
        </div>

        {data.isAnonymous && data.recentSessions.length > 0 && <SaveProgressPrompt style={{ margin: "24px 0 0" }} />}

        <div style={{ padding: "48px 0 0" }}>
          <h1 style={{ fontWeight: 400, fontSize: 44, lineHeight: 1.04, letterSpacing: "-0.026em", color: "var(--text-strong)", margin: 0 }}>Your skill map</h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--text-muted)", margin: "16px 0 0", maxWidth: "56ch" }}>
            {started === 0
              ? "Every SAT skill, one tile each. Tap any tile for a short set — your map fills in as you go."
              : `${started} of ${data.mastery.length} skills started${mastered ? ` · ${mastered} mastered` : ""}. Tap a tile for a short set in that skill.`}
          </p>
        </div>

        {data.activeSprint && (
          <Link href="/sprints" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", margin: "28px 0 0", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>
            <span style={{ color: "var(--text-strong)" }}>{data.activeSprint.title}</span>
            <span aria-hidden style={{ display: "inline-flex", gap: 3 }}>
              {Array.from({ length: data.activeSprint.total }, (_, i) => (
                <span key={i} style={{ width: data.activeSprint!.total > 10 ? 5 : 14, height: 6, borderRadius: 2, background: i < data.activeSprint!.completed ? "var(--moss-500)" : "var(--surface-2)" }} />
              ))}
            </span>
            <span>{data.activeSprint.completed} of {data.activeSprint.total} days · Sprint details →</span>
          </Link>
        )}

        {data.suggestion && <NextUpCard suggestion={data.suggestion} style={{ margin: data.activeSprint ? "14px 0 0" : "32px 0 0" }} />}

        {/* Offered until it's done — or until half the map is filled in anyway. */}
        {data.quickStart.status !== "done" && started < data.mastery.length / 2 && (
          <QuickStartCard quickStart={data.quickStart} style={{ margin: "16px 0 0" }} />
        )}

        <section aria-label="Skill map" style={{ margin: "44px 0 0" }}>
          <SkillMap mastery={data.mastery} tiers={data.tiers} />
        </section>

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
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
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
