"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";
import { Mark } from "@/components/ui/mark";
import { getCurrentPlanDay, calcStreak } from "@/lib/plan";

/** Fixed width of the collapsed sidebar — signed-in pages offset their content by this. */
export const SIDEBAR_WIDTH = 66;

export function Spinner({ size = 22, color = "var(--brand)" }: { size?: number; color?: string }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size, borderRadius: "50%",
      border: "2.5px solid var(--border-strong)",
      borderTopColor: color,
      animation: "spin-ring 0.7s linear infinite",
      flexShrink: 0,
    }} />
  );
}

export function LoadingScreen({ message = "Loading…" }: { message?: string }) {
  return (
    <div style={{
      minHeight: "100vh", background: "var(--canvas)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 14,
    }}>
      <Spinner size={28} />
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-faint)", margin: 0 }}>
        {message}
      </p>
    </div>
  );
}

export function Wordmark({ href = "/", dark = false }: { href?: string; dark?: boolean }) {
  const ink = dark ? "var(--text-on-dark)" : "var(--text-strong)";
  return (
    <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
      <Mark width={30} height={18} fill={ink} />
      <span style={{
        fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 19,
        letterSpacing: "-0.02em", color: ink,
      }}>800Path</span>
    </Link>
  );
}

const NAV_LINKS: { href: string; label: string; icon: string }[] = [
  { href: "/plan",      label: "My plan",        icon: "calendar" },
  { href: "/dashboard", label: "Dashboard",       icon: "bar-chart-3" },
  { href: "/practice",  label: "Extra practice",  icon: "document" },
  { href: "/for-you",   label: "For you",         icon: "compass" },
];

/** Fixed 66px oat spine that widens to 218px on hover. See .pw-sidebar in globals.css. */
export function Sidebar() {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("");
  const [planDay, setPlanDay] = useState(1);
  const [streak, setStreak] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setDisplayName(
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        ""
      );
      const { data: planRows } = await supabase
        .from("plan_days")
        .select("day_number, completed_at")
        .eq("user_id", user.id);
      const rows = planRows ?? [];
      setPlanDay(getCurrentPlanDay(rows.filter((r) => r.completed_at).map((r) => r.day_number)));
      setStreak(calcStreak(rows));
    })();
  }, []);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const clampedDay = Math.min(30, Math.max(1, planDay));

  return (
    <aside className="pw-sidebar" style={{
      position: "fixed", left: 0, top: 0, bottom: 0, background: "var(--sidebar-bg)",
      borderRight: "1px solid var(--sidebar-line)", zIndex: 40,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <Link href="/dashboard" style={{
        height: 60, display: "flex", alignItems: "center", gap: 12, padding: "0 21px",
        flexShrink: 0, borderBottom: "1px solid var(--sidebar-line)",
      }}>
        <Mark width={30} height={18} fill="var(--sidebar-ink)" />
        <span className="pw-lbl" style={{ fontSize: 16, fontWeight: 600, color: "var(--sidebar-ink)", letterSpacing: "-0.018em" }}>800Path</span>
      </Link>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "14px 9px", flex: 1, fontFamily: "var(--font-sans)", fontSize: 13 }}>
        {NAV_LINKS.map(({ href, label, icon }) => {
          const active = isActive(href);
          const isHovered = hovered === href;
          const rowStyle: React.CSSProperties = {
            display: "flex", alignItems: "center", gap: 14, padding: "10px 12px",
            borderRadius: "var(--radius-md)",
            color: active ? "var(--text-on-brand)" : isHovered ? "var(--sidebar-ink)" : "var(--sidebar-ink-muted)",
            background: active ? "var(--sidebar-active)" : isHovered ? "var(--sidebar-hover)" : "transparent",
          };
          const inner = (
            <>
              <Icon name={icon} size={16} color="currentColor" />
              <span className="pw-lbl">{label}</span>
            </>
          );
          return active ? (
            <span key={href} style={rowStyle}>{inner}</span>
          ) : (
            <Link key={href} href={href} style={rowStyle} onMouseEnter={() => setHovered(href)} onMouseLeave={() => setHovered(null)}>{inner}</Link>
          );
        })}
      </nav>

      <div style={{ padding: "16px 9px", borderTop: "1px solid var(--sidebar-line)", flexShrink: 0 }}>
        <div style={{ padding: "0 12px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 2, width: 34 }}>
            {Array.from({ length: 30 }, (_, i) => {
              const d = i + 1;
              const bg = d === clampedDay ? "var(--mark)" : d < clampedDay ? "var(--sidebar-ink-muted)" : "var(--sidebar-rail)";
              return <span key={d} style={{ aspectRatio: 1, background: bg, borderRadius: 1 }} />;
            })}
          </div>
          <p className="pw-lbl" style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--sidebar-ink-faint)", margin: "10px 0 0" }}>
            Day {clampedDay} of thirty · {streak}-day streak
          </p>
        </div>
        <Link href="/account" onMouseEnter={() => setHovered("/account")} onMouseLeave={() => setHovered(null)} style={{
          display: "flex", alignItems: "center", gap: 14, padding: "10px 12px",
          borderRadius: "var(--radius-md)", color: hovered === "/account" ? "var(--sidebar-ink)" : "var(--sidebar-ink-muted)",
          background: hovered === "/account" ? "var(--sidebar-hover)" : "transparent",
          fontFamily: "var(--font-sans)", fontSize: 13,
        }}>
          <span style={{
            width: 16, height: 16, borderRadius: 999, border: "1px solid var(--sidebar-ink-faint)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, flexShrink: 0,
          }}>
            {(displayName[0] ?? "?").toUpperCase()}
          </span>
          <span className="pw-lbl">{displayName || "Account"}</span>
        </Link>
      </div>
    </aside>
  );
}
