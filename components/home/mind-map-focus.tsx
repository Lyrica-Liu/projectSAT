"use client";

import { DIFFICULTY_LABELS } from "@/lib/plan";
import { MASTERED_AT, MASTERED_MAX_UNCERTAINTY, MASTERED_MIN_HARD, WEAK_BELOW, pCorrect, type CategoryMastery } from "@/lib/mastery";
import type { SkillHistory } from "@/lib/server/mastery";
import type { Difficulty } from "@/lib/types";
import { LEVEL_LABEL, LEVEL_STYLE } from "./practice";
import type { Tiers } from "./skill-map";

/** The slice of a mind-map node the focus card needs. */
export interface FocusNode {
  id: string;
  kind: "root" | "subject" | "domain" | "skill";
  label: string;
  children: FocusNode[];
  parent?: FocusNode;
  m?: CategoryMastery;
}

const TIERS: Difficulty[] = ["easy", "medium-low", "medium-high", "hard"];
const FIRST_SET = 5;
const SET = 10;

/** What each node covers on the test, in a sentence. Keyed by node id. */
const DESCRIPTIONS: Record<string, string> = {
  root: "Two sections, each scored 200–800: Reading & Writing and Math. Every skill on this map feeds one of them.",
  "subject:rw": "Short passages with one question each: 54 questions in two 32-minute modules, across four domains.",
  "subject:math": "Algebra through geometry and trig: 44 questions in two 35-minute modules, with the Desmos calculator throughout.",
  "domain:Information and Ideas": "Reading for meaning: finding the main point, backing claims with evidence from text or data, and drawing logical conclusions.",
  "domain:Craft and Structure": "How texts are built: precise word choice, what a sentence or passage is for, and how two authors relate.",
  "domain:Expression of Ideas": "Revising for effect: choosing the right transition and using notes to meet a writing goal.",
  "domain:Standard English Conventions": "Grammar and punctuation: sentence boundaries, agreement and verb forms — the edits that make a sentence correct.",
  "Central Ideas and Details": "Find a passage's main idea, or a key detail it states directly.",
  "Command of Evidence (Textual)": "Pick the quotation or finding that best supports, weakens or illustrates a claim.",
  "Command of Evidence (Quantitative)": "Use data from a table or graph to complete a claim accurately.",
  "Inferences": "Choose the conclusion that most logically completes a passage.",
  "Words in Context": "Choose the most precise word or phrase for the context.",
  "Text Structure and Purpose": "Say what a passage, or one sentence in it, is doing: its function and overall structure.",
  "Cross-Text Connections": "Read two short texts and work out how one author would respond to the other.",
  "Transitions": "Choose the transition that fits the logic between two sentences.",
  "Rhetorical Synthesis": "Use a student's notes to write a sentence that meets a specific goal.",
  "Boundaries": "Punctuate where clauses and phrases meet: commas, semicolons, colons and dashes.",
  "Form, Structure, and Sense": "Subject–verb and pronoun agreement, verb tense, plurals and possessives.",
  "Algebra": "Linear equations, inequalities, functions and systems, in words, tables and graphs.",
  "Advanced Math": "Quadratics, exponentials, polynomials and other nonlinear equations and functions.",
  "Data Analysis": "Ratios, rates, percentages, units, probability, and reading statistics and models.",
  "Geometry": "Area and volume, lines and angles, triangles, circles and right-triangle trig.",
};

const LEVEL_DOT: Record<CategoryMastery["level"], string> = {
  not_started: "var(--ink-300)",
  weak: "var(--claret-500)",
  strong: "var(--moss-500)",
  mastered: "var(--moss-600)",
};
const LEVELS: CategoryMastery["level"][] = ["mastered", "strong", "weak", "not_started"];

const skillsUnder = (n: FocusNode): CategoryMastery[] => (n.m ? [n.m] : n.children.flatMap(skillsUnder));
const pct = (p: number) => Math.round(p * 100);

/** One-line state of a node for list rows. */
function rowNote(n: FocusNode): string {
  if (n.m) return n.m.level === "not_started" ? "New" : `${LEVEL_LABEL[n.m.level]} · ~${n.m.score}%`;
  const skills = skillsUnder(n);
  const weak = skills.filter((m) => m.level === "weak").length;
  return `${skills.length} skills${weak ? ` · ${weak} weak` : ""}`;
}

