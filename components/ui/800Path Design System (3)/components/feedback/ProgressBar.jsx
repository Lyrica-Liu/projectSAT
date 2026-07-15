import React from "react";

/**
 * ProgressBar — slim rounded track. Default lilac fill; pass `tone`
 * for accuracy coloring.
 */
export function ProgressBar({ value = 0, tone = "brand", height = 8, showLabel = false, style = {} }) {
  const clamped = Math.max(0, Math.min(100, value));
  const fills = {
    brand: "var(--brand)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", ...style }}>
      <div
        style={{
          flex: 1,
          height,
          background: "var(--surface-sunken)",
          borderRadius: "var(--radius-pill)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: "100%",
            background: fills[tone],
            borderRadius: "var(--radius-pill)",
            transition: "width var(--dur-slow) var(--ease-out)",
          }}
        />
      </div>
      {showLabel && (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-body)", minWidth: 34, textAlign: "right" }}>
          {clamped}%
        </span>
      )}
    </div>
  );
}
