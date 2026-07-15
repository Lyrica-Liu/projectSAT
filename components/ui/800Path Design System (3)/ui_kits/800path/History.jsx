// History — full list of completed sessions.
function History({ go }) {
  const { Card, Button, Badge, Avatar } = window.DesignSystem_4010b3;
  const d = window.PW_DATA;
  const all = [...d.recent, { id: "s5", domain: "Reading", date: "Jun 11, 2026", score: 55, count: 10 }, { id: "s6", domain: "Writing", date: "Jun 9, 2026", score: 80, count: 15 }];

  return (
    <div style={{ minHeight: "100%", background: "var(--canvas)" }}>
      <TopNav go={go} maxWidth={720} right={<>
        <NavLink onClick={() => go("dashboard")}>← Dashboard</NavLink>
        <Avatar name={d.user.name} size={34} />
      </>} />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 64px" }}>
        <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "var(--text-xl)", color: "var(--text-strong)", margin: "0 0 22px", letterSpacing: "var(--tracking-snug)" }}>Session history</h1>
        <Card tone="surface" padding="none" radius="xl" style={{ overflow: "hidden" }}>
          {all.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderTop: i ? "1px solid var(--border)" : "none" }}>
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
        </Card>
        <div style={{ marginTop: 22 }}>
          <Button size="lg" onClick={() => go("setup")} iconRight={<Icon name="arrow-right" size={18} />}>New session</Button>
        </div>
      </main>
    </div>
  );
}
window.History = History;
