import React from "react";

/**
 * AnswerOption — a ruled answer row, not a card. The letter sits in the
 * margin in small sans; the answer itself is set in the reading serif.
 * Graded states are carried by a 2px left edge and the ink colour.
 */
export function AnswerOption({ letter, children, state = "default", onClick, disabled = false, style = {} }) {
  const states = {
    default:   { edge: "transparent", bg: "transparent", text: "var(--text-body)", mark: "var(--text-faint)" },
    selected:  { edge: "var(--text-strong)", bg: "var(--surface-sunken)", text: "var(--text-strong)", mark: "var(--text-strong)" },
    correct:   { edge: "var(--success)", bg: "var(--success-surface)", text: "var(--text-strong)", mark: "var(--success)" },
    incorrect: { edge: "var(--danger)", bg: "transparent", text: "var(--text-muted)", mark: "var(--danger)" },
    muted:     { edge: "transparent", bg: "transparent", text: "var(--ink-400)", mark: "var(--ink-300)" },
  };
  const s = states[state] || states.default;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "18px",
        width: "100%",
        textAlign: "left",
        padding: "16px 18px 16px 16px",
        background: s.bg,
        border: "0",
        borderTop: "1px solid var(--border)",
        borderLeft: `2px solid ${s.edge}`,
        borderRadius: "0",
        cursor: disabled ? "default" : "pointer",
        transition: "background var(--dur-fast) var(--ease-out)",
        ...style,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 11,
          paddingTop: 4,
          color: s.mark,
          fontFamily: "var(--font-sans)",
          fontSize: "12px",
          letterSpacing: "0.04em",
        }}
      >
        {letter}
      </span>
      <span style={{ fontFamily: "var(--font-serif)", fontSize: "17px", lineHeight: 1.5, color: s.text }}>
        {children}
      </span>
    </button>
  );
}
