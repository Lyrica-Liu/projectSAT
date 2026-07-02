// Landing / marketing page.
function Landing({ go }) {
  const { Button, Badge, Card } = window.DesignSystem_4010b3;
  const steps = [
    { n: "01", t: "Pick your focus", d: "Choose Reading, Writing, or both — and how many questions." },
    { n: "02", t: "Answer questions", d: "Real SAT-style passages and questions. No fluff, no filler." },
    { n: "03", t: "Review & reflect", d: "See your score, skill breakdown, and personalized AI feedback." },
  ];
  const features = [
    { icon: "zap", t: "Focused sessions", d: "10-question sprints that fit into any break." },
    { icon: "target", t: "Skill targeting", d: "Drill exactly the skills where you're weakest." },
    { icon: "sparkles", t: "AI feedback", d: "Personalized analysis after every session — not generic tips." },
  ];

  return (
    <div style={{ background: "var(--surface)", minHeight: "100%" }}>
      <TopNav go={go} right={<>
        <NavLink onClick={() => go("auth")}>Sign in</NavLink>
        <Button size="sm" onClick={() => go("auth")}>Get started</Button>
      </>} />

      {/* Hero */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "84px 24px 64px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", marginBottom: 26 }}>
          <Badge tone="lilac" dot>SAT Reading &amp; Writing</Badge>
        </div>
        <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "var(--text-4xl)", lineHeight: 1.04, letterSpacing: "var(--tracking-tight)", color: "var(--text-strong)", margin: "0 0 22px" }}>
          Study smarter,<br /><span style={{ color: "var(--lilac-500)" }}>not harder.</span>
        </h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-md)", color: "var(--text-muted)", lineHeight: "var(--leading-relaxed)", maxWidth: 480, margin: "0 auto 34px" }}>
          Short, focused practice sessions with AI-powered feedback — built for self-studiers who want real improvement, not just more questions.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Button size="lg" onClick={() => go("auth")} iconRight={<Icon name="arrow-right" size={18} />}>Start practicing — it's free</Button>
          <Button size="lg" variant="ghost" onClick={() => go("dashboard")}>See the dashboard</Button>
        </div>
      </section>

      {/* Feature strip */}
      <section style={{ background: "var(--canvas)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "56px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
          {features.map((f) => (
            <Card key={f.t} tone="surface" padding="lg" radius="xl">
              <span style={{ display: "inline-flex", width: 42, height: 42, borderRadius: 12, background: "var(--lilac-100)", color: "var(--lilac-600)", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Icon name={f.icon} size={20} />
              </span>
              <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-strong)", margin: "0 0 6px" }}>{f.t}</h3>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-muted)", lineHeight: "var(--leading-normal)", margin: 0 }}>{f.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 820, margin: "0 auto", padding: "72px 24px" }}>
        <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-xl)", textAlign: "center", color: "var(--text-strong)", margin: "0 0 44px", letterSpacing: "var(--tracking-snug)" }}>How it works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
          {steps.map((s) => (
            <div key={s.n}>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--lilac-400)" }}>{s.n}</span>
              <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-strong)", margin: "10px 0 6px" }}>{s.t}</h3>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-muted)", lineHeight: "var(--leading-relaxed)", margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", background: "var(--lilac-500)", borderRadius: "var(--radius-2xl)", padding: "52px 32px", textAlign: "center", boxShadow: "var(--shadow-lg)" }}>
          <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "var(--text-2xl)", color: "#fff", margin: "0 0 12px", letterSpacing: "var(--tracking-tight)" }}>Ready to improve your score?</h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--lilac-100)", margin: "0 0 28px" }}>Free to use. No credit card. First session in under a minute.</p>
          <Button size="lg" variant="secondary" onClick={() => go("auth")}>Create your account</Button>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "26px 24px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>
        800Path © 2026 — SAT is a trademark of College Board.
      </footer>
    </div>
  );
}
window.Landing = Landing;
