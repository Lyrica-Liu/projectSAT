import React from "react";

/**
 * SegmentedControl — pill toggle group on a sunken track. Used for
 * sign in / sign up and other 2–3 option switches.
 */
export function SegmentedControl({ options, value, onChange, size = "md", style = {} }) {
  const pad = size === "sm" ? "6px 12px" : "8px 16px";
  const fontSize = size === "sm" ? "var(--text-xs)" : "var(--text-sm)";

  return (
    <div
      style={{
        display: "inline-flex",
        padding: "4px",
        gap: "4px",
        background: "var(--surface-sunken)",
        borderRadius: "var(--radius-pill)",
        ...style,
      }}
    >
      {options.map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const active = val === value;
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange && onChange(val)}
            style={{
              padding: pad,
              fontFamily: "var(--font-sans)",
              fontSize,
              fontWeight: "var(--weight-semibold)",
              color: active ? "var(--text-strong)" : "var(--text-muted)",
              background: active ? "var(--surface-card)" : "transparent",
              border: "none",
              borderRadius: "var(--radius-pill)",
              boxShadow: active ? "var(--shadow-sm)" : "none",
              cursor: "pointer",
              transition: "all var(--dur-base) var(--ease-out)",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
