"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TopNav, NavLink } from "@/components/ui/nav";
import { Button, ChoiceCard } from "@/components/ui/ds";
import { Icon } from "@/components/ui/icon";
import type { QuestionDomain } from "@/lib/types";

const DOMAIN_OPTIONS: { value: QuestionDomain | "both"; label: string; desc: string }[] = [
  { value: "both", label: "Reading & Writing", desc: "Mix of both domains" },
  { value: "reading", label: "Reading", desc: "Passages & comprehension" },
  { value: "writing", label: "Writing", desc: "Grammar & expression" },
];

const COUNT_OPTIONS = [5, 10, 15, 20];

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: 600,
  letterSpacing: "var(--tracking-caps)", textTransform: "uppercase",
  color: "var(--text-faint)", margin: "0 0 12px", display: "block",
};

export default function PracticeSetupPage() {
  const router = useRouter();
  const [domain, setDomain] = useState<QuestionDomain | "both">("both");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSession() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("sessions")
      .insert({ user_id: user.id, question_count: count, domain_filter: domain })
      .select("id")
      .single();

    if (insertError || !data) {
      setError("Could not create session. Please try again.");
      setLoading(false);
      return;
    }

    router.push(`/practice/${data.id}`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", display: "flex", flexDirection: "column" }}>
      <TopNav
        homeHref="/dashboard"
        maxWidth={760}
        right={<NavLink href="/dashboard">← Dashboard</NavLink>}
      />

      <main style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "56px 24px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <h1 style={{
            fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "var(--text-xl)",
            letterSpacing: "var(--tracking-snug)", color: "var(--text-strong)", margin: "0 0 6px",
          }}>Set up your session</h1>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)",
            color: "var(--text-muted)", margin: "0 0 30px",
          }}>Pick what you want to practice and how many questions.</p>

          {/* Domain */}
          <span style={eyebrow}>Domain</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 30 }}>
            {DOMAIN_OPTIONS.map((opt) => (
              <ChoiceCard
                key={opt.value}
                label={opt.label}
                desc={opt.desc}
                selected={domain === opt.value}
                onClick={() => setDomain(opt.value)}
              />
            ))}
          </div>

          {/* Question count */}
          <span style={eyebrow}>Number of questions</span>
          <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
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
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)",
            color: "var(--text-faint)", margin: "0 0 30px",
          }}>
            ~{Math.round(count * 0.8)} min estimated
          </p>

          {error && (
            <div style={{
              fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)",
              color: "var(--danger)", background: "var(--danger-surface)",
              borderRadius: "var(--radius-md)", padding: "10px 14px",
              lineHeight: "var(--leading-normal)", marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <Button
            full
            size="lg"
            onClick={startSession}
            disabled={loading}
            iconRight={<Icon name="arrow-right" size={18} />}
          >
            {loading ? "Starting…" : "Start session"}
          </Button>
        </div>
      </main>
    </div>
  );
}
