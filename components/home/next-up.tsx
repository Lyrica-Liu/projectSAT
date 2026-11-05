"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Suggestion } from "@/lib/suggestions";
import { startPracticeSet } from "./practice";

/** The single "Next up" suggestion, with one button that does it. */
export function NextUpCard({ suggestion, style }: { suggestion: Suggestion; style?: React.CSSProperties }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const action =
    suggestion.kind === "practice" ? `Start ${suggestion.count} questions`
    : suggestion.kind === "resume" ? "Resume"
    : "Continue";

  async function go() {
    setError(null);
    if (suggestion.kind === "resume") { router.push(`/practice/${suggestion.sessionId}`); return; }
    if (suggestion.kind === "sprint") { router.push(suggestion.href); return; }
    setBusy(true);
    try {
      router.push(`/practice/${await startPracticeSet(suggestion.subcategory, suggestion.difficulty, suggestion.count)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the set.");
      setBusy(false);
    }
  }

  return (
    <section aria-label="Next up" style={{
      position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 28, flexWrap: "wrap",
      padding: "26px 30px", background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-2xl)", boxShadow: "var(--shadow-lg)", ...style,
    }}>
      {/* The same soft glows and gradient play circle as 800Path Lite's Start button. */}
      <span aria-hidden="true" style={{ position: "absolute", width: 360, height: 360, right: -120, top: -200, borderRadius: "50%", background: "radial-gradient(circle, rgba(224,74,115,.16), transparent 68%)", pointerEvents: "none" }} />
      <span aria-hidden="true" style={{ position: "absolute", width: 320, height: 320, left: -140, bottom: -220, borderRadius: "50%", background: "radial-gradient(circle, rgba(132,88,232,.14), transparent 68%)", pointerEvents: "none" }} />
      <button onClick={go} disabled={busy} aria-label={action} style={{
        position: "relative", flexShrink: 0, width: 58, height: 58, border: 0, borderRadius: "50%",
        background: "var(--gradient-radiant)", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 22px rgba(224,74,115,.28)", cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1,
      }}>
        <svg width="20" height="22" viewBox="0 0 22 24" aria-hidden="true"><path d="M3 2.5v19a1 1 0 0 0 1.5.9l15.5-9.5a1 1 0 0 0 0-1.8L4.5 1.6A1 1 0 0 0 3 2.5Z" fill="#fff" /></svg>
      </button>
      <div style={{ position: "relative", minWidth: 0, flex: "1 1 320px" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 10px" }}>Next up</p>
        <h2 style={{ fontWeight: 400, fontSize: 24, lineHeight: 1.25, letterSpacing: "-0.014em", color: "var(--text-strong)", margin: "0 0 6px" }}>{suggestion.title}</h2>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--text-muted)", margin: 0 }}>{suggestion.body}</p>
        {error && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", margin: "10px 0 0" }}>{error}</p>}
      </div>
      <button onClick={go} disabled={busy} style={{
        position: "relative", flexShrink: 0, border: 0, background: "var(--brand-fill)", color: "var(--text-on-brand)",
        fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500, padding: "15px 28px",
        borderRadius: 999, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1,
      }}>
        {busy ? "Starting…" : action}
      </button>
    </section>
  );
}
