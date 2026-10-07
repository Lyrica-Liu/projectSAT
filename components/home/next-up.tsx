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
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 28, flexWrap: "wrap",
      padding: "26px 30px", background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", ...style,
    }}>
      <div style={{ minWidth: 0, flex: "1 1 320px" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 10px" }}>Next up</p>
        <h2 style={{ fontWeight: 400, fontSize: 24, lineHeight: 1.25, letterSpacing: "-0.014em", color: "var(--text-strong)", margin: "0 0 6px" }}>{suggestion.title}</h2>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--text-muted)", margin: 0 }}>{suggestion.body}</p>
        {error && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", margin: "10px 0 0" }}>{error}</p>}
      </div>
      <button onClick={go} disabled={busy} style={{
        flexShrink: 0, border: 0, background: "var(--brand)", color: "var(--text-on-brand)",
        fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500, padding: "15px 28px",
        borderRadius: "var(--radius-lg)", cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1,
      }}>
        {busy ? "Starting…" : action}
      </button>
    </section>
  );
}
