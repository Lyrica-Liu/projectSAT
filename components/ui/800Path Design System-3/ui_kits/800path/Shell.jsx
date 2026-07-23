// Shared chrome: top navigation bar with wordmark + actions.
function Icon({ name, size = 18, color = "currentColor", strokeWidth = 2, style = {} }) {
  return <i data-lucide={name} style={{ width: size, height: size, color, display: "inline-flex", ...style }} data-stroke={strokeWidth}></i>;
}

function Wordmark({ onClick, light = false }) {
  return (
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      <span style={{
        width: 30, height: 30, borderRadius: 9,
        background: light ? "#fff" : "var(--gradient-radiant)",
        color: light ? "var(--lilac-600)" : "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16,
        boxShadow: light ? "none" : "var(--shadow-brand)",
      }}>8</span>
      <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 18, letterSpacing: "var(--tracking-tight)", color: light ? "#fff" : "var(--text-strong)" }}>800Path</span>
    </button>
  );
}

function TopNav({ go, right, maxWidth = 1040 }) {
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ maxWidth, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Wordmark onClick={() => go("dashboard")} />
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>{right}</div>
      </div>
    </nav>
  );
}

function NavLink({ children, onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--text-muted)", padding: "6px 4px" }}
      onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-strong)"}
      onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
      {children}
    </button>
  );
}

Object.assign(window, { Icon, Wordmark, TopNav, NavLink });
