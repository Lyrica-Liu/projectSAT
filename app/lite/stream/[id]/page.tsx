"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { LiteCard } from "@/lib/server/lite-stream";
import { ExplanationSheet, QuestionCard, buzz, gradeLocally, useTapToContinue, type Letter } from "@/components/lite/question-card";
import { DIFFICULTY, ErrorNote, Glow, Loading, Skeleton, api, fetchMe } from "@/components/lite/ui";

interface Recap {
  answered: number;
  correct: number;
  mistakesFixed: number;
  bySkill: { subcategory: string; answered: number; correct: number; tierBefore: string | null; tierAfter: string | null }[];
}

const TIER_RANK: Record<string, number> = { easy: 0, "medium-low": 1, "medium-high": 2, hard: 3 };

/** A placeholder card while a question is on its way. */
function CardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }} aria-busy="true" aria-label="Loading a question">
      <Skeleton height={28} style={{ width: 170, borderRadius: 999 }} />
      <Skeleton height={110} />
      <Skeleton height={24} style={{ width: "80%" }} />
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={56} style={{ borderRadius: 18 }} />)}
    </div>
  );
}

/**
 * The endless stream: one card at a time until the student stops. /lite/stream/new?mode=…
 * starts a stream right here (so Start responds instantly), then the URL becomes its id.
 */
