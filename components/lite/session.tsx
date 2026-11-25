"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LITE_RETURN_COOKIE } from "@/lib/auth";
import { Glow, Loading, Logo, setCacheUser } from "@/components/lite/ui";

type Stage = "loading" | "welcome" | "setup" | "ready" | "error";

const GOALS = [5, 10, 20, 30];

/**
 * Lite's front door. With a saved session it opens straight away (the check reads the session
 * locally, no network; API routes verify the user on every call). Without one, nobody is signed
 * in behind their back: the welcome screen offers Google sign-in, or "Start fresh", which makes a
 * guest and asks two quick setup questions.
 */
export function LiteSession({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<Stage>("loading");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(10);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setCacheUser(session.user.id); setStage("ready"); }
      else setStage("welcome");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function google() {
    setBusy(true);
    document.cookie = `${LITE_RETURN_COOKIE}=/lite; path=/; max-age=600; samesite=lax`;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (error) { setBusy(false); setStage("error"); }
  }

  async function startFresh() {
    setBusy(true);
    const { data, error } = await supabase.auth.signInAnonymously({ options: { data: { signup_source: "lite" } } });
    setBusy(false);
    if (error || !data.user) { setStage("error"); return; }
    setCacheUser(data.user.id);
    setStage("setup");
  }

  async function finishSetup() {
    setBusy(true);
    await supabase.auth.updateUser({ data: { display_name: name.trim() || null, lite_daily_goal: goal } });
    setBusy(false);
    setStage("ready");
  }

  if (stage === "ready") return <>{children}</>;
  if (stage === "loading") return <Loading />;

  if (stage === "error") {
    return (
      <div className="l-page no-tabs" style={{ minHeight: "100dvh", justifyContent: "center", textAlign: "center" }}>
        <h1 className="l-h2">Couldn&apos;t get started</h1>
        <p className="l-sub">Check your connection and try again.</p>
        <button className="l-btn" onClick={() => location.reload()}>Try again</button>
      </div>
    );
  }

  return (
    <>
      <Glow tone="coral" size={420} style={{ left: -150, top: -140 }} />
      <Glow tone="violet" size={400} style={{ right: -170, bottom: 40 }} />
      <main className="l-page no-tabs" style={{ minHeight: "100dvh", justifyContent: "center", gap: 28 }}>
        <Logo />
        {stage === "welcome" ? (
          <>
            <h1 className="l-h1" style={{ fontSize: 40 }}>Welcome</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button className="l-btn" onClick={google} disabled={busy}>Continue with Google</button>
              <button className="l-btn gradient" onClick={startFresh} disabled={busy}>Start fresh</button>
              <p className="l-sub" style={{ textAlign: "center" }}>No account needed to start. Sign in later and your practice comes with you.</p>
            </div>
          </>
        ) : (
          <>
            <h1 className="l-h1" style={{ fontSize: 36 }}>Quick setup</h1>
            <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="l-eyebrow">Your first name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" autoComplete="given-name"
                style={{ height: 52, borderRadius: 16, border: "1.5px solid var(--l-line2)", background: "#fff", padding: "0 16px", fontSize: 17, fontFamily: "inherit" }} />
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="l-eyebrow">Questions a day</span>
              <div className="l-seg" role="group" aria-label="Daily goal">
                {GOALS.map((g) => <button key={g} aria-pressed={goal === g} onClick={() => setGoal(g)}>{g}</button>)}
              </div>
            </div>
            <button className="l-btn gradient" onClick={finishSetup} disabled={busy}>{busy ? "Saving…" : "Let's go"}</button>
          </>
        )}
      </main>
    </>
  );
}
