import { ImageResponse } from "next/og";
import { GLYPH_ASPECT, GLYPH_GRADIENT, GLYPH_INFINITY, GLYPH_STROKE, GLYPH_VIEWBOX } from "@/lib/brand-glyph";

/**
 * The app icon: a white ∞ on Lite's coral → rose → violet gradient. Used for the browser tab, the iPhone home screen and the install manifest.
 */
export function brandIcon(size: number, { rounded = false } = {}) {
  const glyph = Math.round(size * 0.62);
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(135deg, ${GLYPH_GRADIENT[0]} 0%, ${GLYPH_GRADIENT[1]} 50%, ${GLYPH_GRADIENT[2]} 100%)`,
        borderRadius: rounded ? size * 0.22 : 0,
      }}>
        <svg viewBox={GLYPH_VIEWBOX} width={glyph} height={Math.round(glyph / GLYPH_ASPECT)}>
          <g fill="none" stroke="#ffffff" strokeWidth={GLYPH_STROKE} strokeLinecap="round" strokeLinejoin="round">
            <path d={GLYPH_INFINITY} />
          </g>
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
