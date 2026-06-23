"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Button, Input, SegmentedControl } from "@/components/ui/ds";
import { Wordmark } from "@/components/ui/nav";

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("mode") === "signup") setMode("signup");
  }, [searchParams]);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName || email.split("@")[0] } },
      });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setSuccessMsg("Check your email to confirm your account, then sign in.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--canvas)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "48px 20px",
    }}>
      <div style={{ marginBottom: 28 }}>
        <Wordmark href="/" />
      </div>

      <Card tone="surface" padding="xl" radius="xl" shadow="md" style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ marginBottom: 24 }}>
          <SegmentedControl
            options={[
              { value: "signin", label: "Sign in" },
              { value: "signup", label: "Sign up" },
            ]}
            value={mode}
            onChange={(v: string) => {
              setMode(v as "signin" | "signup");
              setError(null);
              setSuccessMsg(null);
            }}
            style={{ width: "100%" }}
          />
        </div>

        <h1 style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-lg)",
          color: "var(--text-strong)", margin: "0 0 6px",
        }}>
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-muted)",
          margin: "0 0 24px", lineHeight: "var(--leading-normal)",
        }}>
          {mode === "signin"
            ? "Sign in to continue your practice."
            : "Start improving your SAT score today."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={(e: any) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div style={{
              fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)",
              color: "var(--danger)", background: "var(--danger-surface)",
              borderRadius: "var(--radius-md)", padding: "10px 14px",
              lineHeight: "var(--leading-normal)",
            }}>
              {error}
            </div>
          )}
          {successMsg && (
            <div style={{
              fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)",
              color: "var(--success)", background: "var(--success-surface)",
              borderRadius: "var(--radius-md)", padding: "10px 14px",
              lineHeight: "var(--leading-normal)",
            }}>
              {successMsg}
            </div>
          )}

          <Button full size="lg" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
      </Card>

      <p style={{
        marginTop: 22, fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)",
        color: "var(--text-faint)", textAlign: "center", maxWidth: 320, lineHeight: 1.6,
      }}>
        By continuing, you agree to our{" "}
        <span style={{ textDecoration: "underline", cursor: "pointer" }}>Terms</span> and{" "}
        <span style={{ textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>.
      </p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
