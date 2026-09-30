"use client";

import { Icon } from "@/components/ui/icon";

/**
 * Desmos's Digital SAT build — the same graphing calculator Bluebook embeds, with the features
 * the College Board disables (e.g. some sharing/actions) already turned off.
 */
const DESMOS_SAT_URL = "https://www.desmos.com/testing/cb-digital-sat/graphing";

const panelHeader: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
  padding: "10px 12px 10px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)",
  fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)",
};

function CloseButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} style={{
      width: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center",
      border: "1px solid var(--border)", background: "transparent", borderRadius: "var(--radius-sm)",
      color: "var(--text-muted)", cursor: "pointer", padding: 0,
    }}>
      <Icon name="x" size={14} />
    </button>
  );
}

/**
 * Docked to the right edge, below the session header. Stays mounted while hidden (just
 * display:none) so closing and reopening it keeps the student's expressions, like Bluebook.
 */
export function DesmosPanel({ open, expanded, onToggleExpand, onClose }: {
  open: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
}) {
  return (
    <aside
      aria-label="Graphing calculator"
      aria-hidden={!open}
      style={{
        display: open ? "flex" : "none", flexDirection: "column",
        position: "fixed", top: 108, right: 16, bottom: 16, zIndex: 30,
        width: expanded ? "min(760px, calc(100vw - 32px))" : "min(420px, calc(100vw - 32px))",
        background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-lg)",
        boxShadow: "0 18px 50px rgba(32,31,28,.18)", overflow: "hidden",
      }}
    >
      <div style={panelHeader}>
        <span>Calculator</span>
        <span style={{ display: "inline-flex", gap: 6 }}>
          <button onClick={onToggleExpand} style={{
            border: "1px solid var(--border)", background: "transparent", borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)", cursor: "pointer", padding: "4px 10px",
          }}>
            {expanded ? "Collapse" : "Expand"}
          </button>
          <CloseButton onClick={onClose} label="Close calculator" />
        </span>
      </div>
      <iframe
        src={DESMOS_SAT_URL}
        title="Desmos graphing calculator"
        style={{ flex: 1, width: "100%", border: 0, background: "#fff" }}
      />
    </aside>
  );
}

const REFERENCE_SHAPES: { name: string; formulas: string[]; note: string }[] = [
  { name: "Circle", formulas: ["A = πr²", "C = 2πr"], note: "r = radius" },
  { name: "Rectangle", formulas: ["A = ℓw"], note: "ℓ = length, w = width" },
  { name: "Triangle", formulas: ["A = ½bh"], note: "b = base, h = height" },
  { name: "Right triangle", formulas: ["c² = a² + b²"], note: "c = hypotenuse, a and b = legs" },
  { name: "30°–60°–90° triangle", formulas: ["sides x, x√3, 2x"], note: "x is opposite 30°, x√3 opposite 60°, 2x opposite 90°" },
  { name: "45°–45°–90° triangle", formulas: ["sides s, s, s√2"], note: "s√2 is the hypotenuse" },
  { name: "Rectangular prism", formulas: ["V = ℓwh"], note: "h = height" },
  { name: "Cylinder", formulas: ["V = πr²h"], note: "r = radius of base" },
  { name: "Sphere", formulas: ["V = ⁴⁄₃πr³"], note: "r = radius" },
  { name: "Cone", formulas: ["V = ⅓πr²h"], note: "r = radius of base" },
  { name: "Pyramid", formulas: ["V = ⅓ℓwh"], note: "ℓw = area of rectangular base" },
];

const REFERENCE_FACTS = [
  "The number of degrees of arc in a circle is 360.",
  "The number of radians of arc in a circle is 2π.",
  "The sum of the measures in degrees of the angles of a triangle is 180.",
];

/** The Digital SAT's math reference sheet — the same formulas and facts Bluebook provides. */
export function ReferenceSheetPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <aside
      aria-label="Math reference sheet"
      style={{
        display: "flex", flexDirection: "column",
        position: "fixed", top: 108, left: 16, bottom: 16, zIndex: 30,
        width: "min(400px, calc(100vw - 32px))",
        background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-lg)",
        boxShadow: "0 18px 50px rgba(32,31,28,.18)", overflow: "hidden",
      }}
    >
      <div style={panelHeader}>
        <span>Reference</span>
        <CloseButton onClick={onClose} label="Close reference sheet" />
      </div>
      <div style={{ overflowY: "auto", padding: "4px 18px 18px" }}>
        {REFERENCE_SHAPES.map((s) => (
          <div key={s.name} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 15, color: "var(--text-strong)" }}>{s.name}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text-strong)", textAlign: "right" }}>
                {s.formulas.join("   ")}
              </span>
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", margin: "4px 0 0" }}>{s.note}</p>
          </div>
        ))}
        <ul style={{ margin: "14px 0 0", padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 6 }}>
          {REFERENCE_FACTS.map((f) => (
            <li key={f} style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text-body)" }}>{f}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
