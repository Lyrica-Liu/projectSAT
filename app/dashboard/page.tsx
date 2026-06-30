"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TopNav, NavLink } from "@/components/ui/nav";
import { Card, Avatar, Badge, SkillBar } from "@/components/ui/ds";
import type { Session, SkillStat, QuestionSkill } from "@/lib/types";

const SKILL_LABELS: Record<QuestionSkill, string> = {
  central_idea: "Central Idea",
  command_of_evidence: "Command of Evidence",
  inferences: "Inferences",
  words_in_context: "Words in Context",
  cross_text_connections: "Cross-Text Connections",
  text_structure: "Text Structure",
  boundaries: "Boundaries",
  form_structure_sense: "Form, Structure & Sense",
  transitions: "Transitions",
  rhetorical_synthesis: "Rhetorical Synthesis",
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("there");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [skillStats, setSkillStats] = useState<SkillStat[]>([]);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth");
        return;
      }

      setDisplayName(
        user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "there"
      );

      const { data: sessionData } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(10);

      const allSessions: Session[] = sessionData ?? [];
      setSessions(allSessions);

      const sessionIds = allSessions.map((s) => s.id);
      if (sessionIds.length > 0) {
        const { data: answerRows } = await supabase
          .from("answers")
          .select("is_correct, question:questions(skill)")
          .in("session_id", sessionIds);

        const skillMap: Record<string, { total: number; correct: number }> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (answerRows ?? []).forEach((row: any) => {
          const q = Array.isArray(row.question) ? row.question[0] : row.question;
          const skill: string | undefined = q?.skill;
          if (!skill) return;
          if (!skillMap[skill]) skillMap[skill] = { total: 0, correct: 0 };
          skillMap[skill].total++;
          if (row.is_correct) skillMap[skill].correct++;
        });

        setSkillStats(
          Object.entries(skillMap).map(([skill, { total, correct }]) => ({
            skill: skill as QuestionSkill,
            total,
            correct,
            accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
          }))
        );
      }

      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const avgScore =
    sessions.length > 0
      ? Math.round(sessions.reduce((acc, s) => acc + (s.score ?? 0), 0) / sessions.length)
      : null;

  const sortedSkills = [...skillStats].sort((a, b) => a.accuracy - b.accuracy);
  const weakestSkill =
    sortedSkills.length > 0 ? SKILL_LABELS[sortedSkills[0].skill] : null;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--canvas)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-faint)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
      <TopNav
        homeHref="/dashboard"
        right={
          <>
            <NavLink href="/history">History</NavLink>
            <form action="/auth/signout" method="post" style={{ display: "inline" }}>
              <button
                type="submit"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "var(--font-sans)", fontWeight: 500,
                  fontSize: "var(--text-sm)", color: "var(--text-muted)", padding: "6px 4px",
                }}
              >
                Sign out
              </button>
            </form>
            <Avatar name={displayName} size={32} />
          </>
        }
      />

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        {/* Greeting */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "var(--text-xl)",
            letterSpacing: "var(--tracking-snug)", color: "var(--text-strong)", margin: "0 0 6px",
          }}>
            Hey, {displayName}!
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: 0 }}>
            Ready for a session? Let&apos;s keep the streak going.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Sessions done", value: String(sessions.length), mono: true },
            { label: "Avg. score", value: avgScore !== null ? `${avgScore}%` : "—", mono: true },
            { label: "Skills tracked", value: String(skillStats.length), mono: true },
            { label: "Weakest skill", value: weakestSkill ?? "—", mono: false },
          ].map((s) => (
            <Card key={s.label} tone="surface" padding="lg" radius="lg" shadow="sm">
              <p style={{
                fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: 500,
                color: "var(--text-faint)", margin: "0 0 8px",
                textTransform: "uppercase", letterSpacing: "var(--tracking-caps)",
              }}>{s.label}</p>
              <p style={{
                fontFamily: s.mono ? "var(--font-mono)" : "var(--font-sans)",
                fontWeight: 700,
                fontSize: s.mono ? "var(--text-xl)" : "var(--text-base)",
                color: "var(--text-strong)", margin: 0,
                lineHeight: s.mono ? 1 : "var(--leading-snug)",
              }}>{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Main grid: CTA + Skills */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 20 }}>
          <div style={{
            background: "var(--gradient-radiant)",
            borderRadius: "var(--radius-xl)",
            padding: "28px",
            boxShadow: "0 8px 28px rgba(168, 85, 247, 0.30)",
            overflow: "hidden",
          }}>
            <h2 style={{
              fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-lg)",
              color: "#fff", margin: "0 0 10px",
            }}>Start a session</h2>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)",
              color: "rgba(255,255,255,0.85)", margin: "0 0 24px",
              lineHeight: "var(--leading-relaxed)",
            }}>
              10 questions. ~8 minutes. Instant AI feedback.
            </p>
            <Link href="/practice" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "11px 20px", background: "#fff", color: "var(--lilac-700)",
              fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)",
              borderRadius: "var(--radius-pill)", textDecoration: "none",
              boxShadow: "var(--shadow-sm)",
            }}>
              Practice now →
            </Link>
          </div>

          <Card tone="surface" padding="lg" radius="xl" shadow="sm">
            <h2 style={{
              fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)",
              color: "var(--text-strong)", margin: "0 0 20px",
            }}>Skill accuracy</h2>
            {sortedSkills.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 0" }}>
                <p style={{
                  fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)",
                  color: "var(--text-faint)", textAlign: "center",
                }}>
                  Complete a session to see your skill breakdown.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {sortedSkills.map((s) => (
                  <SkillBar
                    key={s.skill}
                    label={SKILL_LABELS[s.skill] ?? s.skill}
                    accuracy={s.accuracy}
                    detail={`${s.correct}/${s.total}`}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent sessions */}
        {sessions.length > 0 && (
          <Card tone="surface" padding="lg" radius="xl" shadow="sm">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{
                fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)",
                color: "var(--text-strong)", margin: 0,
              }}>Recent sessions</h2>
              <Link href="/history" style={{
                fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: 500,
                color: "var(--text-faint)", textDecoration: "none",
              }}>View all →</Link>
            </div>
            <div>
              {sessions.slice(0, 5).map((s, i) => (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 0",
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                }}>
                  <div>
                    <p style={{
                      fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)",
                      color: "var(--text-strong)", margin: "0 0 3px", textTransform: "capitalize",
                    }}>
                      {s.domain_filter === "both" ? "Reading & Writing" : s.domain_filter}
                    </p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--text-faint)", margin: 0 }}>
                      {s.completed_at
                        ? new Date(s.completed_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <Badge tone={(s.score ?? 0) >= 75 ? "mint" : (s.score ?? 0) >= 50 ? "butter" : "rose"}>
                      {s.score ?? "—"}%
                    </Badge>
                    <Link href={`/results/${s.id}`} style={{
                      fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: 500,
                      color: "var(--text-faint)", textDecoration: "none",
                    }}>Review →</Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
