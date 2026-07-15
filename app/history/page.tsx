"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppNav, LoadingScreen } from "@/components/ui/nav";
import { Card, Badge, Button } from "@/components/ui/ds";
import type { Session } from "@/lib/types";

export default function HistoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      setSessions(data ?? []);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
      <AppNav maxWidth={720} />

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{
          fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "var(--text-xl)",
          letterSpacing: "var(--tracking-snug)", color: "var(--text-strong)", margin: "0 0 28px",
        }}>
          Session history
        </h1>

        {sessions.length === 0 ? (
          <Card tone="surface" padding="xl" radius="xl" shadow="sm" style={{ textAlign: "center" }}>
            <div style={{
              display: "inline-flex", width: 48, height: 48, borderRadius: 16,
              background: "var(--lilac-100)", color: "var(--brand)",
              alignItems: "center", justifyContent: "center",
              fontSize: 22, marginBottom: 16,
            }}>📋</div>
            <p style={{
              fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-base)",
              color: "var(--text-strong)", margin: "0 0 8px",
            }}>No sessions yet</p>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)",
              color: "var(--text-muted)", marginBottom: 24, lineHeight: "var(--leading-relaxed)",
            }}>
              Your completed sessions will appear here.
            </p>
            <Button onClick={() => router.push("/practice")}>Start your first session →</Button>
          </Card>
        ) : (
          <Card tone="surface" padding="none" radius="xl" shadow="sm" style={{ overflow: "hidden" }}>
            {sessions.map((s, idx) => (
              <div
                key={s.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "18px 24px",
                  borderTop: idx === 0 ? "none" : "1px solid var(--border)",
                }}
              >
                <div>
                  <p style={{
                    fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)",
                    color: "var(--text-strong)", margin: "0 0 4px", textTransform: "capitalize",
                  }}>
                    {s.domain_filter === "both" ? "Reading & Writing" : s.domain_filter}
                  </p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--text-faint)", margin: 0 }}>
                    {s.completed_at
                      ? new Date(s.completed_at).toLocaleDateString("en-US", {
                          weekday: "short", month: "short", day: "numeric", year: "numeric",
                        })
                      : "—"}
                    {" · "}{s.question_count} questions
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
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
          </Card>
        )}
      </main>
    </div>
  );
}
