import React from "react";

/**
 * ScoreRing — a fine dial: 3px track, charcoal ink, the figure set large
 * in the display serif. Colour only when the score needs attention.
 */
export function ScoreRing({ score = 0, size = 148, stroke = 3, caption, style = {} }) {
  const pct = Math.max(0, Math.min(100, score));
  const tone = pct >= 58 ? "var(--brand)" : "var(--danger)";
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "14px", ...style }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={tone}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset var(--dur-slow) var(--ease-out)" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: size * 0.3, color: "var(--text-strong)", letterSpacing: "-0.02em", lineHeight: 1 }}>
            {pct}%
          </span>
        </div>
      </div>
      {caption && (
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>{caption}</span>
      )}
    </div>
  );
}
