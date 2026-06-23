"use client";

import Link from "next/link";
import { TopNav, NavLink } from "@/components/ui/nav";
import { Badge, Card } from "@/components/ui/ds";
import { Icon } from "@/components/ui/icon";

const features = [
  { icon: "zap", title: "Focused sessions", desc: "10-question sprints you can fit into any break." },
  { icon: "target", title: "Skill targeting", desc: "Drill exactly the skills where you're weakest." },
  { icon: "sparkles", title: "AI feedback", desc: "Personalized analysis after every session — not generic tips." },
];

const steps = [
  { n: "01", title: "Pick your focus", desc: "Choose Reading, Writing, or both — and how many questions." },
  { n: "02", title: "Answer questions", desc: "Real SAT-style passages and questions. No fluff, no filler." },
  { n: "03", title: "Review & reflect", desc: "See your score, skill breakdown, and personalized AI feedback." },
];

const primaryBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  padding: "14px 28px", fontFamily: "var(--font-sans)", fontWeight: 600,
  fontSize: "var(--text-base)", letterSpacing: "var(--tracking-snug)", lineHeight: 1,
  borderRadius: "var(--radius-pill)", textDecoration: "none", cursor: "pointer",
  border: "1px solid transparent", background: "var(--brand)", color: "#fff",
  boxShadow: "var(--shadow-brand)",
};

const ghostBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  padding: "14px 20px", fontFamily: "var(--font-sans)", fontWeight: 600,
  fontSize: "var(--text-base)", letterSpacing: "var(--tracking-snug)", lineHeight: 1,
  borderRadius: "var(--radius-pill)", textDecoration: "none", cursor: "pointer",
  border: "1px solid transparent", background: "transparent", color: "var(--text-muted)",
};

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <TopNav
        right={
          <>
            <NavLink href="/auth">Sign in</NavLink>
            <Link href="/auth?mode=signup" style={primaryBtn}>Get started</Link>
          </>
        }
      />

      {/* Hero */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", marginBottom: 28 }}>
          <Badge tone="lilac" dot>SAT Reading &amp; Writing</Badge>
        </div>
        <h1 style={{
          fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "var(--text-4xl)",
          lineHeight: "var(--leading-tight)", letterSpacing: "var(--tracking-tight)",
          color: "var(--text-strong)", margin: "0 0 22px",
        }}>
          Study smarter,<br />
          <span style={{ color: "var(--lilac-500)" }}>not harder.</span>
        </h1>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "var(--text-md)", color: "var(--text-muted)",
          lineHeight: "var(--leading-relaxed)", maxWidth: 480, margin: "0 auto 36px",
        }}>
          Short, focused practice sessions with AI-powered feedback — built for self-studiers
          who want real improvement, not just more questions.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/auth?mode=signup" style={primaryBtn}>
            Start practicing — it&apos;s free
            <Icon name="arrow-right" size={18} />
          </Link>
          <a href="#how-it-works" style={ghostBtn}>How it works</a>
        </div>
      </section>

      {/* Feature strip */}
      <section style={{
        background: "var(--canvas)",
        borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
        padding: "56px 24px",
      }}>
        <div style={{
          maxWidth: 960, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20,
        }}>
          {features.map((f) => (
            <Card key={f.title} tone="surface" padding="lg" radius="xl" shadow="sm">
              <span style={{
                display: "inline-flex", width: 44, height: 44, borderRadius: 14,
                background: "var(--lilac-100)", color: "var(--lilac-600)",
                alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <Icon name={f.icon} size={20} />
              </span>
              <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-strong)", margin: "0 0 6px" }}>{f.title}</h3>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-muted)", lineHeight: "var(--leading-relaxed)", margin: 0 }}>{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ maxWidth: 820, margin: "0 auto", padding: "72px 24px" }}>
        <h2 style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-xl)",
          letterSpacing: "var(--tracking-snug)", textAlign: "center",
          color: "var(--text-strong)", margin: "0 0 48px",
        }}>
          How it works
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32 }}>
          {steps.map((s) => (
            <div key={s.n}>
              <span style={{
                fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "var(--text-sm)",
                color: "var(--lilac-400)", display: "block", marginBottom: 12,
              }}>{s.n}</span>
              <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-strong)", margin: "0 0 8px" }}>{s.title}</h3>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-muted)", lineHeight: "var(--leading-relaxed)", margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{
          maxWidth: 720, margin: "0 auto",
          background: "var(--lilac-500)", borderRadius: "var(--radius-2xl)",
          padding: "52px 32px", textAlign: "center", boxShadow: "var(--shadow-lg)",
        }}>
          <h2 style={{
            fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "var(--text-2xl)",
            letterSpacing: "var(--tracking-tight)", color: "#fff", margin: "0 0 12px",
          }}>Ready to improve your score?</h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--lilac-100)", margin: "0 0 28px" }}>
            Free to use. No credit card. First session in under a minute.
          </p>
          <Link href="/auth?mode=signup" style={{
            ...primaryBtn, background: "#fff", color: "var(--lilac-700)", boxShadow: "var(--shadow-sm)",
          }}>
            Create your account
          </Link>
        </div>
      </section>

      <footer style={{
        borderTop: "1px solid var(--border)", padding: "26px 24px", textAlign: "center",
        fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--text-faint)",
      }}>
        PrepWise &copy; 2026 — SAT is a trademark of College Board.
      </footer>
    </div>
  );
}
