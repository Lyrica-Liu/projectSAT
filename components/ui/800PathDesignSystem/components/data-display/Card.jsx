import React from "react";

/**
 * Card — the core surface. Soft white, rounded, hairline border with an
 * optional low shadow. `tone` swaps the fill to a pastel accent; `brand`
 * makes a filled lilac hero card.
 */
export function Card({
  children,
  tone = "surface",
  padding = "lg",
  radius = "lg",
  shadow = "sm",
  interactive = false,
  style = {},
  ...rest
}) {
  const pads = { none: 0, sm: "var(--space-4)", md: "var(--space-5)", lg: "var(--space-6)", xl: "var(--space-8)" };
  const radii = { md: "var(--radius-md)", lg: "var(--radius-lg)", xl: "var(--radius-xl)", "2xl": "var(--radius-2xl)" };
  const shadows = { none: "none", xs: "var(--shadow-xs)", sm: "var(--shadow-sm)", md: "var(--shadow-md)", lg: "var(--shadow-lg)" };

  const tones = {
    surface: { background: "var(--surface-card)", border: "1px solid var(--border)", color: "var(--text-body)" },
    sunken:  { background: "var(--surface-sunken)", border: "1px solid transparent", color: "var(--text-body)" },
    brand:   { background: "var(--brand)", border: "1px solid transparent", color: "var(--text-on-brand)" },
    lilac:   { background: "var(--lilac-50)", border: "1px solid var(--lilac-100)", color: "var(--brand-ink)" },
    mint:    { background: "var(--mint-surface)", border: "1px solid transparent", color: "var(--mint-ink)" },
    sky:     { background: "var(--sky-surface)", border: "1px solid transparent", color: "var(--sky-ink)" },
    rose:    { background: "var(--rose-surface)", border: "1px solid transparent", color: "var(--rose-ink)" },
  };

  return (
    <div
      style={{
        padding: pads[padding],
        borderRadius: radii[radius],
        boxShadow: shadows[shadow],
        transition: interactive
          ? "transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)"
          : "none",
        cursor: interactive ? "pointer" : "default",
        ...tones[tone],
        ...style,
      }}
      onMouseEnter={interactive ? (e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      } : undefined}
      onMouseLeave={interactive ? (e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = shadows[shadow];
      } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}
