// Auth — sign in / sign up.
function Auth({ go }) {
  const { Button, Input, SegmentedControl, Card } = window.DesignSystem_4010b3;
  const [mode, setMode] = React.useState("signin");
  const [email, setEmail] = React.useState("maya@example.com");
  const [pw, setPw] = React.useState("password123");
  const [name, setName] = React.useState("");

  return (
    <div style={{ minHeight: "100%", background: "var(--canvas)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 20px" }}>
      <button onClick={() => go("landing")} style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", marginBottom: 28 }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--gradient-radiant)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18, boxShadow: "var(--shadow-brand)" }}>8</span>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 21, letterSpacing: "var(--tracking-tight)", color: "var(--text-strong)" }}>800Path</span>
      </button>

      <Card tone="surface" padding="xl" radius="xl" shadow="md" style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", marginBottom: 22 }}>
          <SegmentedControl
            options={[{ value: "signin", label: "Sign in" }, { value: "signup", label: "Sign up" }]}
            value={mode} onChange={setMode} style={{ width: "100%", display: "flex" }} />
        </div>

        <h1 style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-lg)", color: "var(--text-strong)", margin: "0 0 4px" }}>
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "0 0 22px" }}>
          {mode === "signin" ? "Sign in to continue your practice." : "Start improving your SAT score today."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "signup" && <Input label="Display name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />}
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <Button full size="lg" onClick={() => go("dashboard")} style={{ marginTop: 4 }}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </div>
      </Card>

      <p style={{ marginTop: 22, fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--text-faint)", textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>
        By continuing, you agree to our <span style={{ textDecoration: "underline", cursor: "pointer" }}>Terms</span> and <span style={{ textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>.
      </p>
    </div>
  );
}
window.Auth = Auth;
