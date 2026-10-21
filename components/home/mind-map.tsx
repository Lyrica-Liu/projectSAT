"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { DOMAINS } from "@/lib/categories";
import { DIFFICULTY_LABELS } from "@/lib/plan";
import type { CategoryMastery } from "@/lib/mastery";
import type { SkillHistory } from "@/lib/server/mastery";
import { FOCUS_CSS, FocusCard } from "./mind-map-focus";
import { LEVEL_LABEL, LEVEL_STYLE } from "./practice";
import { ErrorLine, MapLegend, SkillMap, useStartSet, type Tiers } from "./skill-map";

// ── Tree ─────────────────────────────────────────────────────────────────────

type Kind = "root" | "subject" | "domain" | "skill";
type Side = "left" | "right";
interface TNode {
  id: string;
  kind: Kind;
  label: string;
  side: Side;
  depth: number;
  children: TNode[];
  parent?: TNode;
  m?: CategoryMastery;
}

/** "Your SAT" → Reading & Writing (left) → domains → skills; → Math (right) → skills. */
function buildTree(mastery: CategoryMastery[]): TNode {
  const bySub = new Map(mastery.map((m) => [m.subcategory, m]));
  const skill = (m: CategoryMastery, side: Side, depth: number): TNode =>
    ({ id: m.subcategory, kind: "skill", label: m.subcategory, side, depth, children: [], m });

  const rwDomains: TNode[] = DOMAINS.filter((d) => d.subject === "Reading & Writing").map((d) => ({
    id: `domain:${d.domain}`, kind: "domain" as const, label: d.domain, side: "left" as const, depth: 2,
    children: d.categories.map((c) => bySub.get(c.subcategory)).filter((m): m is CategoryMastery => !!m).map((m) => skill(m, "left", 3)),
  })).filter((d) => d.children.length > 0);
  const mathSkills = DOMAINS.filter((d) => d.subject === "Math")
    .flatMap((d) => d.categories.map((c) => bySub.get(c.subcategory)).filter((m): m is CategoryMastery => !!m))
    .map((m) => skill(m, "right", 2));

  const root: TNode = { id: "root", kind: "root", label: "Your SAT", side: "right", depth: 0, children: [] };
  if (rwDomains.length) root.children.push({ id: "subject:rw", kind: "subject", label: "Reading & Writing", side: "left", depth: 1, children: rwDomains });
  if (mathSkills.length) root.children.push({ id: "subject:math", kind: "subject", label: "Math", side: "right", depth: 1, children: mathSkills });
  const link = (n: TNode) => n.children.forEach((c) => { c.parent = n; link(c); });
  link(root);
  return root;
}

const skillsUnder = (n: TNode): CategoryMastery[] => n.m ? [n.m] : n.children.flatMap(skillsUnder);

// ── Radial layout (canvas px, "Your SAT" fixed at 0,0) ───────────────────────

/** Distance from the center at each depth, per side. */
const RADIUS: Record<Side, number[]> = { left: [0, 215, 430, 660], right: [0, 210, 430] };
/** How wide each side fans out, in degrees, at most — and per leaf. */
const MAX_SPAN: Record<Side, number> = { left: 128, right: 96 };
const DEG_PER_LEAF: Record<Side, number> = { left: 10.5, right: 22 };
const GROUP_GAP = 0.7; // extra leaf-slots between domains

const SKILL_W = 240;
const SKILL_H = 40;

interface Placed {
  node: TNode;
  /** Anchor point: node center, or for skills the end of the branch (the pill's inner edge). */
  x: number;
  y: number;
  angle: number;
  collapsed: boolean;
}

