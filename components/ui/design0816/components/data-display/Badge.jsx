import React from "react";

/**
 * Badge — a quiet label, not a candy pill: hairline rule, small tracked
 * sans, tone carried by the ink rather than a pastel fill.
 */
export function Badge({ children, tone = "lilac", size = "md", dot = false, style = {} }) {
  const tones = {
    lilac:   { color: "var(--text-strong)", borderColor: "var(--border-strong)" },
    neutral: { color: "var(--text-muted)", borderColor: "var(--border)" },
    mint:    { color: "var(--moss-500)", borderColor: "var(--moss-100)" },
    success: { color: "var(--success)", borderColor: "var(--moss-100)" },
    sky:     { color: "var(--slate-500)", borderColor: "var(--border)" },
    butter:  { color: "var(--ochre-500)", borderColor: "var(--ochre-100)" },
    warning: { color: "var(--warning)", borderColor: "var(--ochre-100)" },
    rose:    { color: "var(--claret-500)", borderColor: "var(--claret-100)" },
    peach:   { color: "var(--claret-500)", borderColor: "var(--claret-100)" },
    danger:  { color: "var(--danger)", borderColor: "var(--claret-100)" },
  };
  const sizes = {
    sm: { padding: "2px 7px", fontSize: "10px" },
    md: { padding: "3px 9px", fontSize: "11px" },
  };
  const t = tones[tone] || tones.lilac;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--weight-medium)",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        border: `1px solid ${t.borderColor}`,
        borderRadius: "var(--radius-sm)",
        background: "transparent",
        color: t.color,
        whiteSpace: "nowrap",
        lineHeight: 1.5,
        ...sizes[size],
        ...style,
      }}
    >
      {dot && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />}
      {children}
    </span>
  );
}
