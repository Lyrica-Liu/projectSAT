"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar, SIDEBAR_WIDTH } from "@/components/ui/nav";
import { ResumeCard } from "@/components/practice/resume-card";
import { createClient } from "@/lib/supabase/client";
import { ENGLISH_CATEGORY_ORDER, MATH_CATEGORY_ORDER } from "@/lib/plan";
import { buildSkillInsight, byWeakness, tallyByTier, type SkillInsight } from "@/lib/insights";
import type { Difficulty } from "@/lib/types";

/** Subject → (for Reading & Writing) the SAT's four content domains → skills. Math has no middle level. */
const SUBJECTS: { label: string; groups: { label: string; subcategories: string[] }[] | null; subcategories: string[] }[] = [
  {
    label: "Reading & Writing",
    groups: [
      {
        label: "Information and Ideas",
        subcategories: ["Central Ideas and Details", "Command of Evidence (Textual)", "Command of Evidence (Quantitative)", "Inferences"],
      },
      { label: "Craft and Structure", subcategories: ["Words in Context", "Text Structure and Purpose", "Cross-Text Connections"] },
      { label: "Expression of Ideas", subcategories: ["Transitions", "Rhetorical Synthesis"] },
      { label: "Standard English Conventions", subcategories: ["Boundaries", "Form, Structure, and Sense"] },
    ],
    subcategories: [],
  },
  { label: "Math", groups: null, subcategories: MATH_CATEGORY_ORDER.map((c) => c.subcategory) },
];

const subcategoriesOf = (subject: typeof SUBJECTS[number]) =>
  subject.groups ? subject.groups.flatMap((g) => g.subcategories) : subject.subcategories;

/** How many weak spots to recommend at most. */
const MAX_RECOMMENDED = 3;

interface Recommendation {
  insight: SkillInsight;
  subject: "Reading & Writing" | "Math";
  subcategories: string[];
}

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium-low", label: "Medium low" },
  { value: "medium-high", label: "Medium high" },
  { value: "hard", label: "Hard" },
];

/** Short sets on purpose — quick to finish, results right away. */
const COUNT_OPTIONS = [5, 10];

const microLabel: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500,
  letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)",
  margin: "40px 0 0", paddingBottom: 12, borderBottom: "1px solid var(--line-strong)", display: "block",
};

