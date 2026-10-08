"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar, LoadingScreen, SIDEBAR_WIDTH } from "@/components/ui/nav";
import type { SprintDef } from "@/lib/sprints";
import type { ActiveSprint, SprintHistoryItem } from "@/lib/server/sprints";

interface SprintsResponse {
  menu: (SprintDef & { preview: string[] | null })[];
  active: ActiveSprint | null;
  history: SprintHistoryItem[];
}

const microLabel: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500,
  letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)",
};

const primaryButton = (disabled = false): React.CSSProperties => ({
  border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)",
  fontSize: 14, fontWeight: 500, padding: "12px 24px", borderRadius: "var(--radius-lg)",
  cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.45 : 1,
});

/** Optional sprints: pick one, see its progress, or quit — no penalty either way. */
export default function SprintsPage() {
  const router = useRouter();
  const [data, setData] = useState<SprintsResponse | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sprints").then(async (res) => {
      if (cancelled) return;
      if (res.status === 401) { router.replace("/auth"); return; }
      const body = await res.json();
      if (!cancelled) setData(body);
    });
    return () => { cancelled = true; };
  }, [reloadKey, router]);

  async function start(key: string) {
    setBusy(key);
    setError(null);
    const res = await fetch("/api/sprints/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { setError(body.error ?? "Couldn't start that sprint."); setBusy(null); return; }
    // Straight into day 1 — 30-Day Full Prep starts through its own plan pages.
    router.push(key === "full-30" ? "/plan/1" : "/sprints/next");
  }

  async function quit() {
    setBusy("quit");
    await fetch("/api/sprints/quit", { method: "POST" });
    setConfirmQuit(false);
    setBusy(null);
    setReloadKey((k) => k + 1);
  }

  if (!data) return <LoadingScreen message="Loading sprints…" />;
  const active = data.active;
  const completed = data.history.filter((h) => h.status === "completed");

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)" }}>
      <Sidebar />

      <main className="pw-main-content" style={{ maxWidth: 1000 + SIDEBAR_WIDTH, marginRight: "auto", padding: "0 56px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, height: 60, borderBottom: "1px solid var(--border)", fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>
          <span>Sprints</span>
          <span>Optional · quit anytime</span>
        </div>

        <div style={{ padding: "48px 0 0" }}>
          <h1 style={{ fontWeight: 400, fontSize: 44, lineHeight: 1.04, letterSpacing: "-0.026em", color: "var(--text-strong)", margin: 0 }}>Short sprints</h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--text-muted)", margin: "16px 0 0", maxWidth: "56ch" }}>
            A few days of short daily sets with a clear finish line. Pick one when you want structure — or skip them and just use your skill map.
          </p>
        </div>

        {error && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", margin: "20px 0 0" }}>{error}</p>}

        {active && (
          <section aria-label="Your sprint" style={{ margin: "36px 0 0", padding: "26px 30px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)" }}>
            <p style={{ ...microLabel, color: "var(--accent)", margin: "0 0 10px" }}>Your sprint</p>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ fontWeight: 400, fontSize: 26, letterSpacing: "-0.014em", color: "var(--text-strong)", margin: "0 0 6px" }}>{active.title}</h2>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                  {active.nextDay ? `Day ${active.nextDay} of ${active.days.length}` : "Every day done"} · {active.completedCount} finished
                </p>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 18 }}>
                <button onClick={() => setConfirmQuit(true)} style={{ border: 0, background: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>Quit sprint</button>
                {active.key === "full-30" && <Link href="/plan" style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", textDecoration: "underline" }}>See the full plan</Link>}
                {active.nextDay && <Link href={active.continueHref} style={{ ...primaryButton(), display: "inline-block" }}>Continue</Link>}
              </span>
            </div>
            <ol aria-label="Days" style={{ listStyle: "none", padding: 0, margin: "22px 0 0", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {active.days.map((d) => (
                <li key={d.day} title={`Day ${d.day}${d.subcategory ? ` · ${d.subcategory}` : ""}${d.completed ? " · done" : ""}`} style={{
                  minWidth: active.days.length > 10 ? 22 : 120, height: active.days.length > 10 ? 22 : "auto",
                  padding: active.days.length > 10 ? 0 : "8px 10px", borderRadius: "var(--radius-sm)",
                  background: d.completed ? "var(--moss-500)" : d.day === active.nextDay ? "var(--accent-soft)" : "transparent",
                  border: d.completed ? "1px solid var(--moss-500)" : d.day === active.nextDay ? "1px solid var(--accent)" : "1px dashed var(--line-strong)",
                  color: d.completed ? "var(--text-on-brand)" : "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: 11,
                }}>
                  {active.days.length <= 10 && (<><span style={{ display: "block", opacity: 0.8 }}>Day {d.day}{d.completed && d.score !== null ? ` · ${d.score}%` : ""}</span><span style={{ display: "block", marginTop: 2 }}>{d.subcategory}</span></>)}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section aria-label="Sprint menu" style={{ margin: "44px 0 0" }}>
          <p style={{ ...microLabel, margin: "0 0 14px", paddingBottom: 10, borderBottom: "1px solid var(--line-strong)" }}>{active ? "Other sprints" : "Pick a sprint"}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {data.menu.filter((s) => s.key !== active?.key).map((s) => {
              const doneBefore = completed.some((h) => h.key === s.key);
              return (
                <div key={s.key} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 18, padding: "22px 22px 20px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", background: "var(--surface)" }}>
                  <div>
                    <h3 style={{ fontWeight: 400, fontSize: 20, color: "var(--text-strong)", margin: "0 0 6px" }}>
                      {s.title}{doneBefore && <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--success)", marginLeft: 8 }}>✓ done before</span>}
                    </h3>
                    <p style={{ fontSize: 15, lineHeight: 1.5, color: "var(--text-muted)", margin: "0 0 10px" }}>{s.tagline}</p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", margin: 0 }}>
                      {s.days} days · {s.questionsPerDay} questions a day
                    </p>
                    {s.preview && (
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.6, color: "var(--text-muted)", margin: "10px 0 0" }}>
                        For you: {[...new Set(s.preview)].join(", ")}
                      </p>
                    )}
                  </div>
                  <button onClick={() => start(s.key)} disabled={!!active || busy !== null} title={active ? "One sprint at a time — finish or quit yours first." : undefined} style={primaryButton(!!active || busy !== null)}>
                    {busy === s.key ? "Starting…" : active ? "One sprint at a time" : "Start sprint"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {data.history.length > 0 && (
          <section aria-label="Finished sprints" style={{ margin: "48px 0 0" }}>
            <p style={{ ...microLabel, margin: "0 0 6px", paddingBottom: 10, borderBottom: "1px solid var(--line-strong)" }}>Past sprints</p>
            {data.history.map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "12px 4px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 15, color: "var(--text-strong)" }}>{h.title}</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: h.status === "completed" ? "var(--success)" : "var(--text-faint)" }}>
                  {h.status === "completed" ? "✓ Completed" : "Stopped"}{h.endedAt ? ` · ${new Date(h.endedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                </span>
              </div>
            ))}
          </section>
        )}
      </main>

      {confirmQuit && active && (
        <div role="dialog" aria-modal="true" aria-labelledby="quit-title" style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--overlay)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-2xl)", padding: "36px 36px 30px", maxWidth: 420 }}>
            <h2 id="quit-title" style={{ fontWeight: 400, fontSize: 26, color: "var(--text-strong)", margin: "0 0 10px" }}>Quit {active.title}?</h2>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)", margin: "0 0 24px" }}>
              No penalty. Everything you practiced still counts on your skill map, and you can start any sprint again later.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <button onClick={() => setConfirmQuit(false)} style={primaryButton()}>Keep going</button>
              <button onClick={quit} disabled={busy === "quit"} style={{ border: 0, background: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-faint)" }}>
                {busy === "quit" ? "Quitting…" : "Quit sprint"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
