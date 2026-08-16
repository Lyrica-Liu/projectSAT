import React from "react";

/**
 * ProgressBar — a 2px rule that fills. Square ends, charcoal ink.
 */
export function ProgressBar({ value = 0, tone = "brand", height = 2, showLabel = false, style = {} }) {
  const clamped = Math.max(0, Math.min(100, value));
  const fills = {
    brand: "var(--brand)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", width: "100%", ...style }}>
      <div style={{ flex: 1, height, background: "var(--surface-sunken)", overflow: "hidden" }}>
        <div
          style={{
            width: `${clamped}%`,
            height: "100%",
            background: fills[tone],
            transition: "width var(--dur-slow) var(--ease-out)",
          }}
        />
      </div>
      {showLabel && (
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontVariantNumeric: "tabular-nums", color: "var(--text-muted)", minWidth: 32, textAlign: "right" }}>
          {clamped}%
        </span>
      )}
    </div>
  );
}
