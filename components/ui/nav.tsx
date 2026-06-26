"use client";

import Link from "next/link";
import React from "react";

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
