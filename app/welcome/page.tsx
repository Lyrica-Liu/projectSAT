"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mark } from "@/components/ui/mark";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

const choice: React.CSSProperties = {
  width: "100%", height: 52, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
  borderRadius: 999, fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500, cursor: "pointer",
  textDecoration: "none", transition: "transform .12s",
};

/**
 * Where someone lands after signing out (and any time they come back signed out): sign in to
 * their account, or start fresh as a new guest with the short setup questions.
 */
export default function WelcomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState<"google" | "fresh" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Already signed in: nothing to choose here.
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user && !user.is_anonymous) router.replace("/dashboard"); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function google() {
    setBusy("google");
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (err) { setBusy(null); setError(err.message); }
  }

  async function startFresh() {
    setBusy("fresh");
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const { error: err } = await supabase.auth.signInAnonymously({ options: { data: { signup_source: "welcome" } } });
      if (err) { setBusy(null); setError("Couldn't get started just now. Please try again."); return; }
    }
    router.push("/onboarding?setup=quick");
  }

  return (
    <div className="pw-wash" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px", fontFamily: "var(--font-serif)" }}>
      <main className="pw-glass" style={{ width: "100%", maxWidth: 420, borderRadius: 28, padding: "44px 36px 36px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <Mark height={22} />
          <span style={{ fontSize: 20, fontWeight: 600, color: "var(--text-strong)", letterSpacing: "-0.02em" }}>800Path</span>
        </div>
        <h1 style={{ fontWeight: 400, fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "28px 0 32px" }}>
          Welcome to 800Path
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={google} disabled={!!busy} style={{ ...choice, background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--text-strong)" }}>
            <GoogleIcon />{busy === "google" ? "Opening Google…" : "Continue with Google"}
          </button>
          <Link href="/auth?mode=signin" style={{ ...choice, background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--text-strong)" }}>
            Sign in with email
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
          <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 14, color: "var(--text-faint)" }}>or</span>
          <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <button className="pw-cta" onClick={startFresh} disabled={!!busy} style={{ ...choice, border: 0, background: "var(--brand-fill)", color: "var(--text-on-brand)" }}>
          {busy === "fresh" ? "Starting…" : "Start fresh →"}
        </button>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "12px 0 0" }}>No account needed. Sign in later and your practice comes with you.</p>

        {error && <p role="alert" style={{ fontSize: 14, color: "var(--danger)", margin: "16px 0 0" }}>{error}</p>}
      </main>
    </div>
  );
}
