import React from "react";

/**
 * IconButton — square, rounded, icon-only control. Pass a Lucide icon
 * (or any node) as children. Used for nav, close, toolbar actions.
 */
export function IconButton({
  children,
  variant = "ghost",
  size = "md",
  label,
  disabled = false,
  onClick,
  style = {},
  ...rest
}) {
  const sizes = { sm: 32, md: 38, lg: 44 };
  const dim = sizes[size];

  const variants = {
    ghost: { background: "transparent", color: "var(--text-muted)", border: "1px solid transparent" },
    surface: { background: "var(--surface-card)", color: "var(--text-strong)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow-xs)" },
    soft: { background: "var(--brand-soft)", color: "var(--brand-ink)", border: "1px solid transparent" },
  };

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: dim,
        height: dim,
        borderRadius: "var(--radius-md)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)",
        ...variants[variant],
        ...style,
      }}
      onMouseEnter={(e) => { if (variant === "ghost" && !disabled) e.currentTarget.style.background = "var(--surface-sunken)"; }}
      onMouseLeave={(e) => { if (variant === "ghost") e.currentTarget.style.background = "transparent"; }}
      {...rest}
    >
      {children}
    </button>
  );
}