/** What to do next in a skill, from the same thresholds that set its level. */
function nextStep(m: CategoryMastery, tier: Difficulty): string {
  if (m.level === "not_started") return `Start with ${FIRST_SET} questions at ${DIFFICULTY_LABELS[tier]}. A few answers place you on the map.`;
  const onMedium = pct(pCorrect(m.ability, "medium-low"));
  const onHard = pct(pCorrect(m.ability, "hard"));
  if (m.level === "weak") {
    return `Your chance on a Medium question is about ${onMedium}%. Reach ${pct(WEAK_BELOW)}% and this turns Strong — steady sets at ${DIFFICULTY_LABELS[tier]} will get you there.`;
  }
  if (m.level === "mastered") return "Mastered. A Hard set now and then keeps it that way.";
  const missing: string[] = [];
  if (onHard < pct(MASTERED_AT)) missing.push(`a ${pct(MASTERED_AT)}% chance on Hard questions (now ${onHard}%)`);
  if (m.hardAnswered < MASTERED_MIN_HARD) missing.push(`${MASTERED_MIN_HARD - m.hardAnswered} more Hard answer${MASTERED_MIN_HARD - m.hardAnswered === 1 ? "" : "s"}`);
  if (m.uncertainty > MASTERED_MAX_UNCERTAINTY && missing.length === 0) missing.push("a few more answers to be sure");
  return missing.length ? `To reach Mastered: ${missing.join(" and ")}.` : "Almost Mastered — one more good set should do it.";
}

const formatDay = (at: number) => new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" });

// ── Card ─────────────────────────────────────────────────────────────────────

export interface FocusCardProps {
  node: FocusNode;
  tiers: Tiers;
  history?: Record<string, SkillHistory>;
  starting: string | null;
  error: string | null;
  onStart: (m: CategoryMastery) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
  /** The word's size on the map, in screen px, before it grows 3×. */
  baseSize: number;
  width: number;
  /** Screen y the title's first line is centered on (where the node sits behind it). */
  titleY: number;
  maxHeight: number;
}

