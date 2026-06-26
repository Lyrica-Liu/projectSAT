import React from "react";

/**
 * Input — labeled text field with soft rounded border and lilac focus ring.
 */
export function Input({
  label,
  hint,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  id,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "7px", width: "100%" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--text-body)",
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-sm)",
          color: "var(--text-strong)",
          background: disabled ? "var(--surface-sunken)" : "var(--surface-card)",
          border: `1px solid ${focused ? "var(--brand)" : "var(--border-strong)"}`,
          borderRadius: "var(--radius-md)",
          padding: "11px 14px",
          outline: "none",
          boxShadow: focused ? "0 0 0 4px var(--focus-ring)" : "none",
          transition: "border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
          ...style,
        }}
        {...rest}
      />
      {hint && (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>{hint}</span>
      )}
    </div>
  );
}
