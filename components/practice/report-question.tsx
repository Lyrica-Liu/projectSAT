"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { REPORT_REASONS, type ReportReason } from "@/lib/reports";

/** "Report a problem" link that opens a small dialog. Used mid-session and on the results page. */
export function ReportQuestionButton({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A different question needs a fresh form (the component stays mounted across navigation).
  const [formFor, setFormFor] = useState(questionId);
  if (formFor !== questionId) {
    setFormFor(questionId);
    setOpen(false);
    setReason(null);
    setNote("");
    setSent(false);
    setError(null);
  }

  async function submit() {
    if (!reason) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/report-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, reason, note }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not send your report.");
      setSent(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your report.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>
        <Icon name="circle-check" size={13} /> Reported — thanks
      </span>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        display: "inline-flex", alignItems: "center", gap: 6, border: 0, background: "none", padding: 0,
        fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", cursor: "pointer",
      }}>
        <Icon name="flag" size={13} /> Report a problem
      </button>

      {open && (
        <div
          role="dialog" aria-modal="true" aria-labelledby="report-title"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "var(--overlay)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-2xl)", padding: "30px 32px 26px", width: "100%", maxWidth: 440, fontFamily: "var(--font-serif)" }}>
            <h2 id="report-title" style={{ fontWeight: 400, fontSize: 24, lineHeight: 1.2, color: "var(--text-strong)", margin: "0 0 6px" }}>What&apos;s wrong with this question?</h2>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-muted)", margin: "0 0 18px" }}>
              Reports go straight to the people who fix the question bank and generator.
            </p>

            <div role="radiogroup" aria-label="Reason" style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 14 }}>
              {REPORT_REASONS.map((r) => (
                <label key={r.value} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", cursor: "pointer",
                  borderRadius: "var(--radius-md)", background: reason === r.value ? "var(--surface-2)" : "transparent",
                  fontSize: 15, color: "var(--text-strong)",
                }}>
                  <input type="radio" name="report-reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
                  {r.label}
                </label>
              ))}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Anything else? (optional)"
              style={{
                width: "100%", boxSizing: "border-box", resize: "vertical", padding: "10px 12px",
                border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--canvas)",
                fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-body)",
              }}
            />

            {error && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", margin: "10px 0 0" }}>{error}</p>}

            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 18 }}>
              <button onClick={submit} disabled={!reason || sending} style={{
                border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)",
                fontSize: 14, fontWeight: 500, padding: "11px 22px", borderRadius: "var(--radius-lg)",
                cursor: !reason || sending ? "default" : "pointer", opacity: !reason || sending ? 0.5 : 1,
              }}>
                {sending ? "Sending…" : "Send report"}
              </button>
              <button onClick={() => setOpen(false)} style={{ border: 0, background: "none", padding: 0, fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-faint)", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
