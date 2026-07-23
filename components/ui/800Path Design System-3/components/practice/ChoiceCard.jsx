import React from "react";

/**
 * ChoiceCard — a large selectable option row with a radio indicator.
 * Used in practice setup (domain / session length). Selected state
 * tints lilac.
 */
export function ChoiceCard({ label, desc, selected = false, onClick, style = {} }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        width: "100%",
        textAlign: "left",
        padding: "15px 18px",
        background: selected ? "var(--lilac-50)" : "var(--surface-card)",
        border: `1.5px solid ${selected ? "var(--lilac-300)" : "var(--border-strong)"}`,
        borderRadius: "var(--radius-md)",
        boxShadow: selected ? "0 0 0 4px var(--focus-ring)" : "var(--shadow-xs)",
        cursor: "pointer",
        transition: "all var(--dur-base) var(--ease-out)",
      }}
    >
      <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: selected ? "var(--brand-ink)" : "var(--text-strong)" }}>
          {label}
        </span>
        {desc && (
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: selected ? "var(--lilac-400)" : "var(--text-faint)" }}>
            {desc}
          </span>
        )}
      </span>
      <span
        style={{
          flexShrink: 0,
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: `2px solid ${selected ? "var(--lilac-400)" : "var(--border-strong)"}`,
          background: selected ? "var(--lilac-400)" : "transparent",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all var(--dur-base) var(--ease-out)",
        }}
      >
        {selected && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
      </span>
    </button>
  );
}
