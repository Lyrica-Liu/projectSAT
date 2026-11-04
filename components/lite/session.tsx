"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loading, setCacheUser } from "@/components/lite/ui";

/**
 * Lite never asks anyone to sign up first: with no session it quietly starts a guest account
 * (the same as the website's Begin button), upgradeable later from the Me tab. The check reads
 * the saved session locally (no network), so a returning student sees Lite straight away; the
 * API routes verify the user properly on every call.
 */
export function LiteSession({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      let userId = session?.user.id;
      if (!userId) {
        const { data, error: err } = await supabase.auth.signInAnonymously({ options: { data: { signup_source: "lite" } } });
        if (err || !data.user) { setError(true); return; }
        userId = data.user.id;
      }
      setCacheUser(userId);
      setReady(true);
    })();
  }, []);

  if (error) {
    return (
      <div className="l-page no-tabs" style={{ minHeight: "100dvh", justifyContent: "center", textAlign: "center" }}>
        <h1 className="l-h2">Couldn&apos;t get started</h1>
        <p className="l-sub">Check your connection and try again.</p>
        <button className="l-btn" onClick={() => location.reload()}>Try again</button>
      </div>
    );
  }
  return ready ? <>{children}</> : <Loading />;
}
