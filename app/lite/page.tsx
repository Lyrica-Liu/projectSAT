"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PickSheet } from "@/components/lite/pick-sheet";
import { ErrorNote, Glow, GoalRing, Logo, Skeleton, StreakBadge, TabBar, api, goToFullSite, meUrl, useCached, type MeInfo } from "@/components/lite/ui";

type Mode = "adaptive" | "clinic" | "pick";

const MODES: { key: Mode; label: string; blurb: string }[] = [
  { key: "adaptive", label: "Adaptive", blurb: "A mix of your weak spots" },
  { key: "clinic", label: "Clinic", blurb: "Your weakest skill + past mistakes" },
  { key: "pick", label: "Pick", blurb: "Choose what to practice" },
];

const pickLabel = (p: string) => (p === "english" ? "All English" : p === "math" ? "All Math" : p);

/** Practice: one big Start (the last mode used), the mode switcher, the daily goal and today's sprint day. */
export default function LitePractice() {
  const router = useRouter();
  const { data: me } = useCached<MeInfo>("me", meUrl());
  // Until the student touches the switcher, Start follows their last mode.
  const [chosen, setChosen] = useState<{ mode: Mode; pick: string | null } | null>(null);
  const [picking, setPicking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remembered = me && (me.lastMode !== "pick" || me.lastPick) ? { mode: me.lastMode, pick: me.lastPick } : { mode: "adaptive" as Mode, pick: null };
  const { mode, pick } = chosen ?? remembered;
  const sprint = me?.activeSprint ?? null;

  function start(m: Mode = mode, p: string | null = pick) {
    if (m === "pick" && !p) { setPicking(true); return; }
    setStarting(true);
    const q = new URLSearchParams({ mode: m, ...(m === "pick" && p ? { pick: p } : {}) });
    router.push(`/lite/stream/new?${q}`);
  }

  async function continueSprint() {
    if (!sprint) return;
    if (sprint.key === "full-30") { goToFullSite(sprint.continueHref); return; }
    setStarting(true);
    setError(null);
    try {
      const { sessionId } = await api<{ sessionId: string }>("/api/sprints/next-day", { multipleChoiceOnly: true });
      router.push(`/lite/set/${sessionId}`);
    } catch (e) {
      setError((e as Error).message);
      setStarting(false);
    }
  }

  const blurb = mode === "pick" && pick ? pickLabel(pick) : MODES.find((m) => m.key === mode)!.blurb;

  return (
    <>
      <Glow tone="coral" size={400} style={{ left: -150, top: -140 }} />
      <Glow tone="violet" size={380} style={{ right: -170, top: 80 }} />
      <main className="l-page">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 40 }}>
          <Logo />
          {me && <StreakBadge streak={me.streak} />}
        </header>

        <div>
          <h1 className="l-h1" style={{ fontSize: 36 }}>{me?.name ? `Hi, ${me.name.split(" ")[0]}` : "Ready to practice?"}</h1>
          <p className="l-sub" style={{ marginTop: 6 }}>Quick questions, instant answers.</p>
        </div>

        <button onClick={() => start()} disabled={starting} aria-label={`Start: ${blurb}`} style={{
          position: "relative", overflow: "hidden", border: 0, borderRadius: 32, minHeight: 200, padding: "26px 24px",
          background: "var(--l-ink)", color: "#fff", textAlign: "left", display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "0 18px 40px rgba(90,40,120,.22)", transition: "transform .12s", transform: starting ? "scale(.98)" : undefined,
        }}>
          <Glow tone="rose" size={300} style={{ right: -90, top: -120, opacity: 0.95 }} />
          <Glow tone="violet" size={260} style={{ left: -90, bottom: -150 }} />
          <span style={{ position: "relative", width: 56, height: 56, borderRadius: "50%", background: "var(--l-gradient)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="24" viewBox="0 0 22 24" aria-hidden="true"><path d="M3 2.5v19a1 1 0 0 0 1.5.9l15.5-9.5a1 1 0 0 0 0-1.8L4.5 1.6A1 1 0 0 0 3 2.5Z" fill="#fff" /></svg>
          </span>
          <span style={{ position: "relative" }}>
            <span style={{ display: "block", fontSize: 40, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1 }}>{starting ? "Starting…" : "Start"}</span>
            <span style={{ display: "block", fontSize: 16, fontWeight: 500, color: "rgba(255,255,255,.75)", marginTop: 8 }}>{blurb}</span>
          </span>
        </button>

        <div className="l-seg" role="group" aria-label="Practice mode">
          {MODES.map((m) => (
            <button key={m.key} aria-pressed={mode === m.key} onClick={() => {
              if (m.key === "pick") setPicking(true);
              else setChosen({ mode: m.key, pick: null });
            }}>
              {m.label}
            </button>
          ))}
        </div>

        <ErrorNote message={error} />

        {me ? (
          <div className="l-tile" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <GoalRing done={me.today} goal={me.dailyGoal} />
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>{me.today} / {me.dailyGoal} today</p>
              <p className="l-sub">{me.today >= me.dailyGoal ? "Daily goal done. Anything more is a bonus." : `${me.dailyGoal - me.today} to go for your daily goal`}</p>
            </div>
          </div>
        ) : <Skeleton height={96} />}

        {sprint && sprint.nextDay && (
          <div className="l-card" style={{ background: "var(--l-violet-soft)" }}>
            <Glow tone="rose" size={240} style={{ right: -80, top: -110 }} />
            <div style={{ position: "relative" }}>
              <p className="l-eyebrow">Today&apos;s sprint</p>
              <p className="l-h2" style={{ marginTop: 8 }}>{sprint.title}</p>
              <p className="l-sub" style={{ marginTop: 6 }}>
                Day {sprint.nextDay} of {sprint.days.length}{sprint.days[sprint.nextDay - 1]?.subcategory ? ` · ${sprint.days[sprint.nextDay - 1].subcategory}` : ""}
              </p>
              <button className="l-btn small" style={{ marginTop: 16 }} onClick={continueSprint} disabled={starting}>Continue</button>
            </div>
          </div>
        )}

        {me?.isAnonymous && (
          <Link href="/lite/me" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 18, background: "var(--l-accent-soft)", color: "var(--l-ink)", textDecoration: "none" }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Your progress isn&apos;t saved to an account yet.</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--l-accent-ink)", whiteSpace: "nowrap" }}>Save ›</span>
          </Link>
        )}
      </main>
      <TabBar />
      {picking && (
        <PickSheet
          onClose={() => setPicking(false)}
          onPick={(p) => { setChosen({ mode: "pick", pick: p }); setPicking(false); start("pick", p); }}
        />
      )}
    </>
  );
}
