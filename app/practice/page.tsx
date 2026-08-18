"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar, SIDEBAR_WIDTH } from "@/components/ui/nav";
import type { Difficulty } from "@/lib/types";

const CATEGORIES: { label: string; subcategories: string[] }[] = [
  {
    label: "Information and Ideas",
    subcategories: ["Central Ideas and Details", "Command of Evidence (Textual)", "Command of Evidence (Quantitative)", "Inferences"],
  },
  {
    label: "Craft and Structure",
    subcategories: ["Words in Context", "Text Structure and Purpose", "Cross-Text Connections"],
  },
  { label: "Expression of Ideas", subcategories: ["Transitions", "Rhetorical Synthesis"] },
  { label: "Standard English Conventions", subcategories: ["Boundaries", "Form, Structure, and Sense"] },
  { label: "Math", subcategories: ["Algebra", "Data Analysis", "Geometry"] },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium-low", label: "Medium low" },
  { value: "medium-high", label: "Medium high" },
  { value: "hard", label: "Hard" },
];

const COUNT_OPTIONS = [5, 10, 15, 20];

const microLabel: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500,
  letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)",
  margin: "40px 0 0", paddingBottom: 12, borderBottom: "1px solid var(--line-strong)", display: "block",
};

export default function PracticeSetupPage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [difficulty, setDifficulty] = useState<Difficulty>("medium-high");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(cat: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  function toggleSubcategory(sub: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(sub) ? next.delete(sub) : next.add(sub);
      return next;
    });
  }

  async function startSession() {
    if (selected.size === 0) return;
    setLoading(true);
    setError(null);

    let sessionId: string;
    try {
      const res = await fetch("/api/start-bank-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subcategories: Array.from(selected), difficulty, count }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to start session");
      sessionId = body.sessionId;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not start the session. Please try again.");
      setLoading(false);
      return;
    }

    router.push(`/practice/${sessionId}`);
  }

  const selectedLabel = selected.size === 0 ? "Nothing chosen" : Array.from(selected).slice(0, 2).join(", ") + (selected.size > 2 ? `, +${selected.size - 2}` : "");
  const estimate = `~${Math.round(count * 0.85)} min estimated · untimed`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)" }}>
      <Sidebar />

      <main className="pw-main-content" style={{ maxWidth: 960 + SIDEBAR_WIDTH, marginRight: "auto", padding: "0 56px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, height: 60, borderBottom: "1px solid var(--border)", fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>
          <span>Extra practice</span>
          <span>Outside the thirty-day plan</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 244px", gap: 64, alignItems: "start", padding: "52px 0 0" }}>
          <div>
            <h1 style={{ fontWeight: 400, fontSize: 44, lineHeight: 1.04, letterSpacing: "-0.026em", color: "var(--text-strong)", margin: 0 }}>Practice as you like</h1>
            <p style={{ fontSize: 17, lineHeight: 1.62, color: "var(--text-muted)", margin: "20px 0 0", maxWidth: "50ch", textWrap: "pretty" }}>
              Extra sessions sharpen skills but do not advance the plan or the streak.{" "}
              <Link href="/for-you" style={{ color: "var(--accent)" }}>See what&apos;s picked for you →</Link>
            </p>

            <p style={microLabel}>Skills {selected.size > 0 && `· ${selected.size} selected`}</p>
            <div>
              {CATEGORIES.map((cat) => {
                const isOpen = expanded.has(cat.label);
                const selectedCount = cat.subcategories.filter((s) => selected.has(s)).length;
                return (
                  <div key={cat.label}>
                    <button onClick={() => toggleCategory(cat.label)} style={{
                      width: "100%", display: "flex", alignItems: "baseline", justifyContent: "space-between",
                      padding: "17px 4px", border: 0, borderBottom: "1px solid var(--border)", background: "transparent",
                      fontFamily: "var(--font-serif)", fontSize: 17, color: "var(--text-body)", cursor: "pointer", textAlign: "left",
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {cat.label}
                        {selectedCount > 0 && <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--accent)" }}>({selectedCount})</span>}
                      </span>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.16s" }}>›</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "4px 0 12px" }}>
                        {cat.subcategories.map((sub) => {
                          const isSelected = selected.has(sub);
                          return (
                            <button key={sub} onClick={() => toggleSubcategory(sub)} style={{
                              width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "9px 4px",
                              border: 0, background: "transparent", cursor: "pointer", textAlign: "left",
                            }}>
                              <span style={{
                                flexShrink: 0, width: 13, height: 13, borderRadius: 1,
                                border: `1px solid ${isSelected ? "var(--text-strong)" : "var(--border-strong)"}`,
                                background: isSelected ? "var(--text-strong)" : "transparent",
                              }} />
                              <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: isSelected ? "var(--text-strong)" : "var(--text-muted)" }}>{sub}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p style={microLabel}>Difficulty</p>
            {DIFFICULTY_OPTIONS.map((opt) => {
              const on = difficulty === opt.value;
              return (
                <button key={opt.value} onClick={() => setDifficulty(opt.value)} style={{
                  width: "100%", display: "flex", alignItems: "baseline", justifyContent: "space-between",
                  padding: "15px 14px", border: 0, borderBottom: "1px solid var(--border)",
                  borderLeft: `2px solid ${on ? "var(--accent)" : "transparent"}`,
                  background: on ? "var(--surface)" : "transparent",
                  fontFamily: "var(--font-serif)", fontSize: 16, color: on ? "var(--text-strong)" : "var(--text-body)",
                  cursor: "pointer", textAlign: "left",
                }}>
                  {opt.label}
                </button>
              );
            })}

            <p style={microLabel}>Number of questions</p>
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
              {COUNT_OPTIONS.map((n) => (
                <button key={n} onClick={() => setCount(n)} style={{
                  flex: 1, padding: "18px 0", border: 0, borderLeft: "1px solid var(--border)",
                  background: count === n ? "var(--brand)" : "transparent",
                  fontFamily: "var(--font-sans)", fontSize: 15, fontVariantNumeric: "tabular-nums",
                  color: count === n ? "var(--text-on-brand)" : "var(--text-muted)", cursor: "pointer",
                }}>
                  {n}
                </button>
              ))}
            </div>

            {error && (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", margin: "24px 0 0" }}>{error}</p>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 24, margin: "40px 0 0" }}>
              <button onClick={startSession} disabled={selected.size === 0 || loading} style={{
                border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)",
                fontSize: 14, fontWeight: 500, padding: "15px 30px", borderRadius: "var(--radius-lg)",
                cursor: selected.size === 0 || loading ? "default" : "pointer",
                opacity: selected.size === 0 || loading ? 0.5 : 1,
              }}>
                {loading ? "Building your session…" : "Start session"}
              </button>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>
                {selected.size === 0 ? "Choose at least one skill" : estimate}
              </span>
            </div>
          </div>

          <div style={{ borderLeft: "1px solid var(--border)", padding: "4px 0 4px 24px" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 16px" }}>This session</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 0 12px", borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
              <span style={{ fontSize: 15, color: "var(--text-muted)" }}>Skills</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-strong)", textAlign: "right" }}>{selectedLabel}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 0 12px", borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
              <span style={{ fontSize: 15, color: "var(--text-muted)" }}>Questions</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-strong)", fontVariantNumeric: "tabular-nums" }}>{count}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 0 12px", borderBottom: "1px solid var(--border)", marginBottom: 18 }}>
              <span style={{ fontSize: 15, color: "var(--text-muted)" }}>Counts toward</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>Nothing</span>
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.66, color: "var(--text-faint)", margin: 0 }}>
              Untimed and unrecorded by design. If you want the clock and the record, open today&apos;s plan day instead.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
