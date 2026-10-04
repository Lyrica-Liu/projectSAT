"use client";

import { useEffect } from "react";
import { StatusPage } from "@/components/ui/status-page";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      eyebrow="Something went wrong"
      title="That didn't load."
      body="It's not you — something broke on our side. Answers you've already saved are safe. Try again, and if it keeps happening, come back in a few minutes."
    >
      <button onClick={reset} style={{
        border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-strong)",
        fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "12px 24px",
        borderRadius: "var(--radius-lg)", cursor: "pointer",
      }}>
        Try again
      </button>
    </StatusPage>
  );
}
