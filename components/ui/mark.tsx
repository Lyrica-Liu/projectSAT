import { useId } from "react";
import { GLYPH_ASPECT, GLYPH_GRADIENT, GLYPH_INFINITY, GLYPH_STROKE, GLYPH_VIEWBOX } from "@/lib/brand-glyph";

/**
 * The 800Path logo inside the app: a free-standing coral → violet ∞, no tile. `height` is in px. Decorative: it always sits next to the "800Path" name.
 */
export function Mark({ height = 20 }: { height?: number }) {
  const id = useId();
  return (
    <svg viewBox={GLYPH_VIEWBOX} height={height} width={height * GLYPH_ASPECT} style={{ flexShrink: 0, display: "block" }} aria-hidden="true">
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="4" y1="0" x2="136" y2="0">
          <stop offset="0" stopColor={GLYPH_GRADIENT[0]} />
          <stop offset=".5" stopColor={GLYPH_GRADIENT[1]} />
          <stop offset="1" stopColor={GLYPH_GRADIENT[2]} />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${id})`} strokeWidth={GLYPH_STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d={GLYPH_INFINITY} />
      </g>
    </svg>
  );
}
