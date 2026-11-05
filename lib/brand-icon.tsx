import { ImageResponse } from "next/og";

/**
 * The app icon: "∞00" (800 with the 8 turned on its side) in white on Lite's coral → rose →
 * violet gradient. Used for the browser tab, the iPhone home screen and the install manifest.
 */
export function brandIcon(size: number, { rounded = false } = {}) {
  const glyph = Math.round(size * 0.74);
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #f0664f 0%, #e04a73 50%, #8458e8 100%)",
        borderRadius: rounded ? size * 0.22 : 0,
      }}>
        <svg viewBox="0 0 300 120" width={glyph} height={Math.round(glyph * 120 / 300)}>
          <g fill="none" stroke="#ffffff" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round">
            {/* ∞: two loops crossing at the centre */}
            <path d="M80 60 C 100 26, 140 26, 140 60 C 140 94, 100 94, 80 60 C 60 26, 20 26, 20 60 C 20 94, 60 94, 80 60 Z" />
            {/* 0 0 */}
            <ellipse cx="190" cy="60" rx="25" ry="33" />
            <ellipse cx="258" cy="60" rx="25" ry="33" />
          </g>
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
