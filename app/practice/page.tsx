"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav, NavLink } from "@/components/ui/nav";
import { Button, ChoiceCard } from "@/components/ui/ds";
import { Icon } from "@/components/ui/icon";
import type { Difficulty } from "@/lib/types";

const CATEGORIES: { label: string; subcategories: string[] }[] = [
  {
    label: "Information and Ideas",
    subcategories: [
      "Central Ideas and Details",
      "Command of Evidence (Textual)",
      "Command of Evidence (Quantitative)",
      "Inferences",
    ],
  },
  {
    label: "Craft and Structure",
    subcategories: [
      "Words in Context",
      "Text Structure and Purpose",
      "Cross-Text Connections",
    ],
  },
  {
    label: "Expression of Ideas",
    subcategories: ["Transitions", "Rhetorical Synthesis"],
  },
  {
    label: "Standard English Conventions",
    subcategories: ["Boundaries", "Form, Structure, and Sense"],
  },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "easy",        label: "Easy" },
  { value: "medium-low",  label: "Medium Low" },
  { value: "medium-high", label: "Medium High" },
  { value: "hard",        label: "Hard" },
];

const COUNT_OPTIONS = [5, 10, 15, 20];

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: 600,
  letterSpacing: "var(--tracking-caps)", textTransform: "uppercase",
  color: "var(--text-faint)", margin: "0 0 10px", display: "block",
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
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subcategories: Array.from(selected), difficulty, count }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to generate questions");
      sessionId = body.sessionId;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not generate questions. Please try again.");
      setLoading(false);
      return;
    }

    router.push(`/practice/${sessionId}`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", display: "flex", flexDirection: "column" }}>
      <TopNav
        homeHref="/dashboard"
        maxWidth={900}
        right={<NavLink href="/dashboard">← Dashboard</NavLink>}
      />

      <main style={{ flex: 1, maxWidth: 900, width: "100%", margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{
          fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "var(--text-xl)",
          letterSpacing: "var(--tracking-snug)", color: "var(--text-strong)", margin: "0 0 32px",
        }}>Set up your session</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>

          {/* Left — category accordion + subcategory multi-select */}
          <div>
            <span style={eyebrow}>
              Skills
              {selected.size > 0 && (
                <span style={{
                  marginLeft: 8, fontFamily: "var(--font-mono)", fontWeight: 500,
                  color: "var(--brand)", fontSize: "var(--text-xs)", letterSpacing: 0,
                  textTransform: "none",
                }}>
                  {selected.size} selected
                </span>
              )}
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CATEGORIES.map((cat) => {
                const isOpen = expanded.has(cat.label);
                const selectedCount = cat.subcategories.filter((s) => selected.has(s)).length;

                return (
                  <div key={cat.label}>
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(cat.label)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center",
                        justifyContent: "space-between",
                        padding: "13px 16px",
                        fontFamily: "var(--font-sans)", fontWeight: 600,
                        fontSize: "var(--text-sm)", cursor: "pointer",
                        background: isOpen ? "var(--lilac-50)" : "var(--surface)",
                        border: `1.5px solid ${isOpen ? "var(--lilac-300)" : "var(--border-strong)"}`,
                        borderBottom: isOpen ? "none" : `1.5px solid ${isOpen ? "var(--lilac-300)" : "var(--border-strong)"}`,
                        borderRadius: isOpen
                          ? "var(--radius-md) var(--radius-md) 0 0"
                          : "var(--radius-md)",
                        color: isOpen ? "var(--brand-ink)" : "var(--text-strong)",
                        transition: "all var(--dur-base) var(--ease-out)",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {cat.label}
                        {selectedCount > 0 && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 20, height: 20, borderRadius: "var(--radius-pill)",
                            background: "var(--lilac-500)", color: "#fff",
                            fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
                          }}>
                            {selectedCount}
                          </span>
                        )}
                      </span>
                      <span style={{
                        fontSize: 12, color: "var(--text-faint)",
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform var(--dur-base) var(--ease-out)",
                        display: "inline-block",
                      }}>▶</span>
                    </button>

                    {/* Subcategory panel */}
                    {isOpen && (
                      <div style={{
                        border: "1.5px solid var(--lilac-300)",
                        borderTop: "none",
                        borderRadius: "0 0 var(--radius-md) var(--radius-md)",
                        background: "var(--surface)",
                        padding: "6px 8px 10px",
                      }}>
                        {cat.subcategories.map((sub) => {
                          const isSelected = selected.has(sub);
                          return (
                            <button
                              key={sub}
                              onClick={() => toggleSubcategory(sub)}
                              style={{
                                width: "100%", display: "flex", alignItems: "center", gap: 10,
                                padding: "9px 10px", border: "none", cursor: "pointer",
                                borderRadius: "var(--radius-sm)",
                                background: isSelected ? "var(--lilac-50)" : "transparent",
                                transition: "background var(--dur-fast) var(--ease-out)",
                                textAlign: "left",
                              }}
                            >
                              {/* Check indicator */}
                              <span style={{
                                flexShrink: 0,
                                width: 18, height: 18, borderRadius: 5,
                                border: isSelected ? "none" : "1.5px solid var(--border-strong)",
                                background: isSelected ? "var(--lilac-500)" : "transparent",
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                color: "#fff", fontSize: 11, fontWeight: 700,
                                transition: "all var(--dur-fast) var(--ease-out)",
                              }}>
                                {isSelected && "✓"}
                              </span>
                              <span style={{
                                fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)",
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected ? "var(--brand-ink)" : "var(--text-body)",
                              }}>
                                {sub}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — difficulty + count */}
          <div>
            <span style={eyebrow}>Difficulty</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {DIFFICULTY_OPTIONS.map((opt) => (
                <ChoiceCard
                  key={opt.value}
                  label={opt.label}
                  selected={difficulty === opt.value}
                  onClick={() => setDifficulty(opt.value)}
                />
              ))}
            </div>

            <span style={eyebrow}>Number of questions</span>
            <div style={{ display: "flex", gap: 10 }}>
              {COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  style={{
                    flex: 1, padding: "13px 0", borderRadius: "var(--radius-md)",
                    fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-sm)",
                    cursor: "pointer", transition: "all var(--dur-base) var(--ease-out)",
                    background: count === n ? "var(--lilac-50)" : "var(--surface)",
                    border: `1.5px solid ${count === n ? "var(--lilac-300)" : "var(--border-strong)"}`,
                    color: count === n ? "var(--brand-ink)" : "var(--text-body)",
                    boxShadow: count === n ? `0 0 0 4px var(--focus-ring)` : "none",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start button */}
        <div style={{ marginTop: 36 }}>
          {error && (
            <div style={{
              fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)",
              color: "var(--danger)", background: "var(--danger-surface)",
              borderRadius: "var(--radius-md)", padding: "10px 14px",
              lineHeight: "var(--leading-normal)", marginBottom: 14,
            }}>
              {error}
            </div>
          )}
          <Button
            full size="lg"
            onClick={startSession}
            disabled={selected.size === 0 || loading}
            iconRight={!loading ? <Icon name="arrow-right" size={18} /> : undefined}
          >
            {loading
              ? "Generating questions with AI…"
              : selected.size > 0
              ? `Start session — ${selected.size} skill${selected.size > 1 ? "s" : ""}`
              : "Start session"}
          </Button>
          {selected.size === 0 && !loading && (
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)",
              color: "var(--text-faint)", textAlign: "center", marginTop: 10,
            }}>
              Open a category and select at least one skill to continue
            </p>
          )}
          {loading && (
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)",
              color: "var(--text-faint)", textAlign: "center", marginTop: 10,
            }}>
              Claude is writing your questions — this takes about 15–20 seconds.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
