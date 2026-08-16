import React from "react";

/**
 * SkillBar — a ruled accuracy row: skill in the reading serif, figure in
 * tabular sans, and a 2px rule beneath. Ink stays charcoal unless the
 * skill needs attention, which is the only time colour appears.
 */
export function SkillBar({ label, accuracy = 0, detail, style = {} }) {
  const pct = Math.max(0, Math.min(100, accuracy));
  const tone = pct >= 58 ? "var(--brand)" : "var(--danger)";

  return (
    <div style={{ paddingBottom: "14px", ...style }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "10px", gap: "16px" }}>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: "16px", color: "var(--text-strong)" }}>{label}</span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontVariantNumeric: "tabular-nums", color: pct >= 58 ? "var(--text-muted)" : "var(--danger)", whiteSpace: "nowrap" }}>
          {detail ? detail : `${pct}%`}
        </span>
      </div>
      <div style={{ height: 2, background: "var(--surface-sunken)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: tone, transition: "width var(--dur-slow) var(--ease-out)" }} />
      </div>
    </div>
  );
}
