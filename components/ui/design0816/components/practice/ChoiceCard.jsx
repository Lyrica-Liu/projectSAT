import React from "react";

/**
 * ChoiceCard — a ruled selectable row. Selection is a 2px charcoal edge
 * and a faint fill; the marker is a small square, not a radio dot.
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
        gap: "20px",
        width: "100%",
        textAlign: "left",
        padding: "18px 20px",
        background: selected ? "var(--surface-sunken)" : "transparent",
        border: "1px solid var(--border)",
        borderLeft: `2px solid ${selected ? "var(--text-strong)" : "var(--border)"}`,
        borderRadius: "var(--radius-md)",
        boxShadow: "none",
        cursor: "pointer",
        transition: "background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)",
        ...style,
      }}
    >
      <span style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: "17px", color: "var(--text-strong)" }}>{label}</span>
        {desc && <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-faint)" }}>{desc}</span>}
      </span>
      <span
        style={{
          flexShrink: 0,
          width: 14,
          height: 14,
          borderRadius: "1px",
          border: `1px solid ${selected ? "var(--text-strong)" : "var(--border-strong)"}`,
          background: selected ? "var(--text-strong)" : "transparent",
          transition: "all var(--dur-base) var(--ease-out)",
        }}
      />
    </button>
  );
}