export function FocusCard({ node, tiers, history, starting, error, onStart, onSelect, onClose, baseSize, width, titleY, maxHeight }: FocusCardProps) {
  const siblings = node.parent?.children ?? [];
  const at = siblings.indexOf(node);
  // With two siblings, "previous" and "next" are the same node: show it once, as next.
  const prev = siblings.length > 2 ? siblings[(at - 1 + siblings.length) % siblings.length] : null;
  const next = siblings.length > 1 ? siblings[(at + 1) % siblings.length] : null;
  const isDomain = node.kind === "domain";
  const titleSize = Math.min(baseSize * 3, width / (isDomain ? 9 : 8));
  const lineHeight = 1.08;

  const crumbs: FocusNode[] = [];
  for (let p = node.parent; p; p = p.parent) crumbs.unshift(p);

  function onKeyDown(e: React.KeyboardEvent) {
    const go = (n: FocusNode | null | undefined) => { e.preventDefault(); if (n) onSelect(n.id); };
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(); }
    else if (e.key === "ArrowLeft") go(prev ?? next);
    else if (e.key === "ArrowRight") go(next);
    else if (e.key === "ArrowUp") go(node.parent);
    else if (e.key === "ArrowDown") go(node.children[0]);
  }

  const navButton: React.CSSProperties = {
    border: "1px solid var(--border)", background: "var(--surface)", borderRadius: 999, padding: "7px 13px", cursor: "pointer",
    fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap",
  };

  return (
    <div
      className="mm-focus"
      role="dialog"
      aria-label={`${node.label} details`}
      tabIndex={-1}
      ref={(el) => { if (el && !el.contains(document.activeElement)) el.focus({ preventScroll: true }); }}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "absolute", inset: 0, zIndex: 5, outline: "none" }}
    >
      <button onClick={onClose} aria-label="Close details" className="mm-focus-close">×</button>

      <div style={{ position: "absolute", left: "50%", top: Math.max(8, titleY - (titleSize * lineHeight) / 2), width, transform: "translateX(-50%)", pointerEvents: "none" }}>
        {/* The word itself, 3× its size on the map */}
        <h2
          key={node.id}
          className="mm-focus-word"
          style={{
            margin: 0, textAlign: "center", color: "var(--text-strong)", fontWeight: 400, lineHeight,
            fontSize: titleSize, letterSpacing: isDomain ? "0.08em" : "-0.02em", textTransform: isDomain ? "uppercase" : undefined,
            fontFamily: isDomain ? "var(--font-sans)" : "var(--font-serif)",
            ["--mm-from" as string]: String(1 / 3),
          }}
        >
          {node.label}
        </h2>

        <div
          key={`card-${node.id}`}
          className="mm-focus-card"
          style={{
            pointerEvents: "auto", marginTop: 16, maxHeight: Math.max(220, maxHeight - titleSize * lineHeight - 16), overflowY: "auto",
            background: "color-mix(in srgb, var(--surface) 96%, transparent)", border: "1px solid var(--border)", borderRadius: 22,
            boxShadow: "0 24px 60px rgba(32,31,28,.16), 0 2px 8px rgba(32,31,28,.06)", padding: "18px 20px 16px",
            fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-body)", lineHeight: 1.5,
          }}
        >
          {crumbs.length > 0 && (
            <nav aria-label="Where this sits" style={{ display: "flex", flexWrap: "wrap", gap: 4, fontSize: 11, color: "var(--text-faint)", marginBottom: 8 }}>
              {crumbs.map((c, i) => (
                <span key={c.id} style={{ display: "inline-flex", gap: 4 }}>
                  {i > 0 && <span aria-hidden>›</span>}
                  <button className="mm-link" onClick={() => onSelect(c.id)}>{c.label}</button>
                </span>
              ))}
            </nav>
          )}
          {DESCRIPTIONS[node.id] && <p style={{ margin: "0 0 14px", fontFamily: "var(--font-serif)", fontSize: 15, lineHeight: 1.45, color: "var(--text-strong)" }}>{DESCRIPTIONS[node.id]}</p>}

          {node.m
            ? <SkillAnalysis m={node.m} tier={tiers[node.m.subcategory] ?? "medium-low"} history={history?.[node.m.subcategory]} starting={starting} onStart={onStart} />
            : <GroupAnalysis node={node} tiers={tiers} starting={starting} onStart={onStart} onSelect={onSelect} />}

          {error && <p style={{ margin: "10px 0 0", color: "var(--danger)", fontSize: 12.5 }}>{error}</p>}

          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
            {prev && <button style={navButton} onClick={() => onSelect(prev.id)} title="Previous (←)">← {prev.label}</button>}
            {next && <button style={navButton} onClick={() => onSelect(next.id)} title="Next (→)">{next.label} →</button>}
            <span style={{ flex: 1 }} />
            {node.parent && <button style={navButton} onClick={() => onSelect(node.parent!.id)} title="Up (↑)">↑ {node.parent.label}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Analyses ─────────────────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = { fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-faint)", margin: "16px 0 8px" };

function LevelChip({ level }: { level: CategoryMastery["level"] }) {
  const look = LEVEL_STYLE[level];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, fontSize: 11, letterSpacing: "0.04em",
      background: look.background === "transparent" ? "var(--surface-2)" : look.background, border: look.border, color: look.ink,
    }}>
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: 99, background: level === "mastered" ? "var(--moss-50)" : LEVEL_DOT[level] }} />
      {LEVEL_LABEL[level]}
    </span>
  );
}

function StartButton({ m, tier, starting, onStart, label }: { m: CategoryMastery; tier: Difficulty; starting: string | null; onStart: (m: CategoryMastery) => void; label?: string }) {
  const n = m.level === "not_started" ? FIRST_SET : SET;
  return (
    <button
      onClick={() => onStart(m)}
      disabled={!!starting}
      style={{
        border: "none", borderRadius: 999, padding: "10px 18px", cursor: starting ? "default" : "pointer", background: "var(--brand)",
        color: "var(--text-on-brand)", fontFamily: "var(--font-sans)", fontSize: 13, opacity: starting && starting !== m.subcategory ? 0.5 : 1,
      }}
    >
      {starting === m.subcategory ? "Starting…" : label ?? `Start ${n} questions · ${DIFFICULTY_LABELS[tier]}`}
    </button>
  );
}

