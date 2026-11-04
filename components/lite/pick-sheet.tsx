"use client";

import { DOMAINS } from "@/lib/categories";
import type { CategoryMastery } from "@/lib/mastery";
import { Sheet, useCached } from "@/components/lite/ui";

const LEVEL_DOT: Record<CategoryMastery["level"], { color: string; label: string }> = {
  not_started: { color: "var(--l-line2)", label: "Not started" },
  weak: { color: "var(--l-coral)", label: "Weak" },
  strong: { color: "var(--l-accent)", label: "Strong" },
  mastered: { color: "var(--l-violet)", label: "Mastered" },
};

/** Bar color for a skill's level, on the same coral → rose → violet scale as the dots. */
export const LEVEL_COLOR = (level: CategoryMastery["level"]) => LEVEL_DOT[level].color;

export function LevelDot({ level }: { level: CategoryMastery["level"] }) {
  const d = LEVEL_DOT[level];
  return <span title={d.label} aria-label={d.label} style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />;
}

/** "Pick": all English, all Math, or one skill. Calls `onPick` with "english", "math" or a category name. */
export function PickSheet({ onPick, onClose }: { onPick: (pick: string) => void; onClose: () => void }) {
  const { data } = useCached<{ mastery: CategoryMastery[] }>("skills", "/api/lite/skills");
  const levels: Record<string, CategoryMastery["level"]> = Object.fromEntries((data?.mastery ?? []).map((m) => [m.subcategory, m.level]));
  // Until levels arrive, list every category rather than none.
  const practicable = data ? new Set(data.mastery.map((m) => m.subcategory)) : null;

  const bigOption = (pick: string, title: string, sub: string, tone: string) => (
    <button onClick={() => onPick(pick)} style={{ flex: 1, border: 0, borderRadius: 20, padding: 16, background: tone, textAlign: "left", minHeight: 88, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--l-muted)" }}>{sub}</span>
      <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--l-ink)" }}>{title}</span>
    </button>
  );

  return (
    <Sheet onClose={onClose} label="Pick what to practice">
      <h2 className="l-h2" style={{ marginBottom: 16 }}>What do you want to practice?</h2>
      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        {bigOption("english", "All English", "Reading & Writing", "var(--l-coral-soft)")}
        {bigOption("math", "All Math", "Multiple choice", "var(--l-violet-soft)")}
      </div>
      {DOMAINS.map((d) => {
        const cats = d.categories.filter((c) => !practicable || practicable.has(c.subcategory));
        if (cats.length === 0) return null;
        return (
          <div key={d.domain} style={{ marginBottom: 16 }}>
            <p className="l-eyebrow" style={{ marginBottom: 4 }}>{d.domain}</p>
            {cats.map((c) => (
              <button key={c.subcategory} onClick={() => onPick(c.subcategory)} className="l-row"
                style={{ width: "100%", background: "none", border: 0, borderBottom: "1px solid var(--l-line)", textAlign: "left", color: "var(--l-ink)", fontWeight: 600 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 12 }}><LevelDot level={levels[c.subcategory] ?? "not_started"} />{c.subcategory}</span>
                <span aria-hidden="true" style={{ color: "var(--l-dim)", fontSize: 20 }}>›</span>
              </button>
            ))}
          </div>
        );
      })}
    </Sheet>
  );
}
