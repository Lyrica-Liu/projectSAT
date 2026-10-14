"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { DOMAINS } from "@/lib/categories";
import { DIFFICULTY_LABELS } from "@/lib/plan";
import type { CategoryMastery } from "@/lib/mastery";
import { LEVEL_LABEL, LEVEL_STYLE } from "./practice";
import { ErrorLine, MapLegend, SkillMap, skillAriaLabel, useStartSet, type Tiers } from "./skill-map";

// ── Tree ─────────────────────────────────────────────────────────────────────

type Kind = "root" | "subject" | "domain" | "skill";
interface TNode {
  id: string;
  kind: Kind;
  label: string;
  side: "left" | "right" | "center";
  depth: number;
  children: TNode[];
  m?: CategoryMastery;
}

/** "Your SAT" → Reading & Writing (left) → domains → skills; → Math (right) → skills. */
function buildTree(mastery: CategoryMastery[]): TNode {
  const bySub = new Map(mastery.map((m) => [m.subcategory, m]));
  const skill = (m: CategoryMastery, side: "left" | "right", depth: number): TNode =>
    ({ id: m.subcategory, kind: "skill", label: m.subcategory, side, depth, children: [], m });

  const rwDomains = DOMAINS.filter((d) => d.subject === "Reading & Writing").map((d) => ({
    id: `domain:${d.domain}`, kind: "domain" as const, label: d.domain, side: "left" as const, depth: 2,
    children: d.categories.map((c) => bySub.get(c.subcategory)).filter((m): m is CategoryMastery => !!m).map((m) => skill(m, "left", 3)),
  })).filter((d) => d.children.length > 0);
  const mathSkills = DOMAINS.filter((d) => d.subject === "Math")
    .flatMap((d) => d.categories.map((c) => bySub.get(c.subcategory)).filter((m): m is CategoryMastery => !!m))
    .map((m) => skill(m, "right", 2));

  const children: TNode[] = [];
  if (rwDomains.length) children.push({ id: "subject:rw", kind: "subject", label: "Reading & Writing", side: "left", depth: 1, children: rwDomains });
  if (mathSkills.length) children.push({ id: "subject:math", kind: "subject", label: "Math", side: "right", depth: 1, children: mathSkills });
  return { id: "root", kind: "root", label: "Your SAT", side: "center", depth: 0, children };
}

const skillsUnder = (n: TNode): CategoryMastery[] => n.m ? [n.m] : n.children.flatMap(skillsUnder);

// ── Layout (canvas px; root at 0,0) ──────────────────────────────────────────

const SIZE: Record<Kind, { w: number; h: number }> = {
  root: { w: 136, h: 64 }, subject: { w: 140, h: 42 }, domain: { w: 156, h: 36 }, skill: { w: 214, h: 38 },
};
/** Center x of each depth, per side. */
const X = { left: [0, -210, -420, -660], right: [0, 200, 440] };
const ROW = 46;
const COLLAPSED_ROW = 54;
const GROUP_GAP = 18;

interface Placed { node: TNode; x: number; y: number; w: number; h: number; collapsed: boolean }

