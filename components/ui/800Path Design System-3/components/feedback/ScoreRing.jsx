import React from "react";

/**
 * ScoreRing — circular progress dial with a big percentage in the center.
 * Auto-colors by score. Used on the results hero.
 */
export function ScoreRing({ score = 0, size = 132, stroke = 12, caption, style = {} }) {
  const pct = Math.max(0, Math.min(100, score));
  const tone = pct >= 80 ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--danger)";
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "8px", ...style }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={tone}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset var(--dur-slow) var(--ease-out)" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: "var(--weight-extra)", fontSize: size * 0.26, color: "var(--text-strong)", letterSpacing: "var(--tracking-tight)", lineHeight: 1 }}>
            {pct}%
          </span>
        </div>
      </div>
      {caption && (
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{caption}</span>
      )}
    </div>
  );
}
