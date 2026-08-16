import React from "react";

/**
 * 800Path Button — charcoal ink fill, crisp small radius, no shadow.
 * primary: solid charcoal. secondary: hairline outline on bone.
 * ghost: text only. soft: sunken bone fill.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  full = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  onClick,
  type = "button",
  style = {},
  ...rest
}) {
  const sizes = {
    sm: { padding: "9px 16px", fontSize: "13px", gap: "7px" },
    md: { padding: "12px 22px", fontSize: "14px", gap: "8px" },
    lg: { padding: "15px 30px", fontSize: "14px", gap: "9px" },
  };

  const variants = {
    primary: { background: "var(--brand)", color: "var(--text-on-brand)", border: "1px solid var(--brand)" },
    secondary: { background: "transparent", color: "var(--text-strong)", border: "1px solid var(--border-strong)" },
    ghost: { background: "transparent", color: "var(--text-muted)", border: "1px solid transparent" },
    soft: { background: "var(--surface-sunken)", color: "var(--text-strong)", border: "1px solid transparent" },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: sizes[size].gap,
        padding: sizes[size].padding,
        width: full ? "100%" : "auto",
        fontFamily: "var(--font-sans)",
        fontWeight: "var(--weight-medium)",
        fontSize: sizes[size].fontSize,
        lineHeight: 1,
        letterSpacing: "0.01em",
        borderRadius: "var(--radius-lg)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        boxShadow: "none",
        transition: "background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)",
        ...variants[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "primary") e.currentTarget.style.background = "var(--brand-hover)";
        if (variant === "secondary") e.currentTarget.style.borderColor = "var(--text-strong)";
        if (variant === "ghost") e.currentTarget.style.color = "var(--text-strong)";
      }}
      onMouseLeave={(e) => {
        if (variant === "primary") e.currentTarget.style.background = "var(--brand)";
        if (variant === "secondary") e.currentTarget.style.borderColor = "var(--border-strong)";
        if (variant === "ghost") e.currentTarget.style.color = "var(--text-muted)";
      }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
