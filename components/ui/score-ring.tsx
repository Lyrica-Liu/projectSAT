"use client";

import { useId } from "react";

/**
 * The score dial: a fine track with the score drawn in 800Path Lite's coral → rose → violet
 * gradient, the figure set large in the display serif. Below 58% the arc turns coral, the
 * colour for "needs attention". (Replaces the design system's ink-only ScoreRing.)
 */
export function ScoreRing({ score = 0, size = 148, stroke = 4, caption, style = {} }: {
  score?: number; size?: number; stroke?: number; caption?: string; style?: React.CSSProperties;
}) {
  const id = useId();
  const pct = Math.max(0, Math.min(100, score));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const low = pct < 58;

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 14, ...style }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f0664f" /><stop offset=".5" stopColor="#e04a73" /><stop offset="1" stopColor="#8458e8" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={low ? "var(--coral-500)" : `url(#${id})`} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
            style={{ transition: "stroke-dashoffset var(--dur-slow) var(--ease-out)" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: size * 0.3, color: "var(--text-strong)", letterSpacing: "-0.02em", lineHeight: 1 }}>{pct}%</span>
        </div>
      </div>
      {caption && (
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>{caption}</span>
      )}
    </div>
  );
}
