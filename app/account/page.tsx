"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppNav, LoadingScreen } from "@/components/ui/nav";
import { Card, Input, Button } from "@/components/ui/ds";

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: 700,
  letterSpacing: "var(--tracking-caps)", textTransform: "uppercase",
  color: "var(--text-faint)", margin: "0 0 8px", display: "block",
};

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [memberSince, setMemberSince] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [initialDisplayName, setInitialDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [redoingOnboarding, setRedoingOnboarding] = useState(false);
  const [redoError, setRedoError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }

      setEmail(user.email ?? "");
      if (user.created_at) {
        setMemberSince(new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }));
      }
      const name = user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? "";
      setDisplayName(name);
      setInitialDisplayName(name);

      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveDisplayName() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error: updateErr } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() },
    });
    setSaving(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    setInitialDisplayName(displayName.trim());
    setSaved(true);
  }

  async function redoOnboarding() {
    setRedoingOnboarding(true);
    setRedoError(null);
    const { error: updateErr } = await supabase.auth.updateUser({
      data: { onboarding_complete: false },
    });
    if (updateErr) {
      setRedoError(updateErr.message);
      setRedoingOnboarding(false);
      return;
    }
    router.push("/onboarding");
  }

  if (loading) return <LoadingScreen message="Loading account…" />;

  const dirty = displayName.trim() !== initialDisplayName && displayName.trim().length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
      <AppNav />

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ marginBottom: 28 }}>
          <span style={eyebrow}>Your account</span>
          <h1 style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500,
            fontSize: "var(--text-2xl)", color: "var(--text-strong)",
            margin: 0, letterSpacing: "var(--tracking-snug)",
          }}>
            Account
          </h1>
        </div>

        <Card tone="surface" padding="xl" radius="2xl" shadow="md">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Input
              label="Display name"
              placeholder="Your name"
              value={displayName}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(e: any) => { setDisplayName(e.target.value); setSaved(false); }}
            />
            <Input label="Email" value={email} disabled />

            {memberSince && (
              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", margin: 0 }}>
                Member since {memberSince}
              </p>
            )}

            {error && (
              <p style={{ fontSize: "var(--text-sm)", color: "var(--danger)", margin: 0 }}>{error}</p>
            )}
            {saved && !error && (
              <p style={{ fontSize: "var(--text-sm)", color: "var(--brand)", margin: 0 }}>Saved.</p>
            )}

            <Button onClick={saveDisplayName} disabled={!dirty || saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </Card>

        <Card tone="surface" padding="xl" radius="2xl" shadow="md" style={{ marginTop: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-md)", color: "var(--text-strong)", margin: "0 0 4px" }}>
                Redo onboarding
              </h2>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: 0, lineHeight: "var(--leading-relaxed)" }}>
                Retake the welcome questions — target score, starting point, and focus areas — to recalibrate your plan.
              </p>
            </div>

            {redoError && (
              <p style={{ fontSize: "var(--text-sm)", color: "var(--danger)", margin: 0 }}>{redoError}</p>
            )}

            <Button variant="secondary" onClick={redoOnboarding} disabled={redoingOnboarding}>
              {redoingOnboarding ? "Loading…" : "Redo onboarding"}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
