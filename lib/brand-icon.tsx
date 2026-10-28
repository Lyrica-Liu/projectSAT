import { ImageResponse } from "next/og";

/** The 800Path mark (components/ui/mark.tsx) in bone on ink, as a square app icon PNG. */
export function brandIcon(size: number, { rounded = false } = {}) {
  const markWidth = Math.round(size * 0.78);
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#201f1c", borderRadius: rounded ? size * 0.22 : 0,
      }}>
        <svg viewBox="0 0 230 140" width={markWidth} height={Math.round(markWidth * 140 / 230)}>
          <g transform="translate(22,0) skewX(-10)" fill="#f6f4ef">
            <path d="M40,44 A20,22 0 1 1 80,44 A20,22 0 1 1 40,44 ZM47,41 A11,12 0 1 0 69,41 A11,12 0 1 0 47,41 ZM31,90 A27,28 0 1 1 85,90 A27,28 0 1 1 31,90 ZM40,86 A16,16 0 1 0 72,86 A16,16 0 1 0 40,86 ZM96,92 A22,26 0 1 1 140,92 A22,26 0 1 1 96,92 ZM105,88 A13,16 0 1 0 131,88 A13,16 0 1 0 105,88 ZM150,92 A22,26 0 1 1 194,92 A22,26 0 1 1 150,92 ZM159,88 A13,16 0 1 0 185,88 A13,16 0 1 0 159,88 ZM70,100 C80,112 96,108 106,100 C98,104 84,105 74,94 ZM132,101 C140,111 152,111 160,101 C152,106 141,106 135,96 ZM186,98 C198,94 204,84 203,73 C199,83 196,90 184,94 ZM40,29 C45,22 54,19 61,21 C54,23 48,26 44,32 Z" />
          </g>
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
