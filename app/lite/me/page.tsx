"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saveGuestWithEmail, LITE_RETURN_COOKIE } from "@/lib/auth";
import { DOMAINS } from "@/lib/categories";
import type { CategoryMastery } from "@/lib/mastery";
import { LEVEL_COLOR, LevelDot } from "@/components/lite/pick-sheet";
import { ErrorNote, Glow, GoalRing, Loading, Skeleton, TabBar, api, goToFullSite, meUrl, useCached, writeCache, type MeInfo } from "@/components/lite/ui";

const GOALS = [5, 10, 20, 30];

interface NotebookRow { question_id: string; question: { stem: string; subcategory: string | null } | { stem: string; subcategory: string | null }[] | null }

/** Me: streak and daily goal, skill levels, the mistake notebook, and the account. */
export default function LiteMe() {
  const router = useRouter();
  const supabase = createClient();
  const { data: me, error: meError, setData: setMe } = useCached<MeInfo>("me", meUrl());
  const { data: skills } = useCached<{ mastery: CategoryMastery[] }>("skills", "/api/lite/skills");
  const mastery = skills?.mastery ?? null;
  const [notebook, setNotebook] = useState<{ id: string; stem: string; subcategory: string | null }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save progress (guests)
  const [formEmail, setFormEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("notebook_entries").select("question_id, question:questions(stem, subcategory)")
      .order("added_at", { ascending: false }).limit(50)
      .then(({ data }) => setNotebook(((data ?? []) as unknown as NotebookRow[]).flatMap((r) => {
        const q = Array.isArray(r.question) ? r.question[0] : r.question;
        return q ? [{ id: r.question_id, stem: q.stem, subcategory: q.subcategory }] : [];
      })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setGoal(goal: number) {
    if (!me) return;
    const updated = { ...me, dailyGoal: goal };
    setMe(updated);
    writeCache("me", updated);
    const { error: err } = await supabase.auth.updateUser({ data: { lite_daily_goal: goal } });
    if (err) setError("Couldn't save your goal.");
  }

  async function practiceMistakes() {
    setBusy(true);
    setError(null);
    try {
      const { sessionId } = await api<{ sessionId: string }>("/api/notebook/practice", {});
      router.push(`/lite/set/${sessionId}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function saveWithGoogle() {
    setBusy(true);
    setSaveMsg(null);
    document.cookie = `${LITE_RETURN_COOKIE}=/lite/me; path=/; max-age=600; samesite=lax`;
    const { error: err } = await supabase.auth.linkIdentity({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (err) { setBusy(false); setSaveMsg(err.message); }
  }

  async function saveWithEmail() {
    if (!formEmail.trim() || !password) { setSaveMsg("Enter an email and password."); return; }
    setBusy(true);
    setSaveMsg(null);
    const result = await saveGuestWithEmail(supabase, formEmail.trim(), password);
    setBusy(false);
    if (result.kind === "signed_in") { window.location.reload(); return; }
    setSaveMsg(result.kind === "error" ? result.message : `Check ${formEmail} for a confirmation link. Everything you've done is kept.`);
  }

  if (!me) return meError ? <main className="l-page"><ErrorNote message={meError} /></main> : <Loading />;
  const levels = new Map((mastery ?? []).map((m) => [m.subcategory, m]));
  const email = me.email;
  const displayName = me.isAnonymous ? "Guest" : me.name ?? email?.split("@")[0] ?? "You";

  return (
    <>
      <Glow tone="violet" size={420} style={{ left: -15, top: -100 }} />
      <main className="l-page">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: 12 }}>
          <span style={{ width: 88, height: 88, borderRadius: "50%", padding: 3, background: "conic-gradient(var(--l-coral), var(--l-accent), var(--l-violet), var(--l-coral))", display: "flex" }}>
            <span style={{ flex: 1, borderRadius: "50%", background: "var(--l-accent-soft)", border: "3px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800 }}>
              {displayName.charAt(0).toUpperCase()}
            </span>
          </span>
          <h1 className="l-h1" style={{ fontSize: 28, marginTop: 12 }}>{displayName}</h1>
          {!me.isAnonymous && email && <p className="l-sub" style={{ marginTop: 4 }}>{email}</p>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div className="l-tile" style={{ textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>{me.streak}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--l-muted)", margin: "2px 0 0" }}>Day streak</p>
          </div>
          <div className="l-tile" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <GoalRing done={me.today} goal={me.dailyGoal} size={48} />
            <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{me.today}/{me.dailyGoal}<br /><span style={{ fontSize: 13, fontWeight: 600, color: "var(--l-muted)" }}>today</span></p>
          </div>
        </div>

        <section>
          <p className="l-eyebrow" style={{ marginBottom: 10 }}>Daily goal (questions)</p>
          <div className="l-seg" role="group" aria-label="Daily goal">
            {GOALS.map((g) => <button key={g} aria-pressed={me.dailyGoal === g} onClick={() => setGoal(g)}>{g}</button>)}
          </div>
        </section>

        {me.isAnonymous && (
          <section className="l-card" style={{ background: "var(--l-accent-soft)", display: "flex", flexDirection: "column", gap: 12 }}>
            <Glow tone="rose" size={240} style={{ right: -90, top: -110 }} />
            <div style={{ position: "relative" }}>
              <p className="l-h2" style={{ fontSize: 22 }}>Save your progress</p>
              <p className="l-sub" style={{ marginTop: 6 }}>Right now it lives only on this phone. Save it to an account to keep it and use it on the website too.</p>
            </div>
            <button className="l-btn" onClick={saveWithGoogle} disabled={busy} style={{ position: "relative" }}>Continue with Google</button>
            <input type="email" placeholder="Email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} autoComplete="email"
              style={{ position: "relative", height: 52, borderRadius: 16, border: "1.5px solid var(--l-line2)", background: "#fff", padding: "0 16px", fontSize: 16, fontFamily: "inherit" }} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
              style={{ position: "relative", height: 52, borderRadius: 16, border: "1.5px solid var(--l-line2)", background: "#fff", padding: "0 16px", fontSize: 16, fontFamily: "inherit" }} />
            <button className="l-btn ghost" onClick={saveWithEmail} disabled={busy} style={{ position: "relative" }}>Save with email</button>
            {saveMsg && <p role="status" style={{ position: "relative", margin: 0, fontSize: 14, fontWeight: 600 }}>{saveMsg}</p>}
          </section>
        )}

        <section>
          <p className="l-eyebrow" style={{ marginBottom: 6 }}>Skill levels</p>
          {!mastery ? <Skeleton height={120} /> : DOMAINS.map((d) => (
            <div key={d.domain} style={{ marginTop: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--l-muted)", margin: "0 0 2px" }}>{d.domain}</p>
              {d.categories.filter((c) => levels.has(c.subcategory)).map((c) => {
                const m = levels.get(c.subcategory)!;
                return (
                  <div key={c.subcategory} style={{ padding: "8px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, fontWeight: 600 }}>
                      <LevelDot level={m.level} /><span style={{ flex: 1 }}>{c.subcategory}</span>
                      <span style={{ color: "var(--l-faint)", fontSize: 13 }}>{m.level === "not_started" ? "—" : `${m.score}%`}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "var(--l-soft2)", marginTop: 6 }}>
                      <div style={{ width: `${m.score}%`, height: 6, borderRadius: 3, background: LEVEL_COLOR(m.level) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </section>

        <section>
          <p className="l-eyebrow" style={{ marginBottom: 6 }}>Mistake notebook</p>
          {notebook.length === 0 ? (
            <p className="l-sub">Nothing saved. Questions you add from a results page on the website show up here.</p>
          ) : (
            <>
              {notebook.slice(0, 5).map((n) => (
                <div key={n.id} className="l-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--l-faint)" }}>{n.subcategory ?? "Question"}</span>
                  <span style={{ fontSize: 15, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.stem}</span>
                </div>
              ))}
              <button className="l-btn small" style={{ marginTop: 12 }} onClick={practiceMistakes} disabled={busy}>
                Practice {Math.min(notebook.length, 20)} {notebook.length === 1 ? "mistake" : "mistakes"}
              </button>
            </>
          )}
        </section>

        <section>
          <button className="l-row" onClick={() => goToFullSite()} style={{ width: "100%", background: "none", border: 0, borderBottom: "1px solid var(--l-line)", color: "var(--l-ink)", fontWeight: 600 }}>
            <span>Full site</span><span aria-hidden="true" style={{ color: "var(--l-dim)" }}>›</span>
          </button>
          {!me.isAnonymous && (
            <form action="/auth/signout" method="post">
              <button className="l-row" type="submit" style={{ width: "100%", background: "none", border: 0, color: "var(--l-wrong)", fontWeight: 600 }}>Sign out</button>
            </form>
          )}
        </section>
        <ErrorNote message={error} />
      </main>
      <TabBar />
    </>
  );
}
