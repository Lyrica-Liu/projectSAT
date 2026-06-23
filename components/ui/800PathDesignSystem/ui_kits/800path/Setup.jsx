// Practice setup — choose domain + question count.
function Setup({ go }) {
  const { Button, ChoiceCard } = window.DesignSystem_4010b3;
  const [domain, setDomain] = React.useState("both");
  const [count, setCount] = React.useState(10);
  const domains = [
    { value: "both", label: "Reading & Writing", desc: "Mix of both domains" },
    { value: "reading", label: "Reading", desc: "Passages & comprehension" },
    { value: "writing", label: "Writing", desc: "Grammar & expression" },
  ];

  return (
    <div style={{ minHeight: "100%", background: "var(--canvas)", display: "flex", flexDirection: "column" }}>
      <TopNav go={go} maxWidth={760} right={<NavLink onClick={() => go("dashboard")}>← Dashboard</NavLink>} />

      <main style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "56px 24px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "var(--text-xl)", color: "var(--text-strong)", margin: "0 0 6px", letterSpacing: "var(--tracking-snug)" }}>Set up your session</h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "0 0 30px" }}>Pick what you want to practice and how many questions.</p>

          <p className="pw-eyebrow" style={{ margin: "0 0 12px" }}>Domain</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 30 }}>
            {domains.map((o) => (
              <ChoiceCard key={o.value} label={o.label} desc={o.desc} selected={domain === o.value} onClick={() => setDomain(o.value)} />
            ))}
          </div>

          <p className="pw-eyebrow" style={{ margin: "0 0 12px" }}>Number of questions</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
            {[5, 10, 15, 20].map((n) => (
              <button key={n} onClick={() => setCount(n)} style={{
                flex: 1, padding: "13px 0", borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-sm)",
                cursor: "pointer", transition: "all var(--dur-base) var(--ease-out)",
                background: count === n ? "var(--lilac-50)" : "var(--surface)",
                border: `1.5px solid ${count === n ? "var(--lilac-300)" : "var(--border-strong)"}`,
                color: count === n ? "var(--brand-ink)" : "var(--text-body)",
                boxShadow: count === n ? "0 0 0 4px var(--focus-ring)" : "none",
              }}>{n}</button>
            ))}
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--text-faint)", margin: "0 0 30px" }}>~{Math.round(count * 0.8)} min estimated</p>

          <Button full size="lg" onClick={() => go("session")} iconRight={<Icon name="arrow-right" size={18} />}>Start session</Button>
        </div>
      </main>
    </div>
  );
}
window.Setup = Setup;
