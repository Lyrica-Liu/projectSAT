"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ActiveSprint } from "@/lib/server/sprints";
import type { SprintDef } from "@/lib/sprints";
import { ErrorNote, Glow, Skeleton, TabBar, api, goToFullSite, useCached } from "@/components/lite/ui";

type MenuItem = SprintDef & { preview: string[] | null };

const TONES = ["var(--l-coral-soft)", "var(--l-accent-soft)", "var(--l-violet-soft)", "var(--l-gradient-soft)"];

/** Sprints: the active one (day dots + today's day) or the menu. 30-Day Full Prep runs on the full site. */
export default function LiteSprints() {
  const router = useRouter();
  const { data, error: loadError, refresh: load } = useCached<{ menu: MenuItem[]; active: ActiveSprint | null }>("sprints", "/api/sprints");
  const menu = data?.menu ?? null;
  const active = data?.active ?? null;
  const [busy, setBusy] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try { await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  const startDay = () => run(async () => {
    const { sessionId } = await api<{ sessionId: string }>("/api/sprints/next-day", { multipleChoiceOnly: true });
    router.push(`/lite/set/${sessionId}`);
  });
  const startSprint = (key: string) => run(async () => { await api("/api/sprints/start", { key }); load(); });
  const quit = () => run(async () => { await api("/api/sprints/quit", {}); setConfirmQuit(false); load(); });

  if (!menu) {
    return (
      <>
        <main className="l-page">
          <h1 className="l-h1">Sprints</h1>
          {loadError ? <ErrorNote message={loadError} onRetry={load} /> : <><Skeleton height={180} style={{ borderRadius: 28 }} /><Skeleton height={140} style={{ borderRadius: 28 }} /></>}
        </main>
        <TabBar />
      </>
    );
  }

  return (
    <>
      <Glow tone="violet" size={420} style={{ right: -150, top: -120 }} />
      <main className="l-page">
        <div>
          <h1 className="l-h1">Sprints</h1>
          <p className="l-sub" style={{ marginTop: 6 }}>Short, focused plans. One set a day.</p>
        </div>

        {active ? (
          <div className="l-card" style={{ background: "var(--l-violet-soft)" }}>
            <Glow tone="rose" size={260} style={{ right: -90, top: -110 }} />
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <p className="l-eyebrow">Your sprint</p>
                <p className="l-h2" style={{ marginTop: 8 }}>{active.title}</p>
                <p className="l-sub" style={{ marginTop: 6 }}>{active.completedCount} of {active.days.length} days done</p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} aria-label="Sprint days">
                {active.days.map((d) => {
                  const today = d.day === active.nextDay;
                  return (
                    <span key={d.day} title={d.subcategory ?? undefined} style={{
                      width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
                      background: d.completed ? "var(--l-ink)" : today ? "#fff" : "rgba(255,255,255,.6)",
                      color: d.completed ? "#fff" : today ? "var(--l-ink)" : "var(--l-faint)",
                      boxShadow: today ? "inset 0 0 0 2.5px var(--l-accent)" : undefined,
                    }}>{d.completed ? "✓" : d.day}</span>
                  );
                })}
              </div>
              {active.key === "full-30" ? (
                <>
                  <p className="l-sub">30-Day Full Prep days are 20 questions with typed Math answers, so they run on the full site.</p>
                  <button className="l-btn" onClick={() => goToFullSite(active.continueHref)}>Open on full site</button>
                </>
              ) : active.nextDay ? (
                <>
                  <p style={{ margin: 0, fontWeight: 700 }}>Today: Day {active.nextDay} · {active.days[active.nextDay - 1]?.subcategory}</p>
                  <button className="l-btn" onClick={startDay} disabled={busy}>{busy ? "Starting…" : "Start today's set"}</button>
                </>
              ) : null}
              {confirmQuit ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Quit this sprint? Practice you did still counts.</span>
                  <button className="l-btn small" onClick={quit} disabled={busy}>Quit</button>
                  <button className="l-link" onClick={() => setConfirmQuit(false)}>Cancel</button>
                </div>
              ) : (
                <button className="l-link" style={{ alignSelf: "flex-start" }} onClick={() => setConfirmQuit(true)}>Quit sprint</button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {menu.map((s, i) => (
              <div key={s.key} className="l-card" style={{ background: TONES[i % TONES.length], padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--l-muted)", margin: 0 }}>{s.days} days · {s.questionsPerDay} questions a day</p>
                <p className="l-h2" style={{ marginTop: 6, fontSize: 22 }}>{s.title}</p>
                <p className="l-sub" style={{ marginTop: 6 }}>{s.tagline}</p>
                {s.preview && <p style={{ fontSize: 13, color: "var(--l-faint)", margin: "8px 0 0" }}>Starts with {s.preview[0]}</p>}
                {s.key === "full-30" ? (
                  <button className="l-btn small ghost" style={{ marginTop: 14 }} onClick={() => goToFullSite("/sprints")}>On full site</button>
                ) : (
                  <button className="l-btn small" style={{ marginTop: 14 }} onClick={() => startSprint(s.key)} disabled={busy}>Start</button>
                )}
              </div>
            ))}
          </div>
        )}
        <ErrorNote message={error} />
      </main>
      <TabBar />
    </>
  );
}