function layout(root: TNode, collapsed: Set<string>) {
  const placed = new Map<string, Placed>();
  placed.set(root.id, { node: root, x: 0, y: 0, angle: 0, collapsed: false });

  for (const subject of root.children) {
    const side = subject.side;
    // Leaves in order (a folded branch counts as one leaf), with a little air between domains.
    const slots: { node: TNode; at: number }[] = [];
    let cursor = 0;
    const walk = (n: TNode, first: boolean) => {
      const folded = collapsed.has(n.id) && n.children.length > 0;
      if (n.kind === "domain" && !first) cursor += GROUP_GAP;
      if (n.children.length === 0 || folded) { slots.push({ node: n, at: cursor }); cursor += 1; return; }
      n.children.forEach((c, i) => walk(c, i === 0));
    };
    walk(subject, true);
    const span = Math.min(MAX_SPAN[side], Math.max(0, cursor - 1) * DEG_PER_LEAF[side]);
    const center = side === "left" ? 180 : 0;
    // Top to bottom: on the left, angles run from center+span/2 down; on the right, from -span/2 up.
    const angleOf = (at: number) => {
      const t = cursor > 1 ? at / (cursor - 1) : 0.5;
      return side === "left" ? center + span / 2 - t * span : center - span / 2 + t * span;
    };

    const angles = new Map<string, number>();
    const leafAngle = (n: TNode): number => {
      const slot = slots.find((s) => s.node === n);
      if (slot) return angleOf(slot.at);
      const childAngles = n.children.map(leafAngle);
      return (Math.min(...childAngles) + Math.max(...childAngles)) / 2;
    };
    const place = (n: TNode) => {
      const folded = collapsed.has(n.id) && n.children.length > 0;
      const angle = n.kind === "subject" ? center : leafAngle(n);
      angles.set(n.id, angle);
      const r = RADIUS[side][n.depth];
      const rad = (angle * Math.PI) / 180;
      placed.set(n.id, { node: n, x: r * Math.cos(rad), y: r * Math.sin(rad), angle, collapsed: folded });
      if (!folded) n.children.forEach(place);
    };
    place(subject);
  }

  const visible = [...placed.values()];
  const edges = visible.filter((p) => p.node.parent).map((p) => ({ from: placed.get(p.node.parent!.id)!, to: p }));

  // Bounds, counting each skill pill's full width.
  const xs: number[] = []; const ys: number[] = [];
  for (const p of visible) {
    const w = p.node.kind === "skill" ? SKILL_W : 180;
    const left = p.node.kind === "skill" ? (p.node.side === "left" ? p.x - w : p.x) : p.x - w / 2;
    xs.push(left, left + w); ys.push(p.y - 40, p.y + 40);
  }
  const bounds = { minX: Math.min(...xs) - 40, maxX: Math.max(...xs) + 40, minY: Math.min(...ys) - 40, maxY: Math.max(...ys) + 40 };
  return { placed: visible, edges, bounds };
}

// ── Organic, tapered branches ────────────────────────────────────────────────

const unit = (a: number) => [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)];

/**
 * A filled, tapered curve from the parent to the child: wide at the parent, fine at the tip,
 * leaving and arriving along the radial direction so branches flow instead of zig-zagging.
 */
function branchShape(from: Placed, to: Placed, w0: number, w1: number): string {
  const d = Math.hypot(to.x - from.x, to.y - from.y);
  const [ux0, uy0] = from.node.kind === "root" ? unit(to.angle) : unit(from.angle);
  const [ux1, uy1] = unit(to.angle);
  const P = [
    [from.x, from.y],
    [from.x + ux0 * d * 0.45, from.y + uy0 * d * 0.45],
    [to.x - ux1 * d * 0.4, to.y - uy1 * d * 0.4],
    [to.x, to.y],
  ];
  const N = 22;
  const left: number[][] = []; const right: number[][] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N; const mt = 1 - t;
    const x = mt ** 3 * P[0][0] + 3 * mt * mt * t * P[1][0] + 3 * mt * t * t * P[2][0] + t ** 3 * P[3][0];
    const y = mt ** 3 * P[0][1] + 3 * mt * mt * t * P[1][1] + 3 * mt * t * t * P[2][1] + t ** 3 * P[3][1];
    const dx = 3 * mt * mt * (P[1][0] - P[0][0]) + 6 * mt * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0]);
    const dy = 3 * mt * mt * (P[1][1] - P[0][1]) + 6 * mt * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1]);
    const len = Math.hypot(dx, dy) || 1;
    const half = (w0 + (w1 - w0) * (t * t * (3 - 2 * t))) / 2; // ease the taper
    left.push([x - (dy / len) * half, y + (dx / len) * half]);
    right.push([x + (dy / len) * half, y - (dx / len) * half]);
  }
  const pts = [...left, ...right.reverse()];
  return `M ${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ")} Z`;
}

