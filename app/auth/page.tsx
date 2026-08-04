"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui/ds";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
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
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--canvas)", fontFamily: "var(--font-sans)", boxSizing: "border-box", zoom: 1.15 }}>

      {/* Left: editorial brand panel */}
      <aside style={{
        position: "relative", flex: "0 0 44%", minWidth: 320, maxWidth: 560,
        background: "var(--dark-900)", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "var(--space-12) var(--space-10)", boxSizing: "border-box",
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.12)", color: "var(--text-on-dark)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17,
          }}>8</span>
          <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: "var(--tracking-tight)", color: "var(--text-on-dark)" }}>800Path</span>
        </span>

        <div>
          <p style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500,
            fontSize: "var(--text-3xl)", lineHeight: 1.15, letterSpacing: "var(--tracking-snug)",
            color: "var(--text-on-dark)", margin: "0 0 var(--space-4)",
          }}>
            &ldquo;Steady, deliberate progress —{" "}
            <span style={{ background: "var(--gradient-radiant)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontStyle: "normal" }}>
              one session at a time.
            </span>&rdquo;
          </p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-on-dark-muted)", margin: 0 }}>
            The practice companion for self-studiers.
          </p>
        </div>

        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-on-dark-faint)", margin: 0 }}>© 2026 800Path</p>
      </aside>

      {/* Right: form */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-16) var(--space-8)", boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: 380, boxSizing: "border-box" }}>

          {/* Segmented toggle */}
          <div style={{ display: "flex", padding: 4, gap: 4, background: "var(--surface-sunken)", borderRadius: "var(--radius-lg)", marginBottom: 28 }}>
            <button
              type="button"
              onClick={() => switchMode("signin")}
              style={{
                flex: 1, padding: "8px 16px", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)",
                fontWeight: mode === "signin" ? 700 : 600,
                color: mode === "signin" ? "#fff" : "var(--text-muted)",
                background: mode === "signin" ? "var(--brand)" : "transparent",
                border: mode === "signin" ? "1.5px solid var(--brand)" : "1.5px solid transparent",
                borderRadius: "var(--radius-md)", cursor: "pointer",
                boxShadow: mode === "signin" ? "var(--shadow-brand)" : "none",
                transition: "all var(--dur-base) var(--ease-out)",
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              style={{
                flex: 1, padding: "8px 16px", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)",
                fontWeight: mode === "signup" ? 700 : 600,
                color: mode === "signup" ? "#fff" : "var(--text-muted)",
                background: mode === "signup" ? "var(--brand)" : "transparent",
                border: mode === "signup" ? "1.5px solid var(--brand)" : "1.5px solid transparent",
                borderRadius: "var(--radius-md)", cursor: "pointer",
                boxShadow: mode === "signup" ? "var(--shadow-brand)" : "none",
                transition: "all var(--dur-base) var(--ease-out)",
              }}
            >
              Sign up
            </button>
          </div>

          <h1 style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500,
            fontSize: "var(--text-2xl)", color: "var(--text-strong)", margin: "0 0 6px",
          }}>
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "0 0 28px" }}>
            {mode === "signin"
              ? "Sign in to continue your practice."
              : "Start improving your SAT score today."}
          </p>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              gap: 10, padding: "11px 0", marginBottom: 16,
              background: "var(--surface)", border: "1.5px solid var(--border-strong)",
              borderRadius: "var(--radius-pill)", cursor: "pointer",
              fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)",
              color: "var(--text-strong)", transition: "border-color var(--dur-base)",
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", whiteSpace: "nowrap" }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
            onKeyDown={(e) => { if (e.key === "Enter" && !loading) doAuth(); }}
          >
            {mode === "signup" && (
              <Input
                label="Display name"
                placeholder="Your name"
                value={displayName}
                 
                onChange={(e: any) => setDisplayName(e.target.value)}
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
               
              onChange={(e: any) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
               
              onChange={(e: any) => setPassword(e.target.value)}
            />

            {error && (
              <div style={{
                fontSize: "var(--text-xs)", color: "var(--danger)", background: "var(--danger-surface)",
                border: "1px solid var(--danger)", borderRadius: "var(--radius-sm)", padding: "10px 14px",
                lineHeight: "var(--leading-normal)",
              }}>
                {error}
              </div>
            )}
            {successMsg && (
              <div style={{
                fontSize: "var(--text-xs)", color: "var(--mint-ink)", background: "var(--mint-surface)",
                border: "1px solid var(--mint-ink)", borderRadius: "var(--radius-sm)", padding: "10px 14px",
                lineHeight: "var(--leading-normal)",
              }}>
                {successMsg}
              </div>
            )}

            <div style={{ marginTop: 4 }}>
              <Button
                full
                size="lg"
                type="button"
                onClick={doAuth}
                disabled={loading}
              >
                {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </div>
          </div>

          <p style={{ marginTop: 24, fontSize: "var(--text-xs)", color: "var(--text-faint)", lineHeight: 1.6 }}>
            By continuing, you agree to our{" "}
            <span style={{ textDecoration: "underline", cursor: "pointer" }}>Terms</span> and{" "}
            <span style={{ textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>.
          </p>
        </div>
      </main>
    </div>
  );
}