function SkillAnalysis({ m, tier, history, starting, onStart }: { m: CategoryMastery; tier: Difficulty; history?: SkillHistory; starting: string | null; onStart: (m: CategoryMastery) => void }) {
  const started = m.level !== "not_started";
  const low = pct(pCorrect(m.ability - m.uncertainty, "medium-high"));
  const high = pct(pCorrect(m.ability + m.uncertainty, "medium-high"));
  const right = history ? Object.values(history.byTier).reduce((a, t) => a + (t?.correct ?? 0), 0) : null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <LevelChip level={m.level} />
        {started && (
          <span style={{ color: "var(--text-strong)" }}>
            <strong style={{ fontWeight: 600, fontSize: 18, fontFamily: "var(--font-serif)" }}>~{m.score}%</strong> on Medium+ questions
          </span>
        )}
        {started && <span style={{ color: "var(--text-faint)", fontSize: 12 }}>{m.estimate ? "early estimate · " : ""}likely {low}–{high}%</span>}
      </div>

      {started && (
        <>
          <div style={sectionLabel}>Your chance at each tier</div>
          <div style={{ display: "grid", gap: 7 }}>
            {TIERS.map((t) => {
              const p = pCorrect(m.ability, t);
              const here = t === tier;
              return (
                <div key={t} style={{ display: "grid", gridTemplateColumns: "96px 1fr 40px", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: here ? "var(--text-strong)" : "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {DIFFICULTY_LABELS[t]}
                    {here && <span title="The tier you're practicing at" style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", padding: "1px 6px", borderRadius: 99, background: "var(--brand)", color: "var(--text-on-brand)" }}>now</span>}
                  </span>
                  <span style={{ height: 8, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden" }}>
                    <span className="mm-bar" style={{ display: "block", height: "100%", width: `${pct(p)}%`, borderRadius: 99, background: p < WEAK_BELOW ? "var(--claret-500)" : p >= MASTERED_AT ? "var(--moss-600)" : "var(--moss-500)" }} />
                  </span>
                  <span style={{ fontSize: 12, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-strong)" }}>{pct(p)}%</span>
                </div>
              );
            })}
          </div>

          <div style={sectionLabel}>Your record</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {TIERS.map((t) => {
              const r = history?.byTier[t];
              return (
                <div key={t} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "7px 9px" }}>
                  <div style={{ fontSize: 10.5, color: "var(--text-faint)" }}>{DIFFICULTY_LABELS[t]}</div>
                  <div style={{ fontSize: 14, color: r ? "var(--text-strong)" : "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>
                    {r ? `${r.correct}/${r.answered}` : "—"}
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            {m.answered} answer{m.answered === 1 ? "" : "s"}{right != null ? `, ${right} right` : ""} · {m.hardAnswered} at Hard · recent sets count most
          </p>

          {history && history.sets.length > 0 && (
            <>
              <div style={sectionLabel}>Recent sets</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {history.sets.map((s, i) => {
                  const good = s.correct / s.answered >= 0.7;
                  return (
                    <span key={i} style={{
                      padding: "4px 10px", borderRadius: 999, fontSize: 11.5, fontVariantNumeric: "tabular-nums",
                      background: good ? "var(--moss-50)" : s.correct / s.answered < 0.5 ? "var(--claret-50)" : "var(--surface-2)", color: "var(--text-strong)",
                    }}>
                      {s.correct}/{s.answered} · {DIFFICULTY_LABELS[s.difficulty]} · <span style={{ color: "var(--text-faint)" }}>{formatDay(s.at)}</span>
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 14, background: "var(--surface-2)", color: "var(--text-strong)", fontSize: 13 }}>
        {nextStep(m, tier)}
      </div>
      <div style={{ marginTop: 12 }}>
        <StartButton m={m} tier={tier} starting={starting} onStart={onStart} />
      </div>
    </div>
  );
}

function GroupAnalysis({ node, tiers, starting, onStart, onSelect }: { node: FocusNode; tiers: Tiers; starting: string | null; onStart: (m: CategoryMastery) => void; onSelect: (id: string) => void }) {
  const skills = skillsUnder(node);
  const counts = Object.fromEntries(LEVELS.map((l) => [l, skills.filter((m) => m.level === l).length])) as Record<CategoryMastery["level"], number>;
  const started = skills.filter((m) => m.level !== "not_started");
  const avg = started.length ? Math.round(started.reduce((a, m) => a + m.score, 0) / started.length) : null;
  const answers = skills.reduce((a, m) => a + m.answered, 0);
  // Where to go next: the weakest started skill, or the first untried one.
  const focus = [...started].sort((a, b) => a.score - b.score)[0] ?? skills[0];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", color: "var(--text-strong)" }}>
        {avg != null
          ? <span><strong style={{ fontWeight: 600, fontSize: 18, fontFamily: "var(--font-serif)" }}>~{avg}%</strong> on Medium+ across {started.length} started skill{started.length === 1 ? "" : "s"}</span>
          : <span>Nothing started here yet.</span>}
        <span style={{ color: "var(--text-faint)", fontSize: 12 }}>{answers} answers</span>
      </div>

      <div style={sectionLabel}>{skills.length} skills</div>
      <div aria-hidden style={{ display: "flex", height: 10, borderRadius: 99, overflow: "hidden", background: "var(--surface-2)", gap: 2 }}>
        {LEVELS.map((l) => counts[l] > 0 && (
          <span key={l} className="mm-bar" style={{ flex: counts[l], background: l === "not_started" ? "var(--ink-300)" : LEVEL_DOT[l] }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
        {LEVELS.map((l) => counts[l] > 0 && (
          <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span aria-hidden style={{ width: 7, height: 7, borderRadius: 99, background: LEVEL_DOT[l] }} />{counts[l]} {LEVEL_LABEL[l].toLowerCase()}
          </span>
        ))}
      </div>

      <div style={sectionLabel}>Inside</div>
      <div style={{ display: "grid", gap: 2 }}>
        {node.children.map((c) => (
          <button key={c.id} className="mm-row" onClick={() => onSelect(c.id)}>
            <span aria-hidden style={{ width: 7, height: 7, borderRadius: 99, flexShrink: 0, background: c.m ? LEVEL_DOT[c.m.level] : "var(--ink-400)" }} />
            <span style={{ flex: 1, textAlign: "left", color: "var(--text-strong)" }}>{c.label}</span>
            <span style={{ fontSize: 11.5, color: c.m?.level === "weak" ? "var(--claret-500)" : "var(--text-faint)" }}>{rowNote(c)}</span>
            <span aria-hidden style={{ color: "var(--text-faint)" }}>›</span>
          </button>
        ))}
      </div>

      {focus && (
        <>
          <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 14, background: "var(--surface-2)", color: "var(--text-strong)", fontSize: 13 }}>
            {focus.level === "not_started"
              ? <>Start with <strong style={{ fontWeight: 600 }}>{focus.subcategory}</strong> — nothing here has been tried yet.</>
              : <>Weakest here: <strong style={{ fontWeight: 600 }}>{focus.subcategory}</strong> at ~{focus.score}% on Medium+.</>}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StartButton m={focus} tier={tiers[focus.subcategory] ?? "medium-low"} starting={starting} onStart={onStart} label={`Practice ${focus.subcategory}`} />
            <button className="mm-link" style={{ fontSize: 12.5, padding: "0 6px" }} onClick={() => onSelect(focus.subcategory)}>See its details</button>
          </div>
        </>
      )}
    </div>
  );
}

export const FOCUS_CSS = `
.mm-focus { animation: mm-fade .35s ease both; background: color-mix(in srgb, var(--canvas) 74%, transparent); backdrop-filter: blur(2.5px); -webkit-backdrop-filter: blur(2.5px); }
@keyframes mm-fade { from { opacity: 0; } }
.mm-focus-word { transform-origin: 50% 0.55em; animation: mm-word .6s cubic-bezier(.2,.75,.2,1) both; }
@keyframes mm-word { from { transform: scale(var(--mm-from)); opacity: .35; } }
.mm-focus-card { animation: mm-card .55s cubic-bezier(.2,.75,.2,1) .12s both; }
@keyframes mm-card { from { opacity: 0; transform: translateY(14px) scale(.98); } }
.mm-bar { animation: mm-bar .8s cubic-bezier(.2,.75,.2,1) .25s both; transform-origin: left; }
@keyframes mm-bar { from { transform: scaleX(0); } }
.mm-focus-close { position: absolute; top: 12px; right: 12px; width: 34px; height: 34px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--text-muted); font-size: 18px; line-height: 1; cursor: pointer; z-index: 1; }
.mm-link { border: none; background: none; padding: 0; cursor: pointer; font: inherit; color: var(--text-muted); text-decoration: underline; text-decoration-color: var(--border-strong); text-underline-offset: 3px; }
.mm-link:hover { color: var(--text-strong); }
.mm-row { display: flex; align-items: center; gap: 10px; width: 100%; border: none; background: none; padding: 8px 8px; border-radius: 10px; cursor: pointer; font-family: var(--font-sans); font-size: 13px; transition: background .2s ease; }
.mm-row:hover, .mm-row:focus-visible { background: var(--surface-2); }
@media (prefers-reduced-motion: reduce) { .mm-focus, .mm-focus-word, .mm-focus-card, .mm-bar { animation: none !important; } }
`;
