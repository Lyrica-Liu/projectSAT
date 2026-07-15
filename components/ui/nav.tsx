"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
      <span style={{
        width: 30, height: 30, borderRadius: 9,
        background: "var(--gradient-radiant)", color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, lineHeight: 1,
        boxShadow: "var(--shadow-brand)", flexShrink: 0,
      }}>8</span>
      <span style={{
        fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 18,
        letterSpacing: "var(--tracking-tight)", color: "var(--text-strong)",
      }}>800Path</span>
    </Link>
  );
}

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      display: "inline-flex", alignItems: "center",
      fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "var(--text-sm)",
      color: "var(--text-muted)", padding: "6px 4px", textDecoration: "none",
    }}>
      {children}
    </Link>
  );
}

export function TopNav({
  right,
  maxWidth = 1040,
  homeHref = "/",
}: {
  right?: React.ReactNode;
  maxWidth?: number;
  homeHref?: string;
}) {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 10,
      background: "rgba(255, 255, 255, 0.9)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{
        maxWidth, margin: "0 auto",
        padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Wordmark href={homeHref} />
        {right && (
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>{right}</div>
        )}
      </div>
    </nav>
  );
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/practice", label: "Practice" },
  { href: "/history", label: "History" },
];

export function AppNav({ maxWidth = 1040 }: { maxWidth?: number }) {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setDisplayName(
          user.user_metadata?.display_name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          ""
        );
      }
    });
  }, []);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 10,
      background: "rgba(255, 255, 255, 0.9)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{
        maxWidth, margin: "0 auto",
        padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Wordmark href="/dashboard" />

        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {NAV_LINKS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} style={{
                display: "inline-flex", alignItems: "center",
                fontFamily: "var(--font-sans)",
                fontWeight: active ? 600 : 500,
                fontSize: "var(--text-sm)",
                color: active ? "var(--brand)" : "var(--text-muted)",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                textDecoration: "none",
                background: active ? "var(--lilac-50)" : "transparent",
                transition: "color var(--dur-fast), background var(--dur-fast)",
              }}>
                {label}
              </Link>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <form action="/auth/signout" method="post" style={{ display: "inline" }}>
            <button type="submit" style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "var(--font-sans)", fontWeight: 500,
              fontSize: "var(--text-sm)", color: "var(--text-muted)", padding: "6px 4px",
            }}>
              Sign out
            </button>
          </form>
          {displayName && (
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "var(--gradient-radiant)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontFamily: "var(--font-sans)",
              fontWeight: 700, fontSize: 13, flexShrink: 0,
              boxShadow: "var(--shadow-brand)",
            }}>
              {displayName[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
