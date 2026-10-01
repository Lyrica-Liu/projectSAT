"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar, LoadingScreen, SIDEBAR_WIDTH } from "@/components/ui/nav";
import { Icon } from "@/components/ui/icon";

/** Most questions fit in one review sitting; the rest wait for the next one. */
const MAX_PER_SESSION = 20;

type Filter = "all" | "english" | "math";

interface Entry {
  questionId: string;
  addedAt: string;
  skill: string;
  difficulty: string;
  domain: string;
  stem: string;
  passage: string | null;
}

const microLabel: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500,
  letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)",
};

function skillLabel(skill: string): string {
  return skill.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function NotebookPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }

      const { data, error: loadErr } = await supabase
        .from("notebook_entries")
        .select("question_id, added_at, question:questions(skill, difficulty, domain, stem, passage)")
        .order("added_at", { ascending: false });

      if (loadErr) setError("Couldn't load your notebook.");
      setEntries(
        (data ?? []).flatMap((row) => {
          const q = (Array.isArray(row.question) ? row.question[0] : row.question) as
            { skill: string; difficulty: string; domain: string; stem: string; passage: string | null } | null;
          if (!q) return [];
          return [{ questionId: row.question_id as string, addedAt: row.added_at as string, ...q }];
        })
      );
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = entries.filter((e) =>
    filter === "all" ? true : filter === "math" ? e.domain === "math" : e.domain !== "math"
  );
  const counts = {
    all: entries.length,
    english: entries.filter((e) => e.domain !== "math").length,
    math: entries.filter((e) => e.domain === "math").length,
  };
  const selectedVisible = visible.filter((e) => selected.has(e.questionId));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function remove(id: string) {
    setError(null);
    const { error: delErr } = await supabase.from("notebook_entries").delete().eq("question_id", id);
    if (delErr) { setError("Couldn't remove that question. Please try again."); return; }
    setEntries((prev) => prev.filter((e) => e.questionId !== id));
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  async function practice(questionIds: string[]) {
    if (questionIds.length === 0) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/notebook/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not start the review session.");
      router.push(`/practice/${body.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the review session.");
      setStarting(false);
    }
  }

  if (loading) return <LoadingScreen message="Loading your notebook…" />;

  const practiceIds = (selectedVisible.length > 0 ? selectedVisible : visible).map((e) => e.questionId);
  const practiceLabel = selectedVisible.length > 0
    ? `Practice ${Math.min(selectedVisible.length, MAX_PER_SESSION)} selected`
    : `Practice ${Math.min(visible.length, MAX_PER_SESSION)}${filter === "all" ? "" : filter === "math" ? " Math" : " English"}`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)" }}>
      <Sidebar />

      <main className="pw-main-content" style={{ maxWidth: 960 + SIDEBAR_WIDTH, marginRight: "auto", padding: "0 56px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, height: 60, borderBottom: "1px solid var(--border)", fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>
          <span>Mistake notebook</span>
          <span>{entries.length} {entries.length === 1 ? "question" : "questions"}</span>
        </div>

        <div style={{ padding: "52px 0 0" }}>
          <h1 style={{ fontWeight: 400, fontSize: 44, lineHeight: 1.04, letterSpacing: "-0.026em", color: "var(--text-strong)", margin: 0 }}>Try them again</h1>
          <p style={{ fontSize: 17, lineHeight: 1.62, color: "var(--text-muted)", margin: "20px 0 0", maxWidth: "54ch", textWrap: "pretty" }}>
            Questions you saved from your results. Get one right in a review session and it leaves the notebook on its own.
          </p>

          {entries.length === 0 ? (
            <div style={{ margin: "44px 0 0", padding: "36px 32px", border: "1px dashed var(--line-strong)", borderRadius: "var(--radius-xl)", maxWidth: 620 }}>
              <p style={{ fontSize: 19, color: "var(--text-strong)", margin: "0 0 8px" }}>Nothing here yet.</p>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)", margin: 0 }}>
                After any session, open its results and use <strong style={{ fontWeight: 500, color: "var(--text-body)" }}>Add all wrong answers to notebook</strong>, or add questions one at a time.
              </p>
              <Link href="/dashboard" style={{ display: "inline-block", marginTop: 18, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--accent)" }}>Go to your dashboard →</Link>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", margin: "40px 0 0", paddingBottom: 14, borderBottom: "1px solid var(--line-strong)" }}>
                <div role="tablist" aria-label="Filter by subject" style={{ display: "flex", gap: 6 }}>
                  {(["all", "english", "math"] as Filter[]).map((f) => (
                    <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} style={{
                      border: `1px solid ${filter === f ? "var(--text-strong)" : "var(--border)"}`,
                      background: filter === f ? "var(--surface-sunken)" : "transparent",
                      color: filter === f ? "var(--text-strong)" : "var(--text-muted)",
                      borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 12, padding: "6px 12px", cursor: "pointer",
                    }}>
                      {f === "all" ? "All" : f === "english" ? "Reading & Writing" : "Math"} ({counts[f]})
                    </button>
                  ))}
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
                  {selectedVisible.length > 0 && (
                    <button onClick={() => setSelected(new Set())} style={{ border: 0, background: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>
                      Clear selection
                    </button>
                  )}
                  <button onClick={() => practice(practiceIds)} disabled={starting || practiceIds.length === 0} style={{
                    border: 0, background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)",
                    fontSize: 14, fontWeight: 500, padding: "12px 22px", borderRadius: "var(--radius-lg)",
                    cursor: starting || practiceIds.length === 0 ? "default" : "pointer", opacity: starting || practiceIds.length === 0 ? 0.5 : 1,
                  }}>
                    {starting ? "Starting…" : practiceLabel}
                  </button>
                </span>
              </div>
              {practiceIds.length > MAX_PER_SESSION && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", margin: "10px 0 0" }}>
                  A review session holds up to {MAX_PER_SESSION} questions — the oldest go first.
                </p>
              )}
              {error && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--danger)", margin: "12px 0 0" }}>{error}</p>}

              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {visible.map((e) => {
                  const isSel = selected.has(e.questionId);
                  return (
                    <li key={e.questionId} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "18px 4px", borderBottom: "1px solid var(--border)" }}>
                      <input
                        type="checkbox" checked={isSel} onChange={() => toggle(e.questionId)}
                        aria-label={`Select: ${e.stem.slice(0, 60)}`}
                        style={{ marginTop: 4, width: 16, height: 16, flexShrink: 0, cursor: "pointer" }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ ...microLabel, margin: "0 0 6px" }}>
                          {e.domain === "math" ? "Math" : "Reading & Writing"} · {skillLabel(e.skill)} · {e.difficulty}
                        </p>
                        {/* Many R&W stems are identical ("Which choice completes the text…"), so lead
                            with the passage — that's what tells the questions apart. */}
                        {e.passage && (
                          <p style={{
                            fontSize: 15, lineHeight: 1.55, color: "var(--text-body)", margin: "0 0 4px",
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                          }}>{e.passage}</p>
                        )}
                        <p style={{
                          fontSize: e.passage ? 14 : 16, lineHeight: 1.5, color: e.passage ? "var(--text-muted)" : "var(--text-strong)", margin: 0,
                          display: "-webkit-box", WebkitLineClamp: e.passage ? 1 : 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                          fontStyle: e.passage ? "italic" : "normal",
                        }}>{e.stem}</p>
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", margin: "6px 0 0" }}>
                          Added {new Date(e.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <button onClick={() => remove(e.questionId)} aria-label="Remove from notebook" title="Remove from notebook" style={{
                        flexShrink: 0, width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
                        border: "1px solid var(--border)", background: "transparent", borderRadius: "var(--radius-sm)",
                        color: "var(--text-faint)", cursor: "pointer", padding: 0,
                      }}>
                        <Icon name="x" size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
