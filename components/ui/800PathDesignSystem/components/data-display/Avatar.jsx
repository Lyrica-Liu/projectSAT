import React from "react";

/**
 * Avatar — rounded initials chip in a deterministic pastel tone.
 */
export function Avatar({ name = "", initials: initialsProp, size = 36, tone, style = {} }) {
  const palette = [
    ["var(--lilac-100)", "var(--brand-ink)"],
    ["var(--mint-surface)", "var(--mint-ink)"],
    ["var(--sky-surface)", "var(--sky-ink)"],
    ["var(--rose-surface)", "var(--rose-ink)"],
    ["var(--peach-surface)", "var(--peach-ink)"],
  ];
  const dim = Number(size) || 36;
  const initials = (initialsProp ? String(initialsProp) : name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")) || "?";
  const key = name || initialsProp || "";
  const idx = tone != null ? Number(tone) : [...String(key)].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  const [bg, fg] = palette[idx % palette.length];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: dim,
        height: dim,
        flexShrink: 0,
        borderRadius: "50%",
        background: bg,
        color: fg,
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--weight-bold)",
        fontSize: dim * 0.4,
        letterSpacing: "0.01em",
        ...style,
      }}
    >
      {initials}
    </span>
  );
}
