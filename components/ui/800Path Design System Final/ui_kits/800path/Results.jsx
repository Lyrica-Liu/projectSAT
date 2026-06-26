// Results — score ring, AI feedback, skill breakdown, question review.
function Results({ go }) {
  const { Card, Button, ScoreRing, SkillBar, Badge } = window.DesignSystem_4010b3;
  const d = window.PW_DATA;
  const score = 82;
  const review = d.questions.map((q, i) => ({
    n: i + 1, skill: q.skill, correct: i !== 2, your: i !== 2 ? q.answer : "A", answer: q.answer, stem: q.stem, explanation: q.explanation,
  }));
  const breakdown = d.skills.slice(0, 4);

  return (
    <div style={{ minHeight: "100%", background: "var(--canvas)" }}>
      <TopNav go={go} maxWidth={720} right={<NavLink onClick={() => go("dashboard")}>Dashboard</NavLink>} />

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "36px 24px 64px" }}>
        {/* Hero */}
        <Card tone="surface" padding="xl" radius="xl" shadow="sm" style={{ textAlign: "center", marginBottom: 22 }}>
          <p className="pw-eyebrow" style={{ margin: "0 0 18px" }}>Session complete</p>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <ScoreRing score={score} caption={`${review.filter(r => r.correct).length} of ${review.length} correct · Reading & Writing`} />
          </div>
          <div style={{ textAlign: "left", background: "var(--lilac-50)", border: "1px solid var(--lilac-100)", borderRadius: "var(--radius-lg)", padding: "18px 20px", marginTop: 8 }}>
            <p style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-xs)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--lilac-600)", margin: "0 0 10px" }}>
              <Icon name="sparkles" size={14} /> AI Feedback
            </p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--brand-ink)", lineHeight: "var(--leading-relaxed)", margin: 0 }}>
              Strong work on Words in Context — you nailed the contrast clues. Your misses clustered in Command of Evidence, where you tended to pick answers that sounded relevant but weren't directly supported. Next session, try underlining the exact line that proves each answer before choosing.
            </p>
          </div>
        </Card>

        {/* Skill breakdown */}
        <Card tone="surface" padding="lg" radius="xl" style={{ marginBottom: 22 }}>
          <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-strong)", margin: "0 0 18px" }}>Skill breakdown</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            {breakdown.map((s) => <SkillBar key={s.key} label={s.label} accuracy={s.accuracy} detail={`${s.n} · ${s.accuracy}%`} />)}
          </div>
        </Card>

        {/* Question review */}
        <Card tone="surface" padding="lg" radius="xl" style={{ marginBottom: 22 }}>
          <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-strong)", margin: "0 0 16px" }}>Question review</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {review.map((r) => (
              <div key={r.n} style={{ borderRadius: "var(--radius-lg)", padding: "16px 18px", background: r.correct ? "var(--mint-surface)" : "var(--rose-surface)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                    <strong style={{ color: "var(--text-strong)" }}>Q{r.n}</strong> · {r.skill}
                  </span>
                  <Badge tone={r.correct ? "mint" : "rose"} size="sm">{r.correct ? "Correct" : "Incorrect"}</Badge>
                </div>
                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text-strong)", lineHeight: "var(--leading-snug)", margin: "0 0 8px" }}>{r.stem}</p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--text-body)", margin: "0 0 10px" }}>
                  Your answer: <strong style={{ color: r.correct ? "var(--mint-ink)" : "var(--rose-ink)" }}>{r.your}</strong>
                  {!r.correct && <> · Correct: <strong style={{ color: "var(--mint-ink)" }}>{r.answer}</strong></>}
                </p>
                <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: "var(--radius-md)", padding: "11px 13px" }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--text-body)", lineHeight: "var(--leading-relaxed)", margin: 0 }}>{r.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: "flex", gap: 12 }}>
          <Button full size="lg" onClick={() => go("setup")} iconRight={<Icon name="arrow-right" size={18} />}>Practice again</Button>
          <Button full size="lg" variant="secondary" onClick={() => go("dashboard")}>Dashboard</Button>
        </div>
      </main>
    </div>
  );
}
window.Results = Results;
