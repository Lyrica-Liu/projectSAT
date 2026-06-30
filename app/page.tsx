"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/ui/nav";
import { Button, Badge, Card, AnswerOption } from "@/components/ui/ds";
import { Icon } from "@/components/ui/icon";

const BENEFITS = [
  {
    icon: "coffee", bg: "var(--lilac-100)", color: "var(--lilac-600)",
    title: "Short by design",
    desc: "Sessions fit in a coffee break. Come as you are, leave a little sharper.",
  },
  {
    icon: "compass", bg: "var(--rose-surface)", color: "var(--rose-ink)",
    title: "Knows your gaps",
    desc: "We quietly track each skill and point you to what'll help most next.",
  },
  {
    icon: "message-circle-heart", bg: "var(--lilac-100)", color: "var(--lilac-600)",
    title: "Feedback with warmth",
    desc: "Notes that explain, encourage, and never make you feel behind.",
  },
];

const WHY_ITEMS = [
  {
    icon: "user-check", bg: "var(--lilac-100)", color: "var(--lilac-600)",
    title: "A tutor's feedback, on your own time",
    desc: "Every answer comes with a plain-language explanation of why — so you learn the reasoning, not just the right letter.",
  },
  {
    icon: "trending-up", bg: "var(--rose-surface)", color: "var(--rose-ink)",
    title: "Know exactly what to fix next",
    desc: "We track your accuracy by skill and surface your weakest areas first, so your limited study time goes where it counts.",
  },
  {
    icon: "calendar-check", bg: "var(--lilac-100)", color: "var(--lilac-600)",
    title: "Built for staying consistent",
    desc: "Bite-sized sessions are easy to start and easy to repeat — the habit that actually moves SAT scores, not the all-nighter.",
  },
  {
    icon: "wallet", bg: "var(--rose-surface)", color: "var(--rose-ink)",
    title: "Free, and on your side",
    desc: "No paywalls between you and practice. Real SAT-style Reading & Writing questions, free to use whenever you're ready.",
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh", fontFamily: "var(--font-sans)", overflowX: "hidden" }}>

      {/* Nav */}
      <nav style={{ maxWidth: 1080, margin: "0 auto", padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Wordmark />
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Link href="/auth" style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--text-muted)", textDecoration: "none" }}>
            Sign in
          </Link>
          <Button size="sm" variant="soft" onClick={() => router.push("/auth?mode=signup")}>Get started</Button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 28px 72px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>

        {/* Left */}
        <div>
          <div style={{ display: "inline-flex", marginBottom: 22 }}>
            <Badge tone="rose" dot>Made for self-studiers</Badge>
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "var(--text-4xl)", lineHeight: 1.05, letterSpacing: "var(--tracking-tight)", color: "var(--text-strong)", margin: "0 0 20px" }}>
            A calmer way to<br />prep for the{" "}
            <span style={{ background: "var(--gradient-radiant)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>SAT.</span>
          </h1>
          <p style={{ fontSize: "var(--text-md)", color: "var(--text-body)", lineHeight: "var(--leading-relaxed)", maxWidth: 420, margin: "0 0 32px" }}>
            Short, focused practice with feedback that actually sounds like a person. No cram marathons — just steady, kind progress.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Button size="lg" onClick={() => router.push("/auth?mode=signup")} iconRight={<Icon name="arrow-right" size={18} />}>
              Start practicing — free
            </Button>
            <Button size="lg" variant="ghost" onClick={() => {
              document.getElementById("why")?.scrollIntoView({ behavior: "smooth" });
            }}>
              See how it works
            </Button>
          </div>
        </div>

        {/* Right — product preview */}
        <div style={{
          background: "linear-gradient(var(--lilac-100),var(--lilac-100)) padding-box, var(--gradient-radiant) border-box",
          border: "6px solid transparent",
          borderRadius: "var(--radius-2xl)",
          padding: 24,
          position: "relative",
        }}>
          <span style={{ position: "absolute", top: -18, right: 24, width: 64, height: 64, borderRadius: "50%", background: "var(--rose-surface)" }} />
          <span style={{ position: "absolute", bottom: 30, left: -16, width: 40, height: 40, borderRadius: "50%", background: "var(--lilac-200)" }} />
          <div style={{ position: "relative", background: "var(--surface)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Badge tone="lilac">Reading</Badge>
              <Badge tone="butter" dot>Medium</Badge>
            </div>
            <p style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-strong)", lineHeight: "var(--leading-snug)", margin: "0 0 14px" }}>
              As used in the text, &ldquo;terse&rdquo; most nearly means
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              <AnswerOption letter="A" state="muted">lengthy</AnswerOption>
              <AnswerOption letter="B" state="muted">rude</AnswerOption>
              <AnswerOption letter="C" state="correct">concise</AnswerOption>
              <AnswerOption letter="D" state="muted">unclear</AnswerOption>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--rose-surface)", borderRadius: "var(--radius-lg)", padding: "14px 16px" }}>
              <Icon name="sparkles" size={16} color="var(--rose-ink)" />
              <p style={{ fontSize: "var(--text-sm)", color: "var(--rose-ink)", lineHeight: "var(--leading-normal)", margin: 0 }}>
                Nice — you caught the contrast with &ldquo;exhaustive.&rdquo; That&apos;s exactly the clue to lean on.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ maxWidth: 980, margin: "0 auto", padding: "8px 28px 80px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
        {BENEFITS.map((b) => (
          <div key={b.title}>
            <span style={{ display: "inline-flex", width: 44, height: 44, borderRadius: 14, background: b.bg, color: b.color, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Icon name={b.icon} size={21} />
            </span>
            <h3 style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-strong)", margin: "0 0 7px" }}>{b.title}</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-body)", lineHeight: "var(--leading-relaxed)", margin: 0 }}>{b.desc}</p>
          </div>
        ))}
      </section>

      {/* Why 800Path */}
      <section id="why" style={{ padding: "0 28px 88px" }}>
        <div style={{
          maxWidth: 880, margin: "0 auto",
          background: "linear-gradient(var(--surface), var(--surface)) padding-box, var(--gradient-radiant) border-box",
          border: "5px solid transparent",
          borderRadius: "var(--radius-2xl)",
          padding: "48px 44px",
        }}>
          <h2 style={{ fontWeight: 800, fontSize: "var(--text-2xl)", color: "var(--text-strong)", margin: "0 0 12px", letterSpacing: "var(--tracking-tight)", textAlign: "center" }}>
            Why 800Path?
          </h2>
          <p style={{ fontSize: "var(--text-md)", color: "var(--text-body)", lineHeight: "var(--leading-relaxed)", maxWidth: 560, margin: "0 auto 36px", textAlign: "center" }}>
            Studying alone shouldn&apos;t mean studying blind. 800Path gives self-studiers the structure, feedback, and encouragement a good tutor would — without the schedule or the price tag.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px 40px" }}>
            {WHY_ITEMS.map((item) => (
              <div key={item.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ display: "inline-flex", width: 38, height: 38, borderRadius: 11, background: item.bg, color: item.color, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={item.icon} size={19} />
                </span>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-strong)", margin: "0 0 5px" }}>{item.title}</h3>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--text-body)", lineHeight: "var(--leading-relaxed)", margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Button size="lg" onClick={() => router.push("/auth?mode=signup")} iconRight={<Icon name="arrow-right" size={18} />}>
              Create your account
            </Button>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "26px 28px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>
        800Path &copy; 2026 — SAT is a trademark of College Board.
      </footer>
    </div>
  );
}