function layout(root: TNode, collapsed: Set<string>) {
  const placed: Placed[] = [];
  const edges: { from: Placed; to: Placed }[] = [];

  function placeSide(top: TNode) {
    let cursor = 0;
    const out: Placed[] = [];
    function place(n: TNode, isFirstSibling: boolean): Placed {
      const side = n.side === "left" ? "left" : "right";
      const x = X[side][n.depth];
      const size = SIZE[n.kind];
      const isCollapsed = collapsed.has(n.id) && n.children.length > 0;
      if (n.kind === "domain" && !isFirstSibling) cursor += GROUP_GAP;
      let y: number;
      const kids: Placed[] = [];
      if (n.children.length === 0 || isCollapsed) {
        const h = isCollapsed ? COLLAPSED_ROW : ROW;
        y = cursor + h / 2;
        cursor += h;
      } else {
        n.children.forEach((c, i) => kids.push(place(c, i === 0)));
        y = (kids[0].y + kids[kids.length - 1].y) / 2;
      }
      const p: Placed = { node: n, x, y, w: size.w, h: isCollapsed && n.kind !== "subject" ? size.h + 8 : size.h, collapsed: isCollapsed };
      out.push(p);
      kids.forEach((k) => edges.push({ from: p, to: k }));
      return p;
    }
    const subject = place(top, true);
    // Center this side's subject on the root.
    const dy = -subject.y;
    out.forEach((p) => { p.y += dy; });
    placed.push(...out);
    return subject;
  }

  const rootPlaced: Placed = { node: root, x: 0, y: 0, ...SIZE.root, collapsed: false };
  placed.push(rootPlaced);
  for (const subject of root.children) edges.push({ from: rootPlaced, to: placeSide(subject) });

  const minX = Math.min(...placed.map((p) => p.x - p.w / 2)) - 40;
  const maxX = Math.max(...placed.map((p) => p.x + p.w / 2)) + 40;
  const minY = Math.min(...placed.map((p) => p.y - p.h / 2)) - 40;
  const maxY = Math.max(...placed.map((p) => p.y + p.h / 2)) + 40;
  return { placed, edges, bounds: { minX, minY, width: maxX - minX, height: maxY - minY } };
}

const EDGE: Record<CategoryMastery["level"], { stroke: string; dash?: string }> = {
  not_started: { stroke: "var(--line-strong)", dash: "4 4" },
  weak: { stroke: "var(--claret-500)" },
  strong: { stroke: "var(--moss-500)" },
  mastered: { stroke: "var(--moss-600)" },
};

