import Link from "next/link";
import { Wordmark } from "@/components/ui/nav";

/** Shared layout for the 404 and error pages. */
export function StatusPage({ eyebrow, title, body, children }: {
  eyebrow: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", fontFamily: "var(--font-serif)", color: "var(--text-body)", display: "flex", flexDirection: "column" }}>
      <header style={{ borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 44px", height: 64, display: "flex", alignItems: "center" }}>
          <Wordmark />
        </div>
      </header>
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "72px 24px" }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 18px" }}>{eyebrow}</p>
          <h1 style={{ fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.024em", color: "var(--text-strong)", margin: "0 0 14px" }}>{title}</h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--text-muted)", margin: "0 0 30px" }}>{body}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, flexWrap: "wrap" }}>
            {children}
            <Link href="/dashboard" style={{
              background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)",
              fontSize: 14, fontWeight: 500, padding: "13px 26px", borderRadius: "var(--radius-lg)",
            }}>
              Go to your dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
