"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Badge, AnswerOption } from "@/components/ui/ds";
import { Icon } from "@/components/ui/icon";

const WHY_ITEMS = [
  {
    icon: "trending-up", color: "var(--lilac-600)",
    title: "Practice adapts to you",
    desc: "Get two questions right in a row and the difficulty steps up. Miss a few and it steps back down — so you're always working at the edge of what you know.",
  },
  {
    icon: "calendar-check", color: "var(--rose-ink)",
    title: "A structured 30-day plan",
    desc: "Not random questions — a day-by-day plan that works through every SAT Reading & Writing category, then circles back to whichever ones you're weakest in.",
  },
  {
    icon: "check-check", color: "var(--lilac-600)",
    title: "Explanations that go beyond “wrong”",
    desc: "Every question explains why the right answer is right, and why each wrong one specifically fails — not just a correct/incorrect stamp.",
  },
  {
    icon: "wallet", color: "var(--rose-ink)",
    title: "Completely free",
    desc: "No paywall, no premium tier. Real SAT-style Reading & Writing questions, free to use.",
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh", fontFamily: "var(--font-sans)", overflowX: "hidden" }}>

      {/* Hero: dark editorial panel */}
      <div style={{ background: "var(--dark-900)" }}>
        {/* Nav */}
        <nav style={{ maxWidth: 1080, margin: "0 auto", padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <span style={{
              width: 30, height: 30, borderRadius: 9, background: "var(--text-on-dark)", color: "var(--dark-900)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16,
            }}>8</span>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "var(--tracking-tight)", color: "var(--text-on-dark)" }}>800Path</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Link href="/auth" style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--text-on-dark-muted)", textDecoration: "none" }}>
              Sign in
            </Link>
            <Button size="sm" variant="secondary" onClick={() => router.push("/auth?mode=signup")}>Get started</Button>
          </div>
        </nav>

        <section style={{ maxWidth: 1080, margin: "0 auto", padding: "52px 28px 84px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>

          {/* Left: message */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 26 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--lilac-300)" }} />
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-on-dark-muted)" }}>
                Made for self-studiers
              </span>
            </div>
            <h1 style={{
              fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500,
              fontSize: "var(--text-5xl)", lineHeight: 0.98, letterSpacing: "var(--tracking-snug)",
              color: "var(--text-on-dark)", margin: "0 0 24px",
            }}>
              A calmer way<br />to prep for the{" "}
              <span style={{ background: "var(--gradient-radiant)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontStyle: "normal" }}>SAT</span>.
            </h1>
            <p style={{ fontSize: "var(--text-md)", color: "var(--text-on-dark-muted)", lineHeight: "var(--leading-relaxed)", maxWidth: 420, margin: "0 0 36px" }}>
              Practice real SAT Reading &amp; Writing questions and get a clear explanation for every answer, right or wrong. A little most days beats cramming.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Button size="lg" variant="secondary" onClick={() => router.push("/auth?mode=signup")}>
                Start practicing — free
              </Button>
              <Button size="lg" variant="ghost" style={{ color: "var(--text-on-dark)" }} onClick={() => {
                document.getElementById("why")?.scrollIntoView({ behavior: "smooth" });
              }}>
                See how it works
              </Button>
            </div>
          </div>

          {/* Right: product preview */}
          <div style={{ background: "var(--dark-800)", border: "1px solid var(--dark-border)", borderRadius: "var(--radius-2xl)", padding: 24, position: "relative" }}>
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: 22 }}>
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
      </div>

      {/* Benefits: editorial numbered columns */}
      <section style={{ maxWidth: 980, margin: "0 auto", padding: "80px 28px 80px", display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", gap: 0 }}>
        {[
          { n: "01", title: "Short sessions", desc: "Most sessions take under 15 minutes, so they're easy to fit into a normal day." },
          { n: "02", title: "Tracks your weak spots", desc: "Each session is scored by skill, so you always know what to work on next." },
          { n: "03", title: "Explains every answer", desc: "Every question comes with a clear explanation of why the right answer is right." },
        ].map((b, i) => (
          <div key={b.n} style={{
            padding: i === 0 ? "0 36px 0 0" : i === 2 ? "0 0 0 36px" : "0 36px",
            borderRight: i < 2 ? "1px solid var(--border)" : "none",
          }}>
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "var(--text-2xl)", color: "var(--text-strong)" }}>{b.n}</span>
            <h3 style={{ fontWeight: 700, fontSize: "var(--text-lg)", color: "var(--text-strong)", margin: "14px 0 8px" }}>{b.title}</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-body)", lineHeight: "var(--leading-relaxed)", margin: 0 }}>{b.desc}</p>
          </div>
        ))}
      </section>

      {/* Why 800Path */}
      <section id="why" style={{ padding: "0 28px 96px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-faint)", textAlign: "center", margin: "0 0 12px" }}>
            Why 800Path
          </p>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: "var(--text-3xl)", color: "var(--text-strong)",
            margin: "0 0 48px", letterSpacing: "var(--tracking-snug)", textAlign: "center",
          }}>
            What you actually get
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
            {WHY_ITEMS.map((item) => (
              <div key={item.title} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "var(--surface)", padding: "28px 30px" }}>
                <Icon name={item.icon} size={19} color={item.color} />
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-strong)", margin: "0 0 5px" }}>{item.title}</h3>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--text-body)", lineHeight: "var(--leading-relaxed)", margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Button size="lg" onClick={() => router.push("/auth?mode=signup")}>
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
