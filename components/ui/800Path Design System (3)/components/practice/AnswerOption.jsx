import React from "react";

/**
 * AnswerOption — a multiple-choice answer row (A–D) with letter chip and
 * graded states: default, selected, correct, incorrect, muted.
 */
export function AnswerOption({ letter, children, state = "default", onClick, disabled = false, style = {} }) {
  const states = {
    default:   { bg: "var(--surface-card)", border: "var(--border-strong)", text: "var(--text-body)", chipBg: "var(--surface-sunken)", chipText: "var(--text-muted)" },
    selected:  { bg: "var(--lilac-50)", border: "var(--lilac-300)", text: "var(--brand-ink)", chipBg: "var(--lilac-400)", chipText: "#fff" },
    correct:   { bg: "var(--mint-surface)", border: "var(--lilac-200)", text: "var(--mint-ink)", chipBg: "var(--mint-ink)", chipText: "#fff" },
    incorrect: { bg: "var(--rose-surface)", border: "#f3b8d8", text: "var(--rose-ink)", chipBg: "var(--rose-ink)", chipText: "#fff" },
    muted:     { bg: "var(--surface-card)", border: "var(--border)", text: "var(--text-faint)", chipBg: "var(--surface-sunken)", chipText: "var(--text-faint)" },
  };
  const s = states[state];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "13px",
        width: "100%",
        textAlign: "left",
        padding: "13px 15px",
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        borderRadius: "var(--radius-md)",
        cursor: disabled ? "default" : "pointer",
        transition: "all var(--dur-base) var(--ease-out)",
        ...style,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 26,
          height: 26,
          borderRadius: "10px",
          background: s.chipBg,
          color: s.chipText,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          fontSize: "var(--text-xs)",
        }}
      >
        {letter}
      </span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-snug)", color: s.text }}>
        {children}
      </span>
    </button>
  );
}
