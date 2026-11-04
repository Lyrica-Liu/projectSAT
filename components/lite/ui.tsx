"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ActiveSprint } from "@/lib/server/sprints";
import { Mark } from "@/components/ui/mark";

/** POSTs (or GETs, without a body) JSON to an API route; throws the route's error message. */
export async function api<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, body === undefined
    ? { cache: "no-store" }
    : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data as T;
}

// ── Show-last-data-first cache ────────────────────────────────────────────────
// Each tab paints instantly from what it showed last time (kept in this browser), then swaps in
// fresh data. Keyed by user so a different account on the same phone never sees someone else's.
let cacheUser = "anon";
export function setCacheUser(id: string) { cacheUser = id; }

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`lite:${cacheUser}:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}
export function writeCache(key: string, value: unknown) {
  try { localStorage.setItem(`lite:${cacheUser}:${key}`, JSON.stringify(value)); } catch { /* storage full or blocked: just skip */ }
}

/** `data` is the cached copy at first, then the fresh one; `error` only when there's nothing to show. */
export function useCached<T>(key: string, url: string) {
  const [data, setData] = useState<T | null>(() => (typeof window === "undefined" ? null : readCache<T>(key)));
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(() => {
    api<T>(url).then((fresh) => { setData(fresh); setError(null); writeCache(key, fresh); })
      .catch((e) => setError((e as Error).message));
  }, [key, url]);
  useEffect(refresh, [refresh]);
  return { data, error: data ? null : error, refresh, setData };
}

/** Response of GET /api/lite/me. */
export interface MeInfo {
  streak: number;
  today: number;
  dailyGoal: number;
  lastMode: "adaptive" | "clinic" | "pick";
  lastPick: string | null;
  name: string | null;
  email: string | null;
  isAnonymous: boolean;
  activeSprint: ActiveSprint | null;
}

export const meUrl = () => `/api/lite/me?tz=${new Date().getTimezoneOffset()}`;
export function fetchMe() { return api<MeInfo>(meUrl()); }

/** Leaves Lite for the website and keeps phones from being sent back here (see proxy.ts). */
export function goToFullSite(path = "/dashboard") {
  document.cookie = "pw_full_site=1; path=/; max-age=31536000; samesite=lax";
  window.location.href = path;
}

export const DIFFICULTY: Record<string, string> = { easy: "Easy", "medium-low": "Medium", "medium-high": "Medium+", hard: "Hard" };

// ── Pieces ────────────────────────────────────────────────────────────────────

export function Glow({ tone, size, style }: { tone: "coral" | "rose" | "violet"; size: number; style: React.CSSProperties }) {
  return <div className={`l-glow ${tone}`} style={{ width: size, height: size, ...style }} />;
}

export function Logo() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {/* The website's wordmark, so the two read as one product. */}
      <Mark width={28} height={17} fill="var(--l-ink)" />
      <span style={{ fontFamily: "var(--l-serif)", fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>800Path</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "var(--l-gradient)", padding: "3px 8px", borderRadius: 999 }}>lite</span>
    </span>
  );
}

export function StreakBadge({ streak }: { streak: number }) {
  return (
    <span className="l-chip" style={{ background: "var(--l-accent-soft)", color: "var(--l-accent-ink)", fontSize: 15, padding: "8px 12px" }} aria-label={`${streak}-day streak`}>
      <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true">
        <defs><linearGradient id="l-flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#f0664f" /><stop offset="1" stopColor="#e04a73" /></linearGradient></defs>
        <path d="M7 0c1 3 5 5 5 9.5A5 5 0 0 1 2 9.5C2 7 4 6 4 3.5 5.5 5 6 6 6 7.5 7.5 6 7.5 3 7 0Z" fill="url(#l-flame)" />
      </svg>
      {streak}
    </span>
  );
}

/** Today's questions against the daily goal: a coral→violet arc, violet with a check when done. */
export function GoalRing({ done, goal, size = 64 }: { done: number; goal: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.min(1, goal > 0 ? done / goal : 0);
  const id = `l-ring-${size}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${done} of ${goal} questions today`}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f0664f" /><stop offset=".5" stopColor="#e04a73" /><stop offset="1" stopColor="#8458e8" /></linearGradient></defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--l-soft2)" strokeWidth="7" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={frac >= 1 ? "var(--l-violet)" : `url(#${id})`} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - frac)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      {frac >= 1 && <path d={`M${size / 2 - 9} ${size / 2} l6 6 l12 -12`} fill="none" stroke="var(--l-violet)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

export function Skeleton({ height, style }: { height: number; style?: React.CSSProperties }) {
  return <div className="l-skel" style={{ height, borderRadius: 20, ...style }} aria-hidden="true" />;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="l-page no-tabs" style={{ minHeight: "100dvh", alignItems: "center", justifyContent: "center" }} aria-busy="true">
      <div className="l-skel" style={{ width: 56, height: 56, borderRadius: "50%" }} />
      <p className="l-sub">{label}</p>
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string | null; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <p role="alert" style={{ margin: 0, padding: "12px 14px", borderRadius: 14, background: "var(--l-wrong-soft)", color: "var(--l-wrong)", fontSize: 14, fontWeight: 600, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
      <span>{message}</span>
      {onRetry && <button className="l-link" style={{ color: "var(--l-wrong)", fontSize: 14 }} onClick={onRetry}>Retry</button>}
    </p>
  );
}

export function Sheet({ onClose, children, label }: { onClose: () => void; children: React.ReactNode; label: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <div className="l-sheet-backdrop" onClick={onClose} />
      <div className="l-sheet" role="dialog" aria-modal="true" aria-label={label}>
        <div className="l-grabber" />
        {children}
      </div>
    </>
  );
}

/** A small burst of confetti dots for a right answer. */
export function Burst() {
  const colors = ["var(--l-coral)", "var(--l-accent)", "var(--l-violet)", "#f3b3c4"];
  return (
    <div className="l-burst" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const dist = 70 + (i % 3) * 22;
        return <span key={i} style={{ background: colors[i % 4], ["--dx" as string]: `${Math.cos(angle) * dist}px`, ["--dy" as string]: `${Math.sin(angle) * dist}px` }} />;
      })}
    </div>
  );
}

const TABS: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: "/lite", label: "Practice", icon: <path d="M13 3L5 14h6l-1 7 8-11h-6z" /> },
  { href: "/lite/vocab", label: "Vocab", icon: <><rect x="3" y="6" width="14" height="14" rx="3" /><path d="M7 3h11a3 3 0 0 1 3 3v11" /></> },
  { href: "/lite/sprints", label: "Sprints", icon: <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M4 10h16M9 3v4M15 3v4" /></> },
  { href: "/lite/me", label: "Me", icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></> },
];

export function TabBar() {
  const pathname = usePathname();
  // Each tab starts flush left, even if something ever nudged the page sideways.
  useEffect(() => { if (window.scrollX) window.scrollTo(0, window.scrollY); }, [pathname]);
  return (
    <nav className="l-tabbar" aria-label="Lite">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} prefetch aria-current={pathname === t.href ? "page" : undefined}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{t.icon}</svg>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