const LEVEL_INK: Record<CategoryMastery["level"], string> = {
  not_started: "var(--ink-300)",
  weak: "var(--claret-500)",
  strong: "var(--moss-500)",
  mastered: "var(--moss-600)",
};
const BRANCH_WIDTH: Record<Kind, [number, number]> = { root: [0, 0], subject: [16, 7], domain: [7, 3.2], skill: [3.6, 1.4] };

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

/** Entrance timing: the center first, then each ring outward. */
const delayOf = (p: Placed, i: number) => (p.node.depth === 0 ? 0 : 120 + (p.node.depth - 1) * 170 + (p.node.kind === "skill" ? (i % 14) * 28 : 0));

// ── View: starts centered on "Your SAT" at 110% ──────────────────────────────

const START_K = 1.1;
/** The word's size on the map at 100%, per kind — the focus title is 3× this. */
const WORD_SIZE: Record<Kind, number> = { root: 19, subject: 16, domain: 9.5, skill: 13.5 };
/** Where a node's visual center is (skill pills extend outward from their anchor). */
const visualCenter = (p: Placed) => p.node.kind === "skill" ? { x: p.x + (p.node.side === "left" ? -SKILL_W / 2 : SKILL_W / 2), y: p.y } : { x: p.x, y: p.y };
const MIN_K = 0.3;
const MAX_K = 2.5;
const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));
interface View { k: number; tx: number; ty: number }

interface MindMapProps {
  mastery: CategoryMastery[];
  tiers: Tiers;
  history?: Record<string, SkillHistory>;
  mode: "inline" | "full";
  height?: number;
}

