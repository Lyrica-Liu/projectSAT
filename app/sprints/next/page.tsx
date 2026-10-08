"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingScreen } from "@/components/ui/nav";

/** Starts (or resumes) the active sprint's next day and goes straight into it. */
export default function NextSprintDayPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  /** React may run the effect twice in development; only ever start one set. */
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetch("/api/sprints/next-day", { method: "POST" }).then(async (res) => {
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.sessionId) router.replace(`/practice/${body.sessionId}`);
      else setError(body.error ?? "Couldn't start today's set.");
    });
  }, [router]);

  if (!error) return <LoadingScreen message="Starting today's sprint set…" />;
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--canvas)", fontFamily: "var(--font-serif)", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 18, color: "var(--text-strong)", margin: "0 0 16px" }}>{error}</p>
        <Link href="/sprints" style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--accent)" }}>Back to sprints</Link>
      </div>
    </div>
  );
}
