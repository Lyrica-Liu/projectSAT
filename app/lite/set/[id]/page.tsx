"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { LiteCard } from "@/lib/server/lite-stream";
import { ExplanationSheet, QuestionCard, buzz, gradeLocally, useTapToContinue, type Letter } from "@/components/lite/question-card";
import { ErrorNote, Glow, Loading, api } from "@/components/lite/ui";

interface Finished { score: number; sprintCompleted: { title: string } | null }

/**
 * A fixed set played as cards: a sprint day (or a notebook review). Same cards as the stream,
 * with a progress bar; after the last one the set is finished exactly as on the website.
 */
export default function LiteSet() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cards, setCards] = useState<LiteCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Answers save in the background; the set is only finished once they all have.
  const saves = useRef(new Map<string, Promise<void>>());
  const failed = useRef(new Map<string, Letter>());

  useEffect(() => {
    api<{ kind: string; completed: boolean; cards: LiteCard[] }>(`/api/lite/session/${id}`).then((s) => {
      if (s.kind !== "set") { router.replace("/lite"); return; }
      setCards(s.cards);
      if (s.completed) {
        const right = s.cards.filter((c) => c.result?.correct).length;
        setFinished({ score: s.cards.length ? Math.round((right / s.cards.length) * 100) : 0, sprintCompleted: null });
      } else {
        const first = s.cards.findIndex((c) => !c.result);
        setIndex(first === -1 ? s.cards.length - 1 : first);
      }
    }).catch((e) => setError((e as Error).message));
  }, [id, router]);

  function save(answerId: string, choice: Letter) {
    const p = api("/api/lite/answer", { answerId, choice }).then(() => {});
    saves.current.set(answerId, p.catch(() => { failed.current.set(answerId, choice); }));
  }

  function answer(choice: Letter) {
    const card = cards![index];
    if (card.result) return;
    const graded = gradeLocally(card, choice);
    if (graded.result) buzz(graded.result.correct);
    setCards((cs) => cs!.map((c, i) => (i === index ? graded : c)));
    save(card.answerId, choice);
  }

  async function next() {
    if (!cards) return;
    const following = cards.findIndex((c, i) => i > index && !c.result);
    if (following !== -1) { setIndex(following); window.scrollTo({ top: 0 }); return; }
    setBusy(true);
    setError(null);
    try {
      // Finishing grades from the saved answers, so every background save has to land first.
      await Promise.all(saves.current.values());
      for (const [answerId, choice] of [...failed.current]) {
        await api("/api/lite/answer", { answerId, choice });
        failed.current.delete(answerId);
      }
      setFinished(await api<Finished>("/api/grade-session", { sessionId: id, complete: true }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useTapToContinue(!!cards?.[index]?.result && !busy && !finished, next);

  if (finished && cards) {
    const right = cards.filter((c) => c.result?.correct).length;
    return (
      <>
        <Glow tone="rose" size={480} style={{ left: -45, top: 40 }} />
        <Glow tone="violet" size={380} style={{ right: -160, top: -60 }} />
        <main className="l-page no-tabs" style={{ minHeight: "100dvh" }}>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <span className="l-chip" style={{ background: "rgba(255,255,255,.85)", fontSize: 14 }}>{finished.sprintCompleted ? "Sprint complete!" : "Set done"}</span>
            <div className="l-big-num" style={{ fontSize: 112, marginTop: 18 }}>{right}<span style={{ color: "var(--l-dim)" }}>/{cards.length}</span></div>
            <p style={{ fontSize: 17, fontWeight: 600, margin: "12px 0 0" }}>{finished.score}% right</p>
          </div>
          {finished.sprintCompleted && (
            <div className="l-card" style={{ background: "var(--l-accent-soft)", textAlign: "center" }}>
              <p className="l-h2">You finished {finished.sprintCompleted.title}</p>
              <p className="l-sub" style={{ marginTop: 8 }}>Every day done. Pick a new sprint whenever you&apos;re ready.</p>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
            <button className="l-btn" onClick={() => router.push("/lite")}>Done</button>
            <button className="l-btn ghost" onClick={() => router.push("/lite/sprints")}>Sprints</button>
          </div>
        </main>
      </>
    );
  }

  if (!cards) return error ? <main className="l-page no-tabs"><ErrorNote message={error} /><button className="l-btn" onClick={() => router.push("/lite")}>Back</button></main> : <Loading />;
  const card = cards[index];
  const isLast = cards.every((c, i) => i === index || c.result);

  return (
    <>
      <main className="l-page no-tabs" style={{ paddingBottom: card.result ? "52dvh" : undefined }}>
        <header data-no-advance style={{ position: "sticky", top: 0, zIndex: 5, background: "rgba(255,255,255,.9)", backdropFilter: "blur(8px)", margin: "-16px -20px 0", padding: "calc(env(safe-area-inset-top) + 12px) 20px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 3 }} aria-label={`Question ${index + 1} of ${cards.length}`}>
            {cards.map((c, i) => (
              <span key={c.answerId} style={{ flex: 1, height: 4, borderRadius: 2, background: i === index ? "var(--l-accent)" : c.result ? "var(--l-ink)" : "var(--l-line)" }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => router.push("/lite")} aria-label="Leave (progress is kept)" style={{ border: 0, background: "var(--l-soft2)", width: 40, height: 40, borderRadius: "50%", fontSize: 18, fontWeight: 600, color: "var(--l-ink)" }}>✕</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--l-muted)" }}>{index + 1} / {cards.length}</span>
            <span style={{ width: 40 }} />
          </div>
        </header>
        <QuestionCard key={card.answerId} card={card} onAnswer={answer} fullSiteHref={`/practice/${id}`} />
        {/* A typed-answer question can't be done here; skipping it counts as a miss when the set is finished. */}
        {card.questionType !== "multiple_choice" && <button className="l-btn ghost" onClick={next} disabled={busy}>Skip it</button>}
        <ErrorNote message={error} />
      </main>
      {card.result && <ExplanationSheet card={card} onNext={next} busy={busy} nextLabel={isLast ? "Finish" : "Next"} />}
    </>
  );
}
