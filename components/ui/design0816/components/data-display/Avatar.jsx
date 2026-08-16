import React from "react";

/**
 * Avatar — a monogram in a hairline square. No pastel fills, no circles:
 * it reads as a stamped initial rather than a chat bubble.
 */
export function Avatar({ name = "", initials: initialsProp, size = 34, tone, style = {} }) {
  const dim = Number(size) || 34;
  const initials = (initialsProp ? String(initialsProp) : name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")) || "?";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: dim,
        height: dim,
        flexShrink: 0,
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-strong)",
        background: "transparent",
        color: "var(--text-strong)",
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--weight-medium)",
        fontSize: dim * 0.36,
        letterSpacing: "0.04em",
        ...style,
      }}
    >
      {initials}
    </span>
  );
}
