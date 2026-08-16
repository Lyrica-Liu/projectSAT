import React from "react";

/**
 * Input — a ruled field on bone. Label in tracked micro-sans, value in
 * the reading serif, charcoal underline on focus.
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
    <div style={{ display: "flex", flexDirection: "column", gap: "9px", width: "100%" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "11px",
            fontWeight: "var(--weight-medium)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
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
          fontFamily: "var(--font-serif)",
          fontSize: "17px",
          color: "var(--text-strong)",
          background: "transparent",
          border: "0",
          borderBottom: `1px solid ${focused ? "var(--text-strong)" : "var(--border-strong)"}`,
          borderRadius: "0",
          padding: "10px 2px",
          outline: "none",
          transition: "border-color var(--dur-base) var(--ease-out)",
          ...style,
        }}
        {...rest}
      />
      {hint && <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-faint)" }}>{hint}</span>}
    </div>
  );
}
