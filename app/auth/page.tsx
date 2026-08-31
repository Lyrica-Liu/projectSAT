"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/ds";
import { Wordmark } from "@/components/ui/nav";

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

const fieldLabel: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-sans)", fontSize: 10,
  letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 9px",
};

function AuthForm() {
  const params = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();
  const isUp = mode === "signup";

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    // An anonymous session (started from onboarding, before any account existed) already has
    // real progress attached to it — link Google to that same user instead of starting a
    // separate one, so nothing gets orphaned.
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.is_anonymous) {
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setLoading(false);
        setError(error.message);
      }
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  function switchMode(m: "signin" | "signup") {
    setMode(m);
    setError(null);
    setSuccessMsg(null);
  }

  async function doAuth() {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === "signup") {
        // Same reasoning as the Google path above — upgrade an existing anonymous session
        // in place rather than creating an unrelated new account and losing its progress.
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser?.is_anonymous) {
          const { error } = await supabase.auth.updateUser({
            email, password,
            data: displayName ? { display_name: displayName } : undefined,
          });
          if (error) {
            setError(error.message);
          } else {
            setSuccessMsg("Check your email to confirm your account — everything you've already done is saved.");
          }
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName || email.split("@")[0] } },
        });
        if (error) {
          setError(error.message);
        } else if (data.session) {
          window.location.href = "/onboarding";
          return;
        } else {
          setSuccessMsg("Check your email to confirm your account, then sign in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
        } else {
          window.location.href = "/dashboard";
          return;
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)" }}>

      <aside style={{
        position: "relative", flex: "0 0 44%", minWidth: 320, maxWidth: 540,
        background: "var(--dark-900)", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "44px 48px",
      }}>
        <Wordmark dark />

        <div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-on-dark-faint)", margin: "0 0 26px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 26, height: 1, background: "var(--dark-700)" }} />
            Thirty days, in order
          </p>
          <p style={{ fontWeight: 400, fontSize: 38, lineHeight: 1.12, letterSpacing: "-0.024em", color: "var(--text-on-dark)", margin: "0 0 18px", maxWidth: "24ch", textWrap: "pretty" }}>
            Steady, deliberate progress — one sitting at a time.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.62, color: "var(--text-on-dark-muted)", margin: 0, maxWidth: "36ch" }}>
            Twenty questions a day, timed like the test, explained the way a good tutor would.
          </p>
        </div>

        <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-on-dark-faint)", margin: 0 }}>© 2026 800Path</p>
      </aside>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "72px 56px" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          <div style={{ display: "flex", borderBottom: "1px solid var(--line-strong)", margin: "0 0 36px", fontFamily: "var(--font-sans)" }}>
            <button type="button" onClick={() => switchMode("signin")} style={{
              flex: 1, padding: "0 0 12px", border: "none", borderBottom: `2px solid ${!isUp ? "var(--text-strong)" : "transparent"}`,
              background: "none", fontSize: 13, color: !isUp ? "var(--text-strong)" : "var(--text-faint)",
              fontWeight: !isUp ? 500 : 400, cursor: "pointer", marginBottom: -1, transition: "color 0.16s, border-color 0.16s",
            }}>Sign in</button>
            <button type="button" onClick={() => switchMode("signup")} style={{
              flex: 1, padding: "0 0 12px", border: "none", borderBottom: `2px solid ${isUp ? "var(--text-strong)" : "transparent"}`,
              background: "none", fontSize: 13, color: isUp ? "var(--text-strong)" : "var(--text-faint)",
              fontWeight: isUp ? 500 : 400, cursor: "pointer", marginBottom: -1, transition: "color 0.16s, border-color 0.16s",
            }}>Sign up</button>
          </div>

          <h1 style={{ fontWeight: 400, fontSize: 34, lineHeight: 1.08, letterSpacing: "-0.024em", color: "var(--text-strong)", margin: "0 0 10px" }}>
            {isUp ? "Start the thirty days" : "Welcome back"}
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--text-muted)", margin: "0 0 32px" }}>
            {isUp ? "One minute of setup, then Day 1 opens." : "Sign in to pick up where the plan left off."}
          </p>

          <button
            type="button" onClick={signInWithGoogle} disabled={loading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "12px 0", marginBottom: 22, background: "transparent", border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-md)", cursor: loading ? "default" : "pointer",
              fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 13, color: "var(--text-strong)",
              transition: "border-color 0.16s", opacity: loading ? 0.6 : 1,
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap" }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: 22 }}
            onKeyDown={(e) => { if (e.key === "Enter" && !loading) doAuth(); }}
          >
            {isUp && (
              <label style={{ display: "block" }}>
                <span style={fieldLabel}>First name</span>
                <Input value={displayName} placeholder="Maya"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)} />
              </label>
            )}
            <label style={{ display: "block" }}>
              <span style={fieldLabel}>Email</span>
              <Input type="email" value={email} placeholder="you@example.com"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
            </label>
            <label style={{ display: "block" }}>
              <span style={fieldLabel}>Password</span>
              <Input type="password" value={password} placeholder="••••••••"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
            </label>

            {error && (
              <div style={{
                fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--danger)", background: "var(--danger-surface)",
                borderLeft: "2px solid var(--danger)", padding: "10px 14px", lineHeight: 1.5,
              }}>{error}</div>
            )}
            {successMsg && (
              <div style={{
                fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--success)", background: "var(--success-surface)",
                borderLeft: "2px solid var(--success)", padding: "10px 14px", lineHeight: 1.5,
              }}>{successMsg}</div>
            )}

            <button
              type="button" onClick={doAuth} disabled={loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", background: "var(--brand)",
                color: "var(--text-on-brand)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500,
                padding: "15px 0", borderRadius: "var(--radius-lg)", border: "none", marginTop: 6,
                cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, transition: "background 0.16s",
              }}
            >
              {loading ? "Please wait…" : isUp ? "Create account" : "Sign in"}
            </button>
          </div>

          <p style={{ margin: "26px 0 0", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", lineHeight: 1.7 }}>
            By continuing you agree to the <span style={{ textDecoration: "underline" }}>Terms</span> and{" "}
            <span style={{ textDecoration: "underline" }}>Privacy Policy</span>. No paywall, no card.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}
