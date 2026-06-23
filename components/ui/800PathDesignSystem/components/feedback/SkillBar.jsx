import React from "react";

/**
 * SkillBar — a labeled accuracy row: skill name, percent, and a colored
 * bar that maps accuracy to mint/butter/rose. Core of the dashboard.
 */
export function SkillBar({ label, accuracy = 0, detail, style = {} }) {
  const pct = Math.max(0, Math.min(100, accuracy));
  const tone = pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)";

  return (
    <div style={{ ...style }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "7px", gap: "12px" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text-body)" }}>
          {label}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-strong)", whiteSpace: "nowrap" }}>
          {detail ? detail : `${pct}%`}
        </span>
      </div>
      <div style={{ height: 8, background: "var(--surface-sunken)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: tone, borderRadius: "var(--radius-pill)", transition: "width var(--dur-slow) var(--ease-out)" }} />
      </div>
    </div>
  );
}
