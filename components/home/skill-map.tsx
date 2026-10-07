"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DOMAINS } from "@/lib/categories";
import { DIFFICULTY_LABELS } from "@/lib/plan";
import type { CategoryMastery } from "@/lib/mastery";
import type { Difficulty } from "@/lib/types";
import { LEVEL_LABEL, LEVEL_STYLE, startPracticeSet } from "./practice";

/** Untried categories start with a short taster; practiced ones get a full short set. */
const FIRST_SET = 5;
const SET = 10;

function Tile({ m, tier, busy, onStart }: { m: CategoryMastery; tier: Difficulty | undefined; busy: boolean; onStart: () => void }) {
  const look = LEVEL_STYLE[m.level];
  const started = m.level !== "not_started";
  return (
    <button
      onClick={onStart}
      disabled={busy}
      aria-label={`${m.subcategory}: ${LEVEL_LABEL[m.level]}${m.estimate ? " (estimate)" : ""}. Start ${started ? SET : FIRST_SET} questions.`}
      style={{
        display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14, minHeight: 104,
        padding: "14px 16px", textAlign: "left", cursor: busy ? "default" : "pointer",
        background: look.background, border: look.border, borderRadius: "var(--radius-md)",
        opacity: busy ? 0.6 : m.estimate ? 0.78 : 1, transition: "transform 0.12s",
      }}
    >
      <span style={{ fontSize: 15, lineHeight: 1.3, color: look.ink }}>{m.subcategory}</span>
      <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, fontFamily: "var(--font-sans)", fontSize: 11, color: look.sub }}>
        <span style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {busy ? "Starting…" : LEVEL_LABEL[m.level]}{m.estimate && !busy ? " · estimate" : ""}
        </span>
        {started && tier && <span>{DIFFICULTY_LABELS[tier]}</span>}
      </span>
    </button>
  );
}

/** Every category as a tile, grouped by SAT domain. Clicking a tile starts a set there. */
export function SkillMap({ mastery, tiers }: { mastery: CategoryMastery[]; tiers: Record<string, Difficulty> }) {
  const router = useRouter();
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bySub = new Map(mastery.map((m) => [m.subcategory, m]));

  async function start(m: CategoryMastery) {
    if (starting) return;
    setStarting(m.subcategory);
    setError(null);
    const started = m.level !== "not_started";
    try {
      const id = await startPracticeSet(m.subcategory, tiers[m.subcategory] ?? "medium-low", started ? SET : FIRST_SET);
      router.push(`/practice/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the set.");
      setStarting(null);
    }
  }

  return (
    <div>
      {error && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", margin: "0 0 14px" }}>{error}</p>}
      {DOMAINS.map((d, i) => {
        const tiles = d.categories.map((c) => bySub.get(c.subcategory)).filter((m): m is CategoryMastery => !!m);
        if (tiles.length === 0) return null;
        const subjectHeader = i === 0 || DOMAINS[i - 1].subject !== d.subject ? d.subject : null;
        return (
          <div key={d.domain}>
            {subjectHeader && (
              <h3 style={{ fontWeight: 400, fontSize: 20, letterSpacing: "-0.012em", color: "var(--text-strong)", margin: subjectHeader === "Math" ? "40px 0 14px" : "0 0 14px" }}>{subjectHeader}</h3>
            )}
            {d.subject === "Reading & Writing" && (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)", margin: "18px 0 10px" }}>{d.domain}</p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(176px, 1fr))", gap: 10 }}>
              {tiles.map((m) => (
                <Tile key={m.subcategory} m={m} tier={tiers[m.subcategory]} busy={starting === m.subcategory} onStart={() => start(m)} />
              ))}
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", margin: "22px 0 0", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>
        {(["not_started", "weak", "strong", "mastered"] as const).map((l) => (
          <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span aria-hidden style={{ width: 12, height: 12, borderRadius: 3, background: LEVEL_STYLE[l].background, border: LEVEL_STYLE[l].border }} />
            {LEVEL_LABEL[l]}
          </span>
        ))}
        <span>· Faded tiles are early estimates</span>
      </div>
    </div>
  );
}
