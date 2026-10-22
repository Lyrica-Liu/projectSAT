"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/ds";
import { Wordmark, LoadingScreen } from "@/components/ui/nav";

type AccountInfo = {
  email: string;
  avatarUrl: string | null;
  memberSince: string;
  setsCompleted: number;
  lastPractice: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

const microLabel: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500,
  letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 6px",
};

/**
 * Shown once, right after a guest is moved into the Google account they already had: which
 * account this is, a chance to fix their name and test date, and a way out if it's the wrong one.
 */
function ConfirmAccount() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const guestSets = Number(params.get("guest_sets")) || 0;

  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [name, setName] = useState("");
  const [testDate, setTestDate] = useState("");
  const [initial, setInitial] = useState({ name: "", testDate: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.is_anonymous) { router.replace("/dashboard"); return; }

      const { data: done } = await supabase
        .from("sessions").select("completed_at").eq("user_id", user.id)
        .not("completed_at", "is", null).order("completed_at", { ascending: false });

      const meta = user.user_metadata ?? {};
      const startName = meta.display_name ?? meta.full_name ?? meta.name ?? "";
      const startDate = meta.test_date ?? "";
      setName(startName);
      setTestDate(startDate);
      setInitial({ name: startName, testDate: startDate });
      setInfo({
        email: user.email ?? "",
        avatarUrl: meta.avatar_url ?? meta.picture ?? null,
        memberSince: user.created_at,
        setsCompleted: done?.length ?? 0,
        lastPractice: done?.[0]?.completed_at ?? null,
      });
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirm() {
    setBusy(true);
    setError(null);
    if (name !== initial.name || testDate !== initial.testDate) {
      const { error: err } = await supabase.auth.updateUser({ data: { display_name: name.trim() || null, test_date: testDate || null } });
      if (err) { setBusy(false); setError(err.message); return; }
    }
    router.replace("/dashboard");
  }

  async function useAnotherAccount() {
    setBusy(true);
    await supabase.auth.signOut();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: "select_account" } },
    });
  }

  if (!info) return <LoadingScreen message="Loading your account…" />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)", padding: "40px 16px" }}>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        <Wordmark />

        <h1 style={{ fontWeight: 400, fontSize: 34, lineHeight: 1.1, letterSpacing: "-0.024em", color: "var(--text-strong)", margin: "48px 0 10px" }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--text-muted)", margin: "0 0 28px" }}>
          This Google account already has an 800Path account, so we signed you in to it. Check this is you.
        </p>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-2xl)", padding: "28px 28px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            {info.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.avatarUrl} alt="" width={44} height={44} referrerPolicy="no-referrer" style={{ borderRadius: "50%" }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--brand)", color: "var(--text-on-brand)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", fontSize: 18 }}>
                {(name || info.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 17, color: "var(--text-strong)", margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{info.email}</p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", margin: "2px 0 0" }}>Member since {formatDate(info.memberSince)}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div>
              <p style={microLabel}>Sets completed</p>
              <p style={{ fontSize: 22, color: "var(--text-strong)", margin: 0 }}>{info.setsCompleted}</p>
            </div>
            <div>
              <p style={microLabel}>Last practice</p>
              <p style={{ fontSize: 16, color: "var(--text-strong)", margin: "4px 0 0" }}>{info.lastPractice ? formatDate(info.lastPractice) : "Not yet"}</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Input label="First name" value={name} placeholder="Your name"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
            <Input label="SAT test date (optional)" type="date" value={testDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestDate(e.target.value)} />
          </div>
        </div>

        {guestSets > 0 && (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.55, color: "var(--text-muted)", margin: "18px 0 0" }}>
            The {guestSets} {guestSets === 1 ? "set" : "sets"} you did as a guest stay with that guest session and aren&apos;t part of this account.
          </p>
        )}

        {error && <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--danger)", margin: "14px 0 0" }}>{error}</p>}

        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginTop: 28 }}>
          <button onClick={confirm} disabled={busy} style={{
            border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)",
            fontSize: 14, fontWeight: 500, padding: "14px 28px", borderRadius: "var(--radius-lg)",
            cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1,
          }}>
            Looks right, continue
          </button>
          <button onClick={useAnotherAccount} disabled={busy} style={{
            border: 0, background: "none", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)",
            cursor: busy ? "default" : "pointer", padding: 0, textDecoration: "underline",
          }}>
            Not me, use another Google account
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmAccountPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ConfirmAccount />
    </Suspense>
  );
}