export default function LiteStream() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(params.id === "new" ? null : params.id);
  const [card, setCard] = useState<LiteCard | null>(null);
  const [tally, setTally] = useState({ answered: 0, correct: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState<{ answerId: string; choice: Letter } | null>(null);
  const [recap, setRecap] = useState<Recap | null>(null);
  const [ending, setEnding] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // Saving the answer, then fetching the next card, both while the student reads the explanation.
  const prefetch = useRef<Promise<LiteCard> | null>(null);

  const nextCard = useCallback((id: string) => api<{ card: LiteCard }>("/api/lite/stream/next", { sessionId: id }).then((r) => r.card), []);

  useEffect(() => {
    if (params.id === "new") {
      const mode = search.get("mode") ?? "adaptive";
      const pick = search.get("pick") ?? undefined;
      api<{ sessionId: string; card: LiteCard }>("/api/lite/stream/start", { mode, pick }).then((r) => {
        setSessionId(r.sessionId);
        setCard(r.card);
        window.history.replaceState(null, "", `/lite/stream/${r.sessionId}`);
      }).catch((e) => setError((e as Error).message));
      return;
    }
    api<{ kind: string; cards: LiteCard[] }>(`/api/lite/session/${params.id}`).then(async ({ kind, cards }) => {
      if (kind !== "stream") { router.replace("/lite"); return; }
      const done = cards.filter((c) => c.result);
      setTally({ answered: done.length, correct: done.filter((c) => c.result!.correct).length });
      setCard(cards.find((c) => !c.result) ?? await nextCard(params.id));
    }).catch((e) => setError((e as Error).message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveThenPrefetch(answerId: string, choice: Letter) {
    const id = sessionId!;
    prefetch.current = api("/api/lite/answer", { answerId, choice }).then(() => nextCard(id));
    prefetch.current.catch(() => setSaveFailed({ answerId, choice }));
  }

  function answer(choice: Letter) {
    if (!card || card.result) return;
    const graded = gradeLocally(card, choice);
    if (graded.result) buzz(graded.result.correct);
    setCard(graded);
    setTally((t) => ({ answered: t.answered + 1, correct: t.correct + (graded.result?.correct ? 1 : 0) }));
    setSaveFailed(null);
    saveThenPrefetch(card.answerId, choice);
  }

  async function next() {
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    try {
      const upcoming = await (prefetch.current ?? nextCard(sessionId));
      prefetch.current = null;
      setCard(upcoming);
      window.scrollTo({ top: 0 });
    } catch {
      // Usually the answer didn't save; the retry note below handles it.
      if (!saveFailed) setError("Couldn't load the next question. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  function retrySave() {
    if (!saveFailed) return;
    setSaveFailed(null);
    saveThenPrefetch(saveFailed.answerId, saveFailed.choice);
  }

  async function stop() {
    if (!sessionId) { router.push("/lite"); return; }
    setEnding(true);
    try {
      await prefetch.current?.catch(() => {});
      const r = await api<Recap>("/api/lite/stream/end", { sessionId });
      if (r.answered === 0) router.push("/lite");
      else setRecap(r);
    } catch {
      router.push("/lite");
    }
  }

  async function keepGoing() {
    setLeaving(true);
    try {
      const me = await fetchMe();
      const q = new URLSearchParams({ mode: me.lastMode, ...(me.lastMode === "pick" && me.lastPick ? { pick: me.lastPick } : {}) });
      window.location.href = `/lite/stream/new?${q}`;
    } catch {
      router.push("/lite");
    }
  }

  useTapToContinue(!!card?.result && !busy && !ending && !recap, next);

  if (ending && !recap) return <Loading label="Wrapping up…" />;

  if (recap) {
    const pct = Math.round((recap.correct / recap.answered) * 100);
    return (
      <>
        <Glow tone="coral" size={460} style={{ left: -60, top: 40 }} />
        <Glow tone="violet" size={380} style={{ right: -160, top: -60 }} />
        <main className="l-page no-tabs" style={{ minHeight: "100dvh" }}>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <span className="l-chip" style={{ background: "rgba(255,255,255,.85)", fontSize: 14 }}>Nice session</span>
            <div className="l-big-num" style={{ fontSize: 104, marginTop: 18 }}>{recap.correct}<span style={{ color: "var(--l-dim)" }}>/{recap.answered}</span></div>
            <p style={{ fontSize: 17, fontWeight: 600, margin: "12px 0 0" }}>{pct}% right</p>
          </div>
          {recap.mistakesFixed > 0 && (
            <div className="l-tile" style={{ background: "var(--l-accent-soft)", fontWeight: 600 }}>
              {recap.mistakesFixed} old {recap.mistakesFixed === 1 ? "mistake" : "mistakes"} fixed
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {recap.bySkill.map((s) => {
              const up = s.tierBefore !== s.tierAfter && s.tierAfter && TIER_RANK[s.tierAfter] > (s.tierBefore ? TIER_RANK[s.tierBefore] : -1);
              return (
                <div key={s.subcategory}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 600 }}>
                    <span>{s.subcategory}</span><span>{s.correct}/{s.answered}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "var(--l-soft2)", marginTop: 8 }}>
                    <div style={{ width: `${(s.correct / s.answered) * 100}%`, height: 8, borderRadius: 4, background: "var(--l-gradient)" }} />
                  </div>
                  {up && <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 700, color: "var(--l-violet-ink)" }}>Level up! Now {DIFFICULTY[s.tierAfter!]}</p>}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
            <button className="l-btn" onClick={() => router.push("/lite")} disabled={leaving}>Done</button>
            <button className="l-btn ghost" onClick={keepGoing} disabled={leaving}>{leaving ? "Starting…" : "Keep going"}</button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Glow tone="rose" size={420} style={{ left: -60, bottom: -200, position: "fixed" }} />
      <main className="l-page no-tabs" style={{ paddingBottom: card?.result ? "52dvh" : undefined }}>
        <header data-no-advance style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 5, background: "rgba(255,255,255,.9)", backdropFilter: "blur(8px)", margin: "-16px -20px 0", padding: "calc(env(safe-area-inset-top) + 12px) 20px 12px" }}>
          <button onClick={stop} disabled={ending} aria-label="Stop practicing" style={{ border: 0, background: "var(--l-soft2)", width: 40, height: 40, borderRadius: "50%", fontSize: 18, fontWeight: 600, color: "var(--l-ink)" }}>✕</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--l-muted)" }} aria-live="polite">{tally.answered} answered · {tally.correct} right</span>
          <span style={{ width: 40 }} />
        </header>
        {card ? <QuestionCard key={card.answerId} card={card} onAnswer={answer} /> : !error && <CardSkeleton />}
        {saveFailed && <ErrorNote message="Couldn't save that answer." onRetry={retrySave} />}
        <ErrorNote message={error} />
        {error && !card && <button className="l-btn" onClick={() => router.push("/lite")}>Back</button>}
      </main>
      {card?.result && <ExplanationSheet card={card} onNext={next} busy={busy} />}
    </>
  );
}
