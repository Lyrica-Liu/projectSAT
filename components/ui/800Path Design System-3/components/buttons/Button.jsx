import React from "react";

/**
 * 800Path Button — solid, confident brand color. Primary uses the navy
 * brand fill; secondary is a quiet outlined surface; soft is a tinted
 * brand surface; ghost is text-only.
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
    sm: { padding: "8px 14px", fontSize: "var(--text-sm)", gap: "6px" },
    md: { padding: "11px 20px", fontSize: "var(--text-sm)", gap: "8px" },
    lg: { padding: "14px 26px", fontSize: "var(--text-base)", gap: "8px" },
  };

  const variants = {
    primary: {
      background: "var(--brand)",
      color: "#fff",
      border: "1.5px solid var(--brand)",
      boxShadow: "0 4px 12px color-mix(in srgb, var(--brand) 28%, transparent)",
    },
    secondary: {
      background: "var(--surface)",
      color: "var(--text-strong)",
      border: "1.5px solid var(--border-strong)",
      boxShadow: "0 2px 6px rgba(20,20,30,0.06)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-muted)",
      border: "1px solid transparent",
      boxShadow: "none",
    },
    soft: {
      background: "var(--brand-soft)",
      color: "var(--brand-ink)",
      border: "1.5px solid transparent",
      boxShadow: "none",
    },
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
        fontWeight: "var(--weight-bold)",
        fontSize: sizes[size].fontSize,
        lineHeight: 1,
        letterSpacing: "var(--tracking-snug)",
        borderRadius: "var(--radius-lg)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "transform var(--dur-fast) var(--ease-out), background var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
        ...variants[variant],
        ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