export default function PracticeSetupPage() {
  const router = useRouter();
  const [recommended, setRecommended] = useState<Recommendation[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [difficulty, setDifficulty] = useState<Difficulty>("medium-high");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recommendations use the same insight logic as For You: practiced skills, weakest first.
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [answersRes, progressRes] = await Promise.all([
        supabase.from("answers").select("is_correct, question:questions(skill, difficulty)").not("is_correct", "is", null),
        supabase.from("category_progress").select("subcategory, difficulty"),
      ]);
      const byTier = tallyByTier(answersRes.data ?? []);
      const progress = new Map((progressRes.data ?? []).map((r) => [r.subcategory as string, r.difficulty as Difficulty]));

      const english: Recommendation[] = [...new Set(ENGLISH_CATEGORY_ORDER.map((c) => c.skill))].map((skill) => {
        const subcategories = ENGLISH_CATEGORY_ORDER.filter((c) => c.skill === skill).map((c) => c.subcategory);
        const label = subcategories.length > 1 ? subcategories[0].replace(/\s*\(.*\)$/, "") : subcategories[0];
        return { subject: "Reading & Writing", subcategories, insight: buildSkillInsight(skill, label, "", subcategories, byTier, progress) };
      });
      const math: Recommendation[] = MATH_CATEGORY_ORDER.map((c) => ({
        subject: "Math", subcategories: [c.subcategory],
        insight: buildSkillInsight(c.skill, c.subcategory, "", [c.subcategory], byTier, progress),
      }));

      setRecommended(
        [...english, ...math]
          .filter((r) => r.insight.hasData)
          .sort((a, b) => byWeakness(a.insight, b.insight))
          .slice(0, MAX_RECOMMENDED)
      );
    })();
  }, []);

  const recommendedSubs = new Set((recommended ?? []).flatMap((r) => r.subcategories));

  /** Picking a recommendation selects its skill(s) at the difficulty For You suggests for it. */
  function toggleRecommendation(r: Recommendation) {
    const allOn = r.subcategories.every((sub) => selected.has(sub));
    setSelected((prev) => {
      const next = new Set(prev);
      r.subcategories.forEach((sub) => (allOn ? next.delete(sub) : next.add(sub)));
      return next;
    });
    if (!allOn) setDifficulty(r.insight.suggestedTier);
  }

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
  const estimate = `About ${Math.round(count * 1.5)} minutes`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)" }}>
      <Sidebar />

      <main className="pw-main-content" style={{ maxWidth: 960 + SIDEBAR_WIDTH, marginRight: "auto", padding: "0 56px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, height: 60, borderBottom: "1px solid var(--border)", fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>
          <span>Extra practice</span>
          <span>Any skill, any time</span>
        </div>

        <ResumeCard style={{ margin: "24px 0 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 244px", gap: 64, alignItems: "start", padding: "52px 0 0" }}>
          <div>
            <h1 style={{ fontWeight: 400, fontSize: 44, lineHeight: 1.04, letterSpacing: "-0.026em", color: "var(--text-strong)", margin: 0 }}>Practice as you like</h1>
            <p style={{ fontSize: 17, lineHeight: 1.62, color: "var(--text-muted)", margin: "20px 0 0", maxWidth: "50ch", textWrap: "pretty" }}>
              Short sets of 5 or 10, with your score and every explanation as soon as you finish.{" "}
              <Link href="/for-you" style={{ color: "var(--accent)" }}>See what&apos;s picked for you →</Link>
            </p>

            {recommended && recommended.length > 0 && (
              <>
                <p style={{ ...microLabel, color: "var(--accent)", borderBottomColor: "var(--accent)" }}>Recommended for you</p>
                <div style={{ display: "grid", gap: 8, padding: "14px 0 0" }}>
                  {recommended.map((r) => {
                    const on = r.subcategories.every((sub) => selected.has(sub));
                    return (
                      <button key={r.insight.skill} onClick={() => toggleRecommendation(r)} aria-pressed={on} style={{
                        display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", cursor: "pointer",
                        padding: "14px 16px", borderRadius: "var(--radius-md)",
                        border: `1px solid ${on ? "var(--accent)" : "var(--accent-soft)"}`,
                        background: "var(--accent-soft)",
                      }}>
                        <Checkbox on={on} accent />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontFamily: "var(--font-serif)", fontSize: 17, color: "var(--text-strong)" }}>{r.insight.label}</span>
                          <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                            {r.subject} · {r.insight.accuracy}% accuracy · try {r.insight.suggestedLabel}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            {recommended && recommended.length === 0 && (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", margin: "28px 0 0" }}>
                Finish a session and we&apos;ll recommend the skills worth extra practice.
              </p>
            )}

            <p style={microLabel}>Skills {selected.size > 0 && `· ${selected.size} selected`}</p>
            <div>
              {SUBJECTS.map((subject) => {
                const subs = subcategoriesOf(subject);
                return (
                  <div key={subject.label}>
                    <TreeRow
                      level={0} label={subject.label} open={expanded.has(subject.label)} onToggle={() => toggleCategory(subject.label)}
                      selectedCount={subs.filter((x) => selected.has(x)).length}
                      hasRecommended={subs.some((x) => recommendedSubs.has(x))}
                    />
                    {expanded.has(subject.label) && (
                      <div style={{ paddingBottom: 6 }}>
                        {subject.groups
                          ? subject.groups.map((g) => (
                            <div key={g.label}>
                              <TreeRow
                                level={1} label={g.label} open={expanded.has(g.label)} onToggle={() => toggleCategory(g.label)}
                                selectedCount={g.subcategories.filter((x) => selected.has(x)).length}
                                hasRecommended={g.subcategories.some((x) => recommendedSubs.has(x))}
                              />
                              {expanded.has(g.label) && (
                                <div style={{ padding: "4px 0 10px" }}>
                                  {g.subcategories.map((sub) => (
                                    <SkillOption key={sub} level={2} label={sub} on={selected.has(sub)} recommended={recommendedSubs.has(sub)} onToggle={() => toggleSubcategory(sub)} />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                          : (
                            <div style={{ padding: "4px 0 10px" }}>
                              {subject.subcategories.map((sub) => (
                                <SkillOption key={sub} level={1} label={sub} on={selected.has(sub)} recommended={recommendedSubs.has(sub)} onToggle={() => toggleSubcategory(sub)} />
                              ))}
                            </div>
                          )}
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
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-strong)" }}>Your skill levels</span>
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.66, color: "var(--text-faint)", margin: 0 }}>
              Every set updates how strong you are in each skill. The countdown timer is off unless you turn it on.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Checkbox({ on, accent = false }: { on: boolean; accent?: boolean }) {
  const color = accent ? "var(--accent)" : "var(--text-strong)";
  return (
    <span aria-hidden style={{
      flexShrink: 0, width: 13, height: 13, borderRadius: 1,
      border: `1px solid ${on ? color : accent ? "var(--accent)" : "var(--border-strong)"}`,
      background: on ? color : "transparent",
    }} />
  );
}

/** An expandable subject (level 0) or Reading & Writing domain (level 1) row. */
function TreeRow({ level, label, open, onToggle, selectedCount, hasRecommended }: {
  level: 0 | 1; label: string; open: boolean; onToggle: () => void; selectedCount: number; hasRecommended: boolean;
}) {
  return (
    <button onClick={onToggle} aria-expanded={open} style={{
      width: "100%", display: "flex", alignItems: "baseline", justifyContent: "space-between",
      padding: level === 0 ? "18px 4px" : "13px 4px 13px 22px", border: 0,
      borderBottom: `1px solid ${level === 0 ? "var(--border)" : "var(--surface-2)"}`, background: "transparent",
      fontFamily: "var(--font-serif)", fontSize: level === 0 ? 19 : 16,
      color: level === 0 ? "var(--text-strong)" : "var(--text-body)", cursor: "pointer", textAlign: "left",
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {label}
        {hasRecommended && <span title="Contains a recommended skill" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />}
        {selectedCount > 0 && <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)" }}>({selectedCount})</span>}
      </span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.16s" }}>›</span>
    </button>
  );
}

function SkillOption({ level, label, on, recommended, onToggle }: {
  level: 1 | 2; label: string; on: boolean; recommended: boolean; onToggle: () => void;
}) {
  return (
    <button onClick={onToggle} aria-pressed={on} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 12,
      padding: `9px 8px 9px ${level === 1 ? 26 : 44}px`, border: 0, borderRadius: "var(--radius-sm)",
      background: recommended ? "var(--accent-soft)" : "transparent", cursor: "pointer", textAlign: "left",
    }}>
      <Checkbox on={on} accent={recommended} />
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: recommended ? "var(--accent)" : on ? "var(--text-strong)" : "var(--text-muted)", fontWeight: recommended ? 500 : 400 }}>{label}</span>
      {recommended && (
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)" }}>Recommended</span>
      )}
    </button>
  );
}
