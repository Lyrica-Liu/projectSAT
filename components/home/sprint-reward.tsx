"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CategoryMastery } from "@/lib/mastery";
import { LEVEL_LABEL, LEVEL_STYLE } from "./practice";

/** Finishing a sprint: the skills it covered light up, one after another, to where they stand now. */
export function SprintReward({ title, tiles, style }: { title: string; tiles: CategoryMastery[]; style?: React.CSSProperties }) {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLit(true), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <section aria-label="Sprint complete" style={{
      padding: "28px 30px", background: "var(--surface)", border: "1px solid var(--moss-500)",
      borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", ...style,
    }}>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--success)", margin: "0 0 10px" }}>
        Sprint complete
      </p>
      <h2 style={{ fontWeight: 400, fontSize: 28, letterSpacing: "-0.016em", color: "var(--text-strong)", margin: "0 0 6px" }}>You finished the {title}.</h2>
      <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--text-muted)", margin: "0 0 20px" }}>Here&apos;s where these skills stand on your map now.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
        {tiles.map((m, i) => {
          const look = LEVEL_STYLE[lit ? m.level : "not_started"];
          return (
            <div key={m.subcategory} style={{
              padding: "14px 16px", minHeight: 82, borderRadius: "var(--radius-md)",
              background: look.background, border: look.border,
              transition: `background 0.6s ease ${i * 0.18}s, border-color 0.6s ease ${i * 0.18}s, transform 0.6s ease ${i * 0.18}s`,
              transform: lit ? "scale(1)" : "scale(0.96)",
              display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10,
            }}>
              <span style={{ fontSize: 15, color: look.ink, transition: `color 0.6s ease ${i * 0.18}s` }}>{m.subcategory}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: look.sub, transition: `color 0.6s ease ${i * 0.18}s` }}>
                {lit ? LEVEL_LABEL[m.level] : "…"}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 20, margin: "22px 0 0", fontFamily: "var(--font-sans)", fontSize: 13 }}>
        <Link href="/dashboard" style={{ color: "var(--text-strong)", textDecoration: "underline" }}>See your whole map</Link>
        <Link href="/sprints" style={{ color: "var(--text-muted)", textDecoration: "underline" }}>Pick another sprint</Link>
      </div>
    </section>
  );
}