function edgePath(from: Placed, to: Placed): string {
  const left = to.x < from.x;
  const x1 = left ? from.x - from.w / 2 : from.x + from.w / 2;
  const x2 = left ? to.x + to.w / 2 : to.x - to.w / 2;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${from.y} C ${mx} ${from.y}, ${mx} ${to.y}, ${x2} ${to.y}`;
}

/** Shorter names so every node fits; the full name is in the tooltip and aria-label. */
const SHORT_NAME: Record<string, string> = {
  "Central Ideas and Details": "Central Ideas",
  "Command of Evidence (Textual)": "Evidence: Textual",
  "Command of Evidence (Quantitative)": "Evidence: Quantitative",
  "Text Structure and Purpose": "Text Structure",
  "Cross-Text Connections": "Cross-Text",
  "Form, Structure, and Sense": "Form, Structure, Sense",
};

function summary(skills: CategoryMastery[]): string {
  const weak = skills.filter((m) => m.level === "weak").length;
  const fresh = skills.filter((m) => m.level === "not_started").length;
  return `${skills.length} skills${weak ? ` · ${weak} weak` : fresh === skills.length ? " · new" : ""}`;
}

// ── Pan & zoom ───────────────────────────────────────────────────────────────

const MIN_K = 0.3;
const MAX_K = 2.5;
const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));
/** Below this, "fit everything" is unreadable — open zoomed in on the center instead. */
const READABLE_K = 0.62;
interface View { k: number; tx: number; ty: number }

/** Mind map canvas. `mode="full"` fills its container and lets the plain scroll wheel pan. */
export function MindMap({ mastery, tiers, mode, height }: { mastery: CategoryMastery[]; tiers: Tiers; mode: "inline" | "full"; height?: number }) {
  const { starting, error, start } = useStartSet(tiers);
  const tree = useMemo(() => buildTree(mastery), [mastery]);
  const groupIds = useMemo(() => {
    const ids: string[] = [];
    const walk = (n: TNode) => { if (n.kind === "subject" || n.kind === "domain") ids.push(n.id); n.children.forEach(walk); };
    walk(tree);
    return ids;
  }, [tree]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const { placed, edges, bounds } = useMemo(() => layout(tree, collapsed), [tree, collapsed]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ k: 1, tx: 0, ty: 0 });
  /** Until the student pans or zooms, keep the map fitted as the viewport settles or resizes. */
  const touched = useRef(false);

  const fitTo = useCallback((b: ReturnType<typeof layout>["bounds"]) => {
    const el = viewportRef.current;
    if (!el) return;
    const { width, height: h } = el.getBoundingClientRect();
    if (!width || !h) return;
    const k = clampK(Math.min(width / b.width, h / b.height, 1.15) * 0.94);
    if (k < READABLE_K) {
      // Too small to read (a phone): open at a readable zoom centered on "Your SAT".
      setView({ k: READABLE_K, tx: width / 2 + b.minX * READABLE_K, ty: h / 2 + b.minY * READABLE_K });
    } else {
      setView({ k, tx: (width - b.width * k) / 2, ty: (h - b.height * k) / 2 });
    }
  }, []);
  const fit = useCallback(() => fitTo(bounds), [fitTo, bounds]);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    fit();
    const ro = new ResizeObserver(() => { if (!touched.current) fit(); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  /** Expand all / Collapse all move every node, so fit the new layout right away. */
  function setAllCollapsed(next: Set<string>) {
    setCollapsed(next);
    touched.current = false;
    fitTo(layout(tree, next).bounds);
  }

  const zoomAt = useCallback((factor: number, px?: number, py?: number) => {
    const el = viewportRef.current;
    if (!el) return;
    touched.current = true;
    const rect = el.getBoundingClientRect();
    const cx = px ?? rect.width / 2;
    const cy = py ?? rect.height / 2;
    setView((v) => {
      const k = clampK(v.k * factor);
      return { k, tx: cx - (cx - v.tx) * (k / v.k), ty: cy - (cy - v.ty) * (k / v.k) };
    });
  }, []);

  // Wheel: pinch / Ctrl+wheel zooms; in full-screen, plain wheel pans. (Non-passive to stop page zoom/scroll.)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = el!.getBoundingClientRect();
        zoomAt(Math.exp(-e.deltaY * 0.0025), e.clientX - rect.left, e.clientY - rect.top);
      } else if (mode === "full") {
        e.preventDefault();
        touched.current = true;
        setView((v) => ({ ...v, tx: v.tx - e.deltaX, ty: v.ty - e.deltaY }));
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [mode, zoomAt]);

  // Drag to pan, two fingers to pinch. A drag never counts as a click on a node.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragged = useRef(false);
  const pinchStart = useRef<{ dist: number; k: number } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), k: view.k };
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (Math.abs(dx) + Math.abs(dy) > 0) {
      if (!dragged.current && Math.hypot(dx, dy) < 3) return;
      if (!dragged.current) {
        dragged.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
    }
    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const rect = viewportRef.current!.getBoundingClientRect();
      const target = clampK(pinchStart.current.k * (Math.hypot(a.x - b.x, a.y - b.y) / pinchStart.current.dist));
      zoomAt(target / view.k, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
    } else if (pointers.current.size === 1 && dragged.current) {
      touched.current = true;
      setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }));
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
  }
  function onClickCapture(e: React.MouseEvent) {
    if (dragged.current) { e.stopPropagation(); e.preventDefault(); dragged.current = false; }
  }

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const started = mastery.filter((m) => m.level !== "not_started").length;
  const at = (p: Placed): React.CSSProperties => ({
    position: "absolute", left: p.x - p.w / 2 - bounds.minX, top: p.y - p.h / 2 - bounds.minY, width: p.w, height: p.h,
    transition: "left .28s ease, top .28s ease",
  });

  const controlButton: React.CSSProperties = {
    minWidth: 32, height: 32, padding: "0 10px", border: "1px solid var(--border)", background: "var(--surface)",
    borderRadius: "var(--radius-md)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: mode === "full" ? "100%" : undefined }}>
      <ErrorLine error={error} />
      <style>{`
        .mm-node { transition: left .28s ease, top .28s ease, transform .12s ease, box-shadow .12s ease; }
        .mm-skill:not(:disabled):hover { transform: scale(1.04); box-shadow: 0 6px 18px rgba(32,31,28,.12); }
        .mm-edge { transition: d .28s ease; }
        @media (max-width: 760px) { .mm-hint, .mm-legend-full { display: none !important; } }
      `}</style>
      <div
        ref={viewportRef}
        role="group"
        aria-label="Skill mind map"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        style={{
          position: "relative", overflow: "hidden", flex: mode === "full" ? 1 : undefined, height: mode === "full" ? undefined : height ?? 620,
          borderRadius: mode === "full" ? 0 : "var(--radius-xl)", border: mode === "full" ? "none" : "1px solid var(--border)",
          background: "var(--canvas)", touchAction: "none", cursor: "grab", userSelect: "none",
          backgroundImage: "radial-gradient(var(--surface-2) 1px, transparent 1px)", backgroundSize: `${22 * view.k}px ${22 * view.k}px`,
          backgroundPosition: `${view.tx}px ${view.ty}px`,
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: bounds.width, height: bounds.height, transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.k})`, transformOrigin: "0 0" }}>
          <svg aria-hidden width={bounds.width} height={bounds.height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <g transform={`translate(${-bounds.minX} ${-bounds.minY})`}>
              {edges.map(({ from, to }) => {
                const look = to.node.m ? EDGE[to.node.m.level] : { stroke: "var(--line-strong)" as string, dash: undefined };
                const width = to.node.kind === "subject" ? 2.6 : to.node.kind === "domain" ? 1.9 : 1.5;
                return <path key={to.node.id} className="mm-edge" d={edgePath(from, to)} fill="none" stroke={look.stroke} strokeWidth={width} strokeDasharray={look.dash} strokeLinecap="round" />;
              })}
            </g>
          </svg>

          {placed.map((p) => {
            const n = p.node;
            if (n.kind === "root") {
              return (
                <div key={n.id} className="mm-node" style={{ ...at(p), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 999, background: "var(--brand)", color: "var(--text-on-brand)", boxShadow: "0 10px 26px rgba(32,31,28,.16)" }}>
                  <span style={{ fontSize: 17, letterSpacing: "-0.01em" }}>Your SAT</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, opacity: 0.75, marginTop: 2 }}>{started} of {mastery.length} started</span>
                </div>
              );
            }

            if (n.kind === "skill" && n.m) {
              const m = n.m;
              const look = LEVEL_STYLE[m.level];
              const tier = tiers[m.subcategory];
              const busy = starting === m.subcategory;
              return (
                <button
                  key={n.id}
                  className="mm-node mm-skill"
                  onClick={() => start(m)}
                  disabled={!!starting}
                  aria-label={skillAriaLabel(m)}
                  title={`${m.subcategory} — ${LEVEL_LABEL[m.level]}${tier && m.level !== "not_started" ? ` · ${DIFFICULTY_LABELS[tier]}` : ""}`}
                  style={{
                    ...at(p), display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0 12px",
                    borderRadius: 999, cursor: starting ? "default" : "pointer", textAlign: "left",
                    background: look.background, border: look.border, color: look.ink, opacity: busy ? 0.6 : m.estimate ? 0.78 : 1,
                  }}
                >
                  <span style={{ fontSize: 13.5, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{SHORT_NAME[m.subcategory] ?? m.subcategory}</span>
                  <span style={{ flexShrink: 0, fontFamily: "var(--font-sans)", fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: look.sub }}>
                    {busy ? "Starting…" : m.level === "not_started" ? "New" : (tier ? DIFFICULTY_LABELS[tier] : LEVEL_LABEL[m.level])}
                  </span>
                </button>
              );
            }

            // Subject and domain nodes: click to collapse/expand their branch.
            const isSubject = n.kind === "subject";
            const outward = n.side === "left" ? "left" : "right";
            return (
              <button
                key={n.id}
                className="mm-node"
                onClick={() => toggle(n.id)}
                aria-expanded={!p.collapsed}
                aria-label={`${n.label}: ${p.collapsed ? "expand" : "collapse"} (${summary(skillsUnder(n))})`}
                style={{
                  ...at(p), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                  borderRadius: isSubject ? 999 : "var(--radius-md)", cursor: "pointer", padding: "0 10px",
                  background: isSubject ? "var(--surface)" : "var(--canvas)",
                  border: isSubject ? "1px solid var(--border-strong)" : p.collapsed ? "1px solid var(--border)" : "1px solid transparent",
                  color: "var(--text-strong)", textAlign: "center",
                }}
              >
                <span style={isSubject
                  ? { fontSize: 15, lineHeight: 1.1 }
                  : { fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", lineHeight: 1.25 }}>
                  {n.label}
                </span>
                {p.collapsed && (
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--text-faint)" }}>{summary(skillsUnder(n))}</span>
                )}
                <span aria-hidden style={{
                  position: "absolute", top: "50%", [outward]: -11, transform: "translateY(-50%)",
                  width: 18, height: 18, borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--surface)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1, color: "var(--text-muted)",
                }}>
                  {p.collapsed ? "+" : "−"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: "absolute", right: 12, bottom: 12, display: "flex", gap: 6, alignItems: "center" }}>
          <button style={controlButton} onClick={() => setAllCollapsed(new Set())} aria-label="Expand all">Expand all</button>
          <button style={controlButton} onClick={() => setAllCollapsed(new Set(groupIds.filter((id) => id.startsWith("domain:"))))} aria-label="Collapse all">Collapse all</button>
          <span style={{ width: 8 }} />
          <button style={controlButton} onClick={() => zoomAt(1 / 1.2)} aria-label="Zoom out">−</button>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", minWidth: 38, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{Math.round(view.k * 100)}%</span>
          <button style={controlButton} onClick={() => zoomAt(1.2)} aria-label="Zoom in">+</button>
          <button style={controlButton} onClick={() => { touched.current = false; fit(); }} aria-label="Fit to screen">Fit</button>
        </div>
        <p className="mm-hint" style={{ position: "absolute", left: 14, bottom: 14, margin: 0, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", pointerEvents: "none" }}>
          Drag to move · pinch or Ctrl + scroll to zoom{mode === "full" ? " · scroll to pan" : ""} · tap a branch to fold it
        </p>
      </div>
      {mode === "inline" && <MapLegend note="Faded nodes are early estimates" />}
    </div>
  );
}

// ── Full screen + responsive wrapper ─────────────────────────────────────────

const WIDE_QUERY = "(min-width: 900px)";
const subscribeWide = (cb: () => void) => {
  const mq = window.matchMedia(WIDE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * Home's skill map: the mind map inline on wide screens (tile grid on narrow ones), plus a
 * full-screen mode that covers the whole window. Esc closes it.
 */
export function SkillMapView({ mastery, tiers }: { mastery: CategoryMastery[]; tiers: Tiers }) {
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE_QUERY).matches, () => true);
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [full]);

  const openButton = (
    <button onClick={() => setFull(true)} style={{
      display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid var(--border-strong)", background: "var(--surface)",
      borderRadius: "var(--radius-md)", padding: "8px 14px", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-strong)",
    }}>
      <span aria-hidden>⤢</span> Full screen
    </button>
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "0 0 10px" }}>{openButton}</div>
      {wide ? <MindMap mastery={mastery} tiers={tiers} mode="inline" /> : <SkillMap mastery={mastery} tiers={tiers} />}

      {full && (
        <div role="dialog" aria-modal="true" aria-label="Skill map, full screen" style={{ position: "fixed", inset: 0, zIndex: 70, background: "var(--canvas)", display: "flex", flexDirection: "column", fontFamily: "var(--font-serif)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "10px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
            <span style={{ fontSize: 18, color: "var(--text-strong)" }}>Your skill map</span>
            <div className="mm-legend-full" style={{ marginTop: -22 }}><MapLegend note="Faded nodes are early estimates" /></div>
            <button onClick={() => setFull(false)} style={{
              border: "1px solid var(--border-strong)", background: "transparent", borderRadius: "var(--radius-md)", padding: "8px 14px",
              cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-strong)",
            }}>
              Close · Esc
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <MindMap mastery={mastery} tiers={tiers} mode="full" />
          </div>
        </div>
      )}
    </>
  );
}
