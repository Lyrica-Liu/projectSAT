"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Button, Input } from "@/components/ui/ds";
import { Wordmark } from "@/components/ui/nav";

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
          window.location.href = "/dashboard";
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
    <div style={{
      minHeight: "100vh",
      background: "var(--canvas)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 20px",
    }}>
      <div style={{ marginBottom: 28 }}>
        <Wordmark href="/" />
      </div>

      <Card tone="surface" padding="xl" radius="xl" shadow="md" style={{ width: "100%", maxWidth: 380 }}>
        {/* Mode toggle */}
        <div style={{
          display: "flex",
          background: "var(--surface-sunken)",
          borderRadius: 999,
          padding: 4,
          gap: 4,
          marginBottom: 24,
        }}>
          <button
            type="button"
            onClick={() => switchMode("signin")}
            style={{
              flex: 1,
              padding: "9px 0",
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: "0.875rem",
              background: mode === "signin" ? "var(--surface)" : "transparent",
              border: "none",
              borderRadius: 999,
              cursor: "pointer",
              color: mode === "signin" ? "var(--text-strong)" : "var(--text-muted)",
              boxShadow: mode === "signin" ? "var(--shadow-sm)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            style={{
              flex: 1,
              padding: "9px 0",
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: "0.875rem",
              background: mode === "signup" ? "var(--surface)" : "transparent",
              border: "none",
              borderRadius: 999,
              cursor: "pointer",
              color: mode === "signup" ? "var(--text-strong)" : "var(--text-muted)",
              boxShadow: mode === "signup" ? "var(--shadow-sm)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            Sign up
          </button>
        </div>

        <h1 style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 700,
          fontSize: "1.25rem",
          color: "var(--text-strong)",
          margin: "0 0 6px",
        }}>
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: "0.875rem",
          color: "var(--text-muted)",
          margin: "0 0 20px",
          lineHeight: 1.5,
        }}>
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
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.875rem",
            color: "var(--text-strong)", transition: "border-color 0.15s ease",
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--text-faint)", whiteSpace: "nowrap" }}>or continue with email</span>
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(e: any) => setDisplayName(e.target.value)}
            />
          )}
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={(e: any) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={(e: any) => setPassword(e.target.value)}
          />

          {error && (
            <div style={{
              fontSize: "0.8rem",
              color: "#b1426e",
              background: "#fdeaf1",
              border: "1px solid #f1bccd",
              borderRadius: 10,
              padding: "10px 14px",
              lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}
          {successMsg && (
            <div style={{
              fontSize: "0.8rem",
              color: "#1f7a57",
              background: "#e7f7ef",
              border: "1px solid #b4e8ce",
              borderRadius: 10,
              padding: "10px 14px",
              lineHeight: 1.5,
            }}>
              {successMsg}
            </div>
          )}

          <Button
            full
            size="lg"
            type="button"
            onClick={doAuth}
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </div>
      </Card>

      <p style={{
        marginTop: 22,
        fontFamily: "var(--font-sans)",
        fontSize: "0.75rem",
        color: "var(--text-faint)",
        textAlign: "center",
        maxWidth: 320,
        lineHeight: 1.6,
      }}>
        By continuing, you agree to our{" "}
        <span style={{ textDecoration: "underline", cursor: "pointer" }}>Terms</span> and{" "}
        <span style={{ textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>.
      </p>
    </div>
  );
}
