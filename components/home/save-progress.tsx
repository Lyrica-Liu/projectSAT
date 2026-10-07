"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/ds";

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

/**
 * The "your progress isn't saved yet" banner and its modal, for anonymous students. Upgrading
 * keeps the same user id, so every set, answer and skill level stays put.
 */
export function SaveProgressPrompt({ style }: { style?: React.CSSProperties }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  async function createWithEmail() {
    setError(null);
    if (!email.trim() || !password) { setError("Enter an email and password to continue."); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setAwaitingConfirm(true);
  }

  async function continueWithGoogle() {
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) { setLoading(false); setError(err.message); }
    // On success the browser goes to Google and back.
  }

  return (
    <>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap",
        padding: "18px 24px", background: "var(--danger-surface)", borderLeft: "2px solid var(--danger)",
        borderRadius: "0 var(--radius-md) var(--radius-md) 0", ...style,
      }}>
        <div>
          <p style={{ fontSize: 16, color: "var(--text-strong)", margin: "0 0 4px" }}>Your progress isn&apos;t saved to an account yet.</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            It lives only in this browser — clear it or switch devices and your skill map is gone.
          </p>
        </div>
        <button onClick={() => setOpen(true)} style={{
          flexShrink: 0, border: 0, background: "var(--brand)", color: "var(--text-on-brand)",
          fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "12px 24px",
          borderRadius: "var(--radius-lg)", cursor: "pointer",
        }}>
          Save my progress
        </button>
      </div>

      {open && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--overlay)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-2xl)", padding: "40px 40px 36px", maxWidth: 420, width: "100%" }}>
            {awaitingConfirm ? (
              <>
                <h2 style={{ fontWeight: 400, fontSize: 27, lineHeight: 1.2, color: "var(--text-strong)", margin: "0 0 12px" }}>Check your email</h2>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)", margin: "0 0 28px" }}>
                  We sent a confirmation link to <strong style={{ color: "var(--text-strong)" }}>{email}</strong>. Once you confirm it, everything you&apos;ve done here is safely yours.
                </p>
                <button onClick={() => { setOpen(false); setAwaitingConfirm(false); }} style={{ border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "13px 26px", borderRadius: "var(--radius-lg)", cursor: "pointer" }}>
                  Done
                </button>
              </>
            ) : (
              <>
                <h2 style={{ fontWeight: 400, fontSize: 27, lineHeight: 1.2, color: "var(--text-strong)", margin: "0 0 8px" }}>Save your progress</h2>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)", margin: "0 0 24px" }}>
                  Nothing you&apos;ve done is lost — it carries straight into your account.
                </p>
                <button type="button" onClick={continueWithGoogle} disabled={loading} style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  padding: "12px 0", marginBottom: 18, background: "transparent", border: "1px solid var(--border-strong)",
                  borderRadius: "var(--radius-md)", cursor: loading ? "default" : "pointer",
                  fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 13, color: "var(--text-strong)", opacity: loading ? 0.6 : 1,
                }}>
                  <GoogleIcon />
                  Continue with Google
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap" }}>or continue with email</span>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 8 }}>
                  <Input label="Email" type="email" value={email} placeholder="you@example.com" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
                  <Input label="Password" type="password" value={password} placeholder="••••••••" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
                </div>
                {error && <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--danger)", margin: "10px 0 0" }}>{error}</p>}
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 24 }}>
                  <button onClick={createWithEmail} disabled={loading} style={{
                    border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)",
                    fontSize: 14, fontWeight: 500, padding: "13px 26px", borderRadius: "var(--radius-lg)",
                    cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1,
                  }}>
                    {loading ? "Creating…" : "Create account"}
                  </button>
                  <button onClick={() => setOpen(false)} style={{ border: 0, background: "none", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)", cursor: "pointer", padding: 0 }}>
                    Not now
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
