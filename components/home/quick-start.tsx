"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SkillMapResponse } from "./practice";

/** The optional diagnostic, offered as a way to color in the whole map at once. */
export function QuickStartCard({ quickStart, style }: { quickStart: SkillMapResponse["quickStart"]; style?: React.CSSProperties }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const minutes = Math.round((quickStart.questions * 1.5) / 5) * 5;
  const resuming = quickStart.status === "in_progress" && quickStart.sessionId;

  async function go() {
    if (resuming) { router.push(`/practice/${quickStart.sessionId}`); return; }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/start-diagnostic", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: "home" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.sessionId) throw new Error(body.error ?? "Could not start the quick start.");
      router.push(`/practice/${body.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the quick start.");
      setBusy(false);
    }
  }

  return (
    <section aria-label="Quick start" style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap",
      padding: "18px 24px", border: "1px dashed var(--line-strong)", borderRadius: "var(--radius-lg)", ...style,
    }}>
      <div style={{ flex: "1 1 320px" }}>
        <p style={{ fontSize: 16, color: "var(--text-strong)", margin: "0 0 4px" }}>
          {resuming ? "Finish your quick start" : "Quick start: color in your whole map"}
        </p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5, color: "var(--text-muted)", margin: 0 }}>
          {resuming
            ? "Your answers so far are saved."
            : `${quickStart.questions} mixed questions, about ${minutes} minutes — two from every skill, so every tile gets a first estimate. Optional.`}
        </p>
        {error && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", margin: "8px 0 0" }}>{error}</p>}
      </div>
      <button onClick={go} disabled={busy} style={{
        flexShrink: 0, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-strong)",
        fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "12px 22px",
        borderRadius: "var(--radius-lg)", cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1,
      }}>
        {busy ? "Starting…" : resuming ? "Resume" : "Start quick start"}
      </button>
    </section>
  );
}