export function MindMap({ mastery, tiers, history, mode, height }: MindMapProps) {
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
  const [hovered, setHovered] = useState<string | null>(null);
  const nodeById = useMemo(() => {
    const ids = new Map<string, TNode>();
    const walk = (n: TNode) => { ids.set(n.id, n); n.children.forEach(walk); };
    walk(tree);
    return ids;
  }, [tree]);
  /** The node whose details are open; the map glides to it and its word grows 3×. */
  const [selected, setSelected] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const viewportRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ k: START_K, tx: 0, ty: 0 });
  /** Smooth transitions for button-driven moves; off while dragging/pinching so it tracks the finger. */
  const [gliding, setGliding] = useState(false);
  const touched = useRef(false);

  const glide = useCallback((next: View | ((v: View) => View)) => {
    setGliding(true);
    setView(next);
  }, []);

  const center = useCallback((smooth = false) => {
    const el = viewportRef.current;
    if (!el) return;
    const { width, height: h } = el.getBoundingClientRect();
    if (!width || !h) return;
    const next = { k: START_K, tx: width / 2, ty: h / 2 };
    if (smooth) glide(next); else setView(next);
  }, [glide]);

  const fit = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const { width, height: h } = el.getBoundingClientRect();
    const k = clampK(Math.min(width / (bounds.maxX - bounds.minX), h / (bounds.maxY - bounds.minY), 1.4) * 0.94);
    glide({ k, tx: width / 2 - ((bounds.minX + bounds.maxX) / 2) * k, ty: h / 2 - ((bounds.minY + bounds.maxY) / 2) * k });
  }, [bounds, glide]);

  // Start centered on "Your SAT" at 110%, and stay centered as the viewport settles, until the student moves it.
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    center();
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
      if (!touched.current) center();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [center]);

  const zoomAt = useCallback((factor: number, px?: number, py?: number, smooth = false) => {
    const el = viewportRef.current;
    if (!el) return;
    touched.current = true;
    const rect = el.getBoundingClientRect();
    const cx = px ?? rect.width / 2;
    const cy = py ?? rect.height / 2;
    const update = (v: View) => {
      const k = clampK(v.k * factor);
      return { k, tx: cx - (cx - v.tx) * (k / v.k), ty: cy - (cy - v.ty) * (k / v.k) };
    };
    if (smooth) glide(update); else { setGliding(false); setView(update); }
  }, [glide]);

  // Wheel: pinch / Ctrl+wheel zooms; in full screen, plain wheel pans. (Non-passive to stop page zoom/scroll.)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      if ((e.target as Element).closest?.(".mm-focus")) return; // let the detail card scroll
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = el!.getBoundingClientRect();
        zoomAt(Math.exp(-e.deltaY * 0.0025), e.clientX - rect.left, e.clientY - rect.top);
      } else if (mode === "full") {
        e.preventDefault();
        touched.current = true;
        setGliding(false);
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
    if (!dragged.current) {
      if (Math.hypot(dx, dy) < 3) return;
      dragged.current = true;
      setGliding(false);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const rect = viewportRef.current!.getBoundingClientRect();
      const target = clampK(pinchStart.current.k * (Math.hypot(a.x - b.x, a.y - b.y) / pinchStart.current.dist));
      zoomAt(target / view.k, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
    } else if (pointers.current.size === 1) {
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

  /** Screen y the focused word sits on: high enough to leave room for its card below. */
  const titleY = Math.max(64, size.h * 0.16);
  const focusK = Math.max(view.k, 0.9);

  /** Opens a node's details: unfolds the branches above it and glides it under the title. */
  function select(id: string) {
    const el = viewportRef.current;
    const node = nodeById.get(id);
    if (!el || !node) return;
    let nextCollapsed = collapsed;
    if ([...collapsed].some((c) => { for (let a = node.parent; a; a = a.parent) if (a.id === c) return true; return false; })) {
      nextCollapsed = new Set(collapsed);
      for (let a = node.parent; a; a = a.parent) nextCollapsed.delete(a.id);
      setCollapsed(nextCollapsed);
    }
    const p = layout(tree, nextCollapsed).placed.find((q) => q.node.id === id);
    if (!p) return;
    const { width } = el.getBoundingClientRect();
    const c = visualCenter(p);
    touched.current = true;
    setHovered(null);
    setSelected(id);
    glide({ k: focusK, tx: width / 2 - c.x * focusK, ty: titleY - c.y * focusK });
  }

  /** Closes the details and settles that node in the middle of the map. */
  function closeFocus() {
    const el = viewportRef.current;
    const p = placed.find((q) => q.node.id === selected);
    setSelected(null);
    if (!el || !p) return;
    const { width, height: h } = el.getBoundingClientRect();
    const c = visualCenter(p);
    glide((v) => ({ k: v.k, tx: width / 2 - c.x * v.k, ty: h / 2 - c.y * v.k }));
    // Hand focus back to the node so the keyboard picks up where it was.
    requestAnimationFrame(() => el.querySelector<HTMLElement>(`[data-node="${CSS.escape(p.node.id)}"]`)?.focus({ preventScroll: true }));
  }

  // The path from the hovered node back to the center lights up.
  const lit = useMemo(() => {
    const ids = new Set<string>();
    let n = placed.find((p) => p.node.id === hovered)?.node;
    while (n) { ids.add(n.id); n = n.parent; }
    return ids;
  }, [hovered, placed]);

  const started = mastery.filter((m) => m.level !== "not_started").length;

  const controlButton: React.CSSProperties = {
    minWidth: 32, height: 32, padding: "0 11px", border: "1px solid var(--border)", background: "color-mix(in srgb, var(--surface) 86%, transparent)",
    backdropFilter: "blur(6px)", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: mode === "full" ? "100%" : undefined }}>
      <ErrorLine error={error} />
      <style>{MIND_MAP_CSS + FOCUS_CSS}</style>
      <div
        ref={viewportRef}
        role="group"
        aria-label="Skill mind map"
        className="mm-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        onScroll={(e) => {
          // The browser scrolls this clipped box to reveal a focused node (Tab, find in page). Turn that
          // into a pan instead, so the view, the card and the hit targets stay where the math says.
          const el = e.currentTarget;
          const dx = el.scrollLeft; const dy = el.scrollTop;
          if (e.target !== el || (!dx && !dy)) return;
          el.scrollLeft = 0; el.scrollTop = 0;
          if (selected) return;
          touched.current = true;
          setGliding(false);
          setView((v) => ({ ...v, tx: v.tx - dx, ty: v.ty - dy }));
        }}
        style={{
          position: "relative", overflow: "hidden", flex: mode === "full" ? 1 : undefined, height: mode === "full" ? undefined : height ?? 660,
          borderRadius: mode === "full" ? 0 : "var(--radius-xl)", border: mode === "full" ? "none" : "1px solid var(--border)",
          touchAction: "none", cursor: "grab", userSelect: "none",
          background: `radial-gradient(ellipse at ${view.tx}px ${view.ty}px, var(--surface) 0%, var(--canvas) ${560 * view.k}px)`,
        }}
      >
        {/* Everything is positioned around "Your SAT" at (0,0); the view moves that point. */}
        <div style={{
          position: "absolute", left: 0, top: 0, width: 0, height: 0,
          transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.k})`, transformOrigin: "0 0",
          transition: gliding ? "transform .55s cubic-bezier(.2,.75,.2,1)" : "none",
        }} onTransitionEnd={() => setGliding(false)}>
          <svg aria-hidden width="1" height="1" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <defs>
              {edges.map(({ from, to }) => {
                const toInk = to.node.m ? LEVEL_INK[to.node.m.level] : "var(--ink-400)";
                const fromInk = from.node.kind === "root" ? "var(--ink-700)" : "var(--ink-400)";
                return (
                  <linearGradient key={to.node.id} id={`mm-g-${to.node.id.replace(/[^a-z0-9]/gi, "")}-${mode}`} gradientUnits="userSpaceOnUse" x1={from.x} y1={from.y} x2={to.x} y2={to.y}>
                    <stop offset="0%" stopColor={fromInk} />
                    <stop offset="100%" stopColor={toInk} />
                  </linearGradient>
                );
              })}
            </defs>
            {edges.map(({ from, to }, i) => {
              const [w0, w1] = BRANCH_WIDTH[to.node.kind];
              const isLit = lit.has(to.node.id);
              const dim = to.node.m?.level === "not_started";
              return (
                <path
                  key={to.node.id}
                  className="mm-branch"
                  d={branchShape(from, to, w0, w1)}
                  fill={`url(#mm-g-${to.node.id.replace(/[^a-z0-9]/gi, "")}-${mode})`}
                  style={{
                    opacity: hovered ? (isLit ? 1 : 0.32) : dim ? 0.42 : 0.8,
                    transformOrigin: `${from.x}px ${from.y}px`,
                    animationDelay: `${delayOf(to, i)}ms`,
                  }}
                />
              );
            })}
          </svg>

          {/* Center: a charcoal disc wrapped in a ring with one segment per skill, colored by level. */}
          <RootNode mastery={mastery} started={started} hidden={selected === "root"} onSelect={() => select("root")} />

          {placed.map((p, i) => {
            const n = p.node;
            if (n.kind === "root") return null;
            const enter: React.CSSProperties = { animationDelay: `${delayOf(p, i) + 120}ms` };

            if (n.kind === "skill" && n.m) {
              const m = n.m;
              const look = LEVEL_STYLE[m.level];
              const tier = tiers[m.subcategory];
              const busy = starting === m.subcategory;
              return (
                <div key={n.id} className="mm-pos" style={{ left: n.side === "left" ? p.x - SKILL_W : p.x, top: p.y - SKILL_H / 2 }}>
                  <div className="mm-enter" style={enter}>
                    <div className="mm-float" style={{ animationDelay: `${(i * 470) % 5000}ms` }}>
                      <button
                        className={`mm-skill${selected === n.id ? " mm-hidden" : ""}`}
                        data-node={n.id}
                        onClick={() => select(n.id)}
                        onMouseEnter={() => setHovered(n.id)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(n.id)}
                        onBlur={() => setHovered(null)}
                        aria-label={`${m.subcategory}: ${LEVEL_LABEL[m.level]}${m.estimate ? " (estimate)" : ""}. Show details.`}
                        title={`${m.subcategory} — ${LEVEL_LABEL[m.level]}${m.level !== "not_started" ? ` · ~${m.score}% on Medium+ questions${m.estimate ? " (estimate)" : ""}` : ""}${tier && m.level !== "not_started" ? ` · practicing at ${DIFFICULTY_LABELS[tier]}` : ""}`}
                        style={{
                          width: SKILL_W, height: SKILL_H, display: "flex", alignItems: "center", gap: 9,
                          // Reads left to right on both sides; the level dot sits where the branch arrives.
                          padding: "0 14px", borderRadius: 999, cursor: "pointer",
                          background: look.background === "transparent" ? "var(--surface)" : look.background, border: look.border, color: look.ink,
                          opacity: busy ? 0.6 : m.estimate ? 0.8 : 1,
                          boxShadow: m.level === "mastered" ? "0 6px 18px rgba(58,74,55,.28)" : "0 2px 8px rgba(32,31,28,.05)",
                        }}
                      >
                        <span aria-hidden style={{ order: n.side === "left" ? 3 : 0, flexShrink: 0, width: 7, height: 7, borderRadius: 99, background: m.level === "mastered" ? "var(--moss-50)" : LEVEL_INK[m.level] }} />
                        <span style={{ order: 1, flex: 1, minWidth: 0, fontSize: 13.5, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "left" }}>
                          {SHORT_NAME[m.subcategory] ?? m.subcategory}
                        </span>
                        <span style={{ order: 2, flexShrink: 0, fontFamily: "var(--font-sans)", fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: look.sub }}>
                          {busy ? "…" : m.level === "not_started" ? "New" : (tier ? DIFFICULTY_LABELS[tier] : LEVEL_LABEL[m.level])}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // Subject and domain nodes open their details; the +/− beside them folds the branch.
            const isSubject = n.kind === "subject";
            const outward = n.side === "left" ? "left" : "right";
            const w = isSubject ? 150 : 158;
            return (
              <div key={n.id} className="mm-pos" style={{ left: p.x - w / 2, top: p.y - (isSubject ? 23 : 22) }}>
                <div className={`mm-enter mm-group${p.collapsed ? " mm-folded" : ""}`} style={{ ...enter, position: "relative" }}>
                  <button
                    className={`${isSubject ? "mm-subject" : "mm-domain"}${selected === n.id ? " mm-hidden" : ""}`}
                    data-node={n.id}
                    onClick={() => select(n.id)}
                    onMouseEnter={() => setHovered(n.id)}
                    onMouseLeave={() => setHovered(null)}
                    aria-label={`${n.label} (${summary(skillsUnder(n))}). Show details.`}
                    style={{
                      position: "relative", width: w, minHeight: isSubject ? 46 : 44, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                      borderRadius: 999, cursor: "pointer", padding: "6px 14px", textAlign: "center",
                      color: "var(--text-strong)",
                    }}
                  >
                    <span style={isSubject
                      ? { fontSize: 16, letterSpacing: "-0.01em", lineHeight: 1.1 }
                      : { fontFamily: "var(--font-sans)", fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", lineHeight: 1.3 }}>
                      {n.label}
                    </span>
                    {p.collapsed && <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--text-faint)" }}>{summary(skillsUnder(n))}</span>}
                  </button>
                  <button
                    className="mm-toggle"
                    onClick={() => toggle(n.id)}
                    aria-expanded={!p.collapsed}
                    aria-label={`${p.collapsed ? "Expand" : "Collapse"} ${n.label}`}
                    title={p.collapsed ? "Unfold this branch" : "Fold this branch"}
                    style={{ [outward]: -11 }}
                  >
                    {p.collapsed ? "+" : "−"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: "absolute", right: 14, bottom: 14, display: "flex", gap: 6, alignItems: "center" }}>
          <button style={controlButton} onClick={() => setCollapsed(new Set())} aria-label="Expand all">Expand all</button>
          <button style={controlButton} onClick={() => setCollapsed(new Set(groupIds.filter((id) => id.startsWith("domain:"))))} aria-label="Collapse all">Collapse all</button>
          <span style={{ width: 6 }} />
          <button style={controlButton} onClick={() => zoomAt(1 / 1.2, undefined, undefined, true)} aria-label="Zoom out">−</button>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", minWidth: 40, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{Math.round(view.k * 100)}%</span>
          <button style={controlButton} onClick={() => zoomAt(1.2, undefined, undefined, true)} aria-label="Zoom in">+</button>
          <button style={controlButton} onClick={() => { touched.current = false; center(true); }} aria-label="Center">Center</button>
          <button style={controlButton} onClick={() => { touched.current = true; fit(); }} aria-label="Fit to screen">Fit</button>
        </div>
        <p className="mm-hint" style={{ position: "absolute", left: 16, bottom: 16, margin: 0, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", pointerEvents: "none" }}>
          Drag to explore · pinch or Ctrl + scroll to zoom{mode === "full" ? " · scroll to pan" : ""} · click any word for details · +/− folds a branch
        </p>

        {selected && nodeById.get(selected) && (
          <FocusCard
            node={nodeById.get(selected)!}
            tiers={tiers}
            history={history}
            starting={starting}
            error={error}
            onStart={start}
            onSelect={select}
            onClose={closeFocus}
            baseSize={WORD_SIZE[nodeById.get(selected)!.kind] * focusK}
            width={Math.min(540, Math.max(0, size.w - 32))}
            titleY={titleY}
            maxHeight={size.h - titleY - 16}
          />
        )}
      </div>
      {mode === "inline" && <MapLegend note="Faded nodes are early estimates" />}
    </div>
  );
}

/** "Your SAT": a charcoal disc inside a ring of skill segments that draws itself in. */
function RootNode({ mastery, started, hidden, onSelect }: { mastery: CategoryMastery[]; started: number; hidden: boolean; onSelect: () => void }) {
  const R = 74;
  const C = 2 * Math.PI * R;
  const gap = 5;
  const seg = mastery.length ? C / mastery.length : C;
  return (
    <div className="mm-pos" style={{ left: -90, top: -90, width: 180, height: 180 }}>
      <div className="mm-enter mm-root" style={{ width: 180, height: 180, position: "relative" }}>
        <div className="mm-halo" />
        <svg aria-hidden width={180} height={180} viewBox="-90 -90 180 180" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <circle r={R} fill="none" stroke="var(--surface-2)" strokeWidth={5} />
          {mastery.map((m, i) => (
            <circle
              key={m.subcategory}
              className="mm-ring"
              r={R}
              fill="none"
              stroke={m.level === "not_started" ? "transparent" : LEVEL_INK[m.level]}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(0, seg - gap)} ${C}`}
              strokeDashoffset={-seg * i}
              style={{ animationDelay: `${300 + i * 45}ms` }}
            />
          ))}
        </svg>
        <button data-node="root" onClick={onSelect} aria-label={`Your SAT: ${started} of ${mastery.length} skills started. Show details.`} className={`mm-root-disc${hidden ? " mm-hidden" : ""}`} style={{
          position: "absolute", left: 30, top: 30, width: 120, height: 120, borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "var(--font-serif)",
          background: "radial-gradient(circle at 35% 30%, #3a3833 0%, var(--brand) 60%, #141310 100%)",
          color: "var(--text-on-brand)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          boxShadow: "0 18px 40px rgba(32,31,28,.28), inset 0 1px 0 rgba(255,255,255,.08)",
        }}>
          <span style={{ fontSize: 19, letterSpacing: "-0.015em" }}>Your SAT</span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.04em", opacity: 0.7, marginTop: 4 }}>{started} of {mastery.length} started</span>
        </button>
      </div>
    </div>
  );
}

const MIND_MAP_CSS = `
.mm-pos { position: absolute; transition: left .6s cubic-bezier(.2,.75,.2,1), top .6s cubic-bezier(.2,.75,.2,1); }
.mm-enter { animation: mm-enter .7s cubic-bezier(.2,.75,.2,1) both; }
@keyframes mm-enter { from { opacity: 0; transform: translateY(8px) scale(.94); } to { opacity: 1; transform: none; } }
.mm-float { animation: mm-float 7s ease-in-out infinite; }
@keyframes mm-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2.5px); } }
.mm-branch { animation: mm-grow .9s cubic-bezier(.2,.75,.2,1) both; transition: opacity .35s ease, d .6s cubic-bezier(.2,.75,.2,1); }
@keyframes mm-grow { from { opacity: 0; transform: scale(.2); } }
.mm-ring { animation: mm-ring 1.1s cubic-bezier(.2,.75,.2,1) both; }
@keyframes mm-ring { from { stroke-dasharray: 0 999; } }
.mm-halo { position: absolute; inset: 14px; border-radius: 999px; background: radial-gradient(circle, rgba(32,31,28,.16) 0%, transparent 70%); animation: mm-breathe 5.5s ease-in-out infinite; }
@keyframes mm-breathe { 0%, 100% { transform: scale(.94); opacity: .7; } 50% { transform: scale(1.12); opacity: 1; } }
.mm-skill { transition: transform .25s cubic-bezier(.2,.75,.2,1), box-shadow .25s ease; }
.mm-skill:not(:disabled):hover, .mm-skill:focus-visible { transform: translateY(-2px) scale(1.04); box-shadow: 0 12px 28px rgba(32,31,28,.16) !important; }
.mm-subject { background: color-mix(in srgb, var(--surface) 88%, transparent); border: 1px solid var(--border-strong); box-shadow: 0 8px 24px rgba(32,31,28,.10); backdrop-filter: blur(6px); transition: transform .25s ease, box-shadow .25s ease; }
.mm-subject:hover { transform: scale(1.04); box-shadow: 0 12px 30px rgba(32,31,28,.14); }
.mm-domain { background: color-mix(in srgb, var(--canvas) 82%, transparent); border: 1px solid transparent; backdrop-filter: blur(4px); transition: border-color .25s ease, background .25s ease; }
.mm-domain:hover { border-color: var(--border); background: var(--surface); }
.mm-toggle { position: absolute; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; padding: 0; border-radius: 999px; border: 1px solid var(--border-strong); background: var(--surface); display: flex; align-items: center; justify-content: center; font-family: var(--font-sans); font-size: 13px; line-height: 1; color: var(--text-muted); cursor: pointer; opacity: .45; transition: opacity .25s ease, transform .25s ease; }
.mm-toggle:hover { transform: translateY(-50%) scale(1.12); color: var(--text-strong); }
.mm-group:hover .mm-toggle, .mm-toggle:focus-visible, .mm-folded .mm-toggle { opacity: 1; }
.mm-hidden { opacity: 0 !important; transition: opacity .3s ease; }
.mm-root-disc { transition: transform .3s cubic-bezier(.2,.75,.2,1); }
.mm-root-disc:hover, .mm-root-disc:focus-visible { transform: scale(1.04); }
@media (max-width: 760px) { .mm-hint, .mm-legend-full { display: none !important; } }
@media (prefers-reduced-motion: reduce) {
  .mm-enter, .mm-float, .mm-branch, .mm-ring, .mm-halo { animation: none !important; }
  .mm-pos, .mm-branch { transition: none !important; }
}
`;

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
export function SkillMapView({ mastery, tiers, history }: { mastery: CategoryMastery[]; tiers: Tiers; history?: Record<string, SkillHistory> }) {
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
      borderRadius: 999, padding: "8px 16px", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-strong)",
    }}>
      <span aria-hidden>⤢</span> Full screen
    </button>
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "0 0 10px" }}>{openButton}</div>
      {wide ? <MindMap mastery={mastery} tiers={tiers} history={history} mode="inline" /> : <SkillMap mastery={mastery} tiers={tiers} />}

      {full && (
        <div role="dialog" aria-modal="true" aria-label="Skill map, full screen" style={{ position: "fixed", inset: 0, zIndex: 70, background: "var(--canvas)", display: "flex", flexDirection: "column", fontFamily: "var(--font-serif)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "10px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
            <span style={{ fontSize: 18, color: "var(--text-strong)" }}>Your skill map</span>
            <div className="mm-legend-full" style={{ marginTop: -22 }}><MapLegend note="Faded nodes are early estimates" /></div>
            <button onClick={() => setFull(false)} style={{
              border: "1px solid var(--border-strong)", background: "transparent", borderRadius: 999, padding: "8px 16px",
              cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-strong)",
            }}>
              Close · Esc
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <MindMap mastery={mastery} tiers={tiers} history={history} mode="full" />
          </div>
        </div>
      )}
    </>
  );
}
