import React from "react";

/**
 * SegmentedControl — a hairline-ruled group of options. The active one is
 * filled charcoal; no pills, no track shadow.
 */
export function SegmentedControl({ options, value, onChange, size = "md", style = {} }) {
  const pad = size === "sm" ? "8px 14px" : "10px 18px";
  const fontSize = size === "sm" ? "12px" : "13px";

  return (
    <div
      style={{
        display: "inline-flex",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        ...style,
      }}
    >
      {options.map((opt, i) => {
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
              fontWeight: "var(--weight-medium)",
              letterSpacing: "0.01em",
              color: active ? "var(--text-on-brand)" : "var(--text-muted)",
              background: active ? "var(--brand)" : "transparent",
              border: "0",
              borderLeft: i === 0 ? "0" : "1px solid var(--border-strong)",
              cursor: "pointer",
              transition: "background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
