// Dashboard — greeting, stats, start CTA, skill breakdown, recent sessions.
function Dashboard({ go }) {
  const { Card, Button, SkillBar, Avatar, Badge } = window.DesignSystem_4010b3;
  const d = window.PW_DATA;
  const avg = Math.round(d.recent.reduce((a, s) => a + s.score, 0) / d.recent.length);
  const weakest = [...d.skills].sort((a, b) => a.accuracy - b.accuracy)[0];

  const stats = [
    { label: "Sessions done", value: d.recent.length },
    { label: "Avg. score", value: avg + "%" },
    { label: "Skills tracked", value: d.skills.length },
    { label: "Weakest skill", value: weakest.label, small: true },
  ];

  return (
    <div style={{ minHeight: "100%", background: "var(--canvas)" }}>
      <TopNav go={go} right={<>
        <NavLink onClick={() => go("history")}>History</NavLink>
        <NavLink onClick={() => go("landing")}>Sign out</NavLink>
        <Avatar name={d.user.name} size={34} />
      </>} />

      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 24px 64px" }}>
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "var(--text-xl)", color: "var(--text-strong)", margin: 0, letterSpacing: "var(--tracking-snug)" }}>
            Hey, {d.user.name.split(" ")[0]} 👋
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "6px 0 0" }}>
            Ready for a session? Let's keep the streak going.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {stats.map((s) => (
            <Card key={s.label} tone="surface" padding="md" radius="lg">
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)", margin: "0 0 8px" }}>{s.label}</p>
              <p style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: s.small ? "var(--text-base)" : "var(--text-xl)", color: "var(--text-strong)", margin: 0, lineHeight: 1.1, letterSpacing: "var(--tracking-snug)" }}>{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 22, marginBottom: 22 }}>
          <Card tone="brand" padding="lg" radius="xl" shadow="md" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "var(--text-lg)", margin: "0 0 8px" }}>Start a session</h2>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--lilac-100)", margin: 0, lineHeight: "var(--leading-relaxed)" }}>10 questions. ~8 minutes. Instant AI feedback.</p>
            </div>
            <Button variant="secondary" onClick={() => go("setup")} style={{ marginTop: "auto" }} iconRight={<Icon name="arrow-right" size={17} />}>Practice now</Button>
          </Card>

          <Card tone="surface" padding="lg" radius="xl">
            <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-strong)", margin: "0 0 18px" }}>Skill accuracy</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {[...d.skills].sort((a, b) => a.accuracy - b.accuracy).map((s) => (
                <SkillBar key={s.key} label={s.label} accuracy={s.accuracy} detail={`${s.n} · ${s.accuracy}%`} />
              ))}
            </div>
          </Card>
        </div>

        {/* Recent */}
        <Card tone="surface" padding="lg" radius="xl">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-strong)", margin: 0 }}>Recent sessions</h2>
            <NavLink onClick={() => go("history")}>View all →</NavLink>
          </div>
          <div>
            {d.recent.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text-strong)", margin: 0 }}>{s.domain}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--text-faint)", margin: "3px 0 0" }}>{s.date} · {s.count} questions</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <Badge tone={s.score >= 80 ? "mint" : s.score >= 60 ? "butter" : "rose"}>{s.score}%</Badge>
                  <NavLink onClick={() => go("results")}>Review →</NavLink>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
window.Dashboard = Dashboard;
