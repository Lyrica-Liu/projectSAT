/**
 * The 800Path app mark — a joined "800" ribbon, drawn as one filled SVG path.
 * Takes color from `fill` (defaults to currentColor) so it inverts to bone on
 * ink and stays ink on oat, per the design system's brand-logo guideline.
 */
export function Mark({ width = 30, height = 18, fill = "currentColor" }: { width?: number; height?: number; fill?: string }) {
  return (
    <svg viewBox="0 0 230 140" width={width} height={height} style={{ flexShrink: 0 }}>
      <g transform="translate(22,0) skewX(-10)" fill={fill}>
        <path d="M40,44 A20,22 0 1 1 80,44 A20,22 0 1 1 40,44 ZM47,41 A11,12 0 1 0 69,41 A11,12 0 1 0 47,41 ZM31,90 A27,28 0 1 1 85,90 A27,28 0 1 1 31,90 ZM40,86 A16,16 0 1 0 72,86 A16,16 0 1 0 40,86 ZM96,92 A22,26 0 1 1 140,92 A22,26 0 1 1 96,92 ZM105,88 A13,16 0 1 0 131,88 A13,16 0 1 0 105,88 ZM150,92 A22,26 0 1 1 194,92 A22,26 0 1 1 150,92 ZM159,88 A13,16 0 1 0 185,88 A13,16 0 1 0 159,88 ZM70,100 C80,112 96,108 106,100 C98,104 84,105 74,94 ZM132,101 C140,111 152,111 160,101 C152,106 141,106 135,96 ZM186,98 C198,94 204,84 203,73 C199,83 196,90 184,94 ZM40,29 C45,22 54,19 61,21 C54,23 48,26 44,32 Z" />
      </g>
    </svg>
  );
}
