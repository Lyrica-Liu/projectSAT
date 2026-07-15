import React from "react";

/**
 * Badge — small pill label in a pastel tone. Used for domains, skills,
 * difficulty and status.
 */
export function Badge({ children, tone = "lilac", size = "md", dot = false, style = {} }) {
  const tones = {
    lilac:  { background: "var(--lilac-100)", color: "var(--brand-ink)" },
    mint:   { background: "var(--mint-surface)", color: "var(--mint-ink)" },
    sky:    { background: "var(--sky-surface)", color: "var(--sky-ink)" },
    rose:   { background: "var(--rose-surface)", color: "var(--rose-ink)" },
    butter: { background: "var(--butter-surface)", color: "var(--butter-ink)" },
    peach:  { background: "var(--peach-surface)", color: "var(--peach-ink)" },
    neutral:{ background: "var(--surface-sunken)", color: "var(--text-muted)" },
    success:{ background: "var(--success-surface)", color: "var(--success)" },
    warning:{ background: "var(--warning-surface)", color: "var(--warning)" },
    danger: { background: "var(--danger-surface)", color: "var(--danger)" },
  };
  const sizes = {
    sm: { padding: "3px 9px", fontSize: "11px" },
    md: { padding: "4px 11px", fontSize: "var(--text-xs)" },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--weight-semibold)",
        borderRadius: "var(--radius-pill)",
        whiteSpace: "nowrap",
        ...sizes[size],
        ...tones[tone],
        ...style,
      }}
    >
      {dot && (
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
      )}
      {children}
    </span>
  );
}
