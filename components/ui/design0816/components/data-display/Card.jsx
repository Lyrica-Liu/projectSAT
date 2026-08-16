import React from "react";

/**
 * Card — a bone surface with a hairline rule. No shadow by default;
 * separation comes from the rule and the space around it.
 */
export function Card({
  children,
  tone = "surface",
  padding = "lg",
  radius = "lg",
  shadow = "none",
  interactive = false,
  style = {},
  ...rest
}) {
  const pads = { none: 0, sm: "var(--space-4)", md: "var(--space-5)", lg: "var(--space-8)", xl: "var(--space-10)" };
  const radii = { md: "var(--radius-md)", lg: "var(--radius-lg)", xl: "var(--radius-xl)", "2xl": "var(--radius-2xl)" };
  const shadows = { none: "none", xs: "none", sm: "none", md: "var(--shadow-md)", lg: "var(--shadow-lg)" };

  const tones = {
    surface: { background: "var(--surface-card)", border: "1px solid var(--border)", color: "var(--text-body)" },
    sunken:  { background: "var(--surface-sunken)", border: "1px solid transparent", color: "var(--text-body)" },
    brand:   { background: "var(--dark-900)", border: "1px solid transparent", color: "var(--text-on-dark)" },
    lilac:   { background: "var(--surface-sunken)", border: "1px solid var(--border)", color: "var(--text-strong)" },
    mint:    { background: "var(--moss-50)", border: "1px solid transparent", color: "var(--moss-600)" },
    sky:     { background: "var(--slate-50)", border: "1px solid transparent", color: "var(--slate-500)" },
    rose:    { background: "var(--claret-50)", border: "1px solid transparent", color: "var(--claret-600)" },
  };

  return (
    <div
      style={{
        padding: pads[padding],
        borderRadius: radii[radius],
        boxShadow: shadows[shadow],
        transition: interactive ? "border-color var(--dur-base) var(--ease-out)" : "none",
        cursor: interactive ? "pointer" : "default",
        ...tones[tone],
        ...style,
      }}
      onMouseEnter={interactive ? (e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; } : undefined}
      onMouseLeave={interactive ? (e) => { e.currentTarget.style.borderColor = tones[tone].border.includes("transparent") ? "transparent" : "var(--border)"; } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}
