"use client";

import { useEffect, useRef, useState } from "react";
import type { VocabWord } from "@/lib/vocab/words";
import type { ReviewResult } from "@/lib/vocab/srs";
import { ErrorNote, Glow, Skeleton, TabBar, api, useCached, writeCache } from "@/components/lite/ui";
import { buzz } from "@/components/lite/question-card";

type Card = VocabWord & { isNew: boolean; box: number };
interface Stats { total: number; learned: number; learning: number; unseen: number; dueNow: number }
interface VocabData { deck: Card[]; stats: Stats }

type Face = "front" | "to-back" | "to-front";
type Motion = "enter" | "exit-left" | "exit-right" | "";
const MOTION_MS = 320;

/** The example sentence with the word (and its endings: -s, -ed, -ing…) highlighted. */
function Example({ sentence, word }: { sentence: string; word: string }) {
  const stem = word.replace(/e$/, "");
  const parts = sentence.split(new RegExp(`(\\b${stem}\\w*)`, "i"));
  return <>{parts.map((p, i) => (i % 2 === 1 ? <strong key={i} style={{ color: "var(--l-accent-ink)" }}>{p}</strong> : p))}</>;
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "left" ? "M11 3.5 5.5 9l5.5 5.5" : "M7 3.5 12.5 9 7 14.5"} />
    </svg>
  );
}

/** Studying today's deck as a stack of flashcards. */
function Study({ deck, onDone }: { deck: Card[]; onDone: (tally: { got: number; learning: number }) => void }) {
  const [cards, setCards] = useState(deck);
  const [index, setIndex] = useState(0);
  const [face, setFace] = useState<Face>("front");
  const [motion, setMotion] = useState<Motion>("enter");
  const [graded, setGraded] = useState<Record<string, ReviewResult>>({});
  const [saveError, setSaveError] = useState(false);
  const [drag, setDrag] = useState(0);
  const dragStart = useRef<number | null>(null);
  const swiped = useRef(false);
  const card = cards[index];
  const moving = motion === "exit-left" || motion === "exit-right";

  /** `total` is the deck length after this move (grading can add a card to the end). */
  function go(to: number, exit: "exit-left" | "exit-right", total = cards.length) {
    if (moving) return;
    setMotion(exit);
    setDrag(0);
    window.setTimeout(() => {
      if (to >= total) {
        const results = Object.values(graded);
        onDone({ got: results.filter((r) => r === "got_it").length, learning: results.filter((r) => r === "still_learning").length });
        return;
      }
      setIndex(to);
      setFace("front");
      setMotion("enter");
    }, MOTION_MS);
  }
  const next = () => { if (index < cards.length - 1 || cards.every((c) => graded[c.word])) go(index + 1, "exit-left"); };
  const prev = () => { if (index > 0) go(index - 1, "exit-right"); };
  const flip = () => { if (!moving) setFace((f) => (f === "to-back" ? "to-front" : "to-back")); };

  function grade(result: ReviewResult) {
    if (moving) return;
    buzz(result === "got_it");
    api("/api/lite/vocab", { word: card.word, result }).catch(() => setSaveError(true));
    const nextGraded = { ...graded, [card.word]: result };
    setGraded(nextGraded);
    // A word still being learned comes round once more at the end of this sitting.
    const repeats = cards.filter((c) => c.word === card.word).length;
    const nextCards = result === "still_learning" && repeats < 2 ? [...cards, card] : cards;
    setCards(nextCards);
    if (index + 1 >= nextCards.length) {
      setMotion("exit-left");
      window.setTimeout(() => {
        const results = Object.values(nextGraded);
        onDone({ got: results.filter((r) => r === "got_it").length, learning: results.filter((r) => r === "still_learning").length });
      }, MOTION_MS);
    } else {
      go(index + 1, "exit-left", nextCards.length);
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") { e.preventDefault(); flip(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const remainingBehind = cards.length - index - 1;
  const done = graded[card.word];

  return (
    <main className="l-page no-tabs" style={{ minHeight: "100dvh", gap: 14 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => { const r = Object.values(graded); onDone({ got: r.filter((x) => x === "got_it").length, learning: r.filter((x) => x === "still_learning").length }); }}
          aria-label="Stop studying" style={{ border: 0, background: "var(--l-soft2)", width: 40, height: 40, borderRadius: "50%", fontSize: 18, fontWeight: 600, color: "var(--l-ink)", flexShrink: 0 }}>✕</button>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--l-soft2)", overflow: "hidden" }}>
          <div style={{ width: `${(Object.keys(graded).length / new Set(cards.map((c) => c.word)).size) * 100}%`, height: "100%", borderRadius: 3, background: "var(--l-gradient)", transition: "width .3s ease" }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--l-muted)", minWidth: 48, textAlign: "right" }}>{index + 1} / {cards.length}</span>
      </header>

      {/* Card and buttons sit centered in the space under the header. */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div className="l-deck">
        {remainingBehind > 1 && <div className="l-deck-under u2" />}
        {remainingBehind > 0 && <div className="l-deck-under u1" />}

        <div
          key={`${card.word}-${index}`}
          className={`l-flash ${motion}`}
          onClick={() => { if (swiped.current) { swiped.current = false; return; } flip(); }}
          onPointerDown={(e) => { if (!moving) dragStart.current = e.clientX; }}
          onPointerMove={(e) => { if (dragStart.current !== null) setDrag(e.clientX - dragStart.current); }}
          onPointerUp={() => {
            if (dragStart.current === null) return;
            dragStart.current = null;
            swiped.current = Math.abs(drag) > 8;
            if (drag < -70) next();
            else if (drag > 70) prev();
            else setDrag(0);
          }}
          onPointerCancel={() => { dragStart.current = null; setDrag(0); }}
          role="button" tabIndex={0}
          aria-label={face === "to-back" ? `${card.word}: ${card.definition}. Tap to flip back` : `${card.word}. Tap to see the meaning`}
          onKeyDown={(e) => { if (e.key === "Enter") flip(); }}
          style={drag ? { transform: `translateX(${drag}px) rotate(${drag / 28}deg)`, animation: "none" } : undefined}
        >
          <div className={`l-flash-inner ${face}`}>
            <div className="l-flash-face front">
              <Glow tone="coral" size={260} style={{ right: -100, top: -110 }} />
              <Glow tone="violet" size={250} style={{ left: -90, bottom: -120 }} />
              {card.isNew && !done && <span className="l-chip" style={{ position: "absolute", top: 20, left: 20, background: "#fff", color: "var(--l-accent-ink)" }}>New word</span>}
              {done && <span className="l-chip" style={{ position: "absolute", top: 20, left: 20, background: "#fff", color: done === "got_it" ? "var(--l-violet-ink)" : "var(--l-coral-ink)" }}>{done === "got_it" ? "✓ Got it" : "Still learning"}</span>}
              <p style={{ position: "relative", fontSize: 42, fontWeight: 800, letterSpacing: "-0.045em", margin: 0 }}>{card.word}</p>
              <p style={{ position: "relative", fontSize: 16, fontWeight: 600, color: "var(--l-muted)", margin: "8px 0 0", fontStyle: "italic" }}>{card.pos}</p>
              <p style={{ position: "absolute", bottom: 22, fontSize: 13, fontWeight: 600, color: "var(--l-faint)", margin: 0 }}>Tap to flip</p>
            </div>
            <div className="l-flash-face back">
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--l-muted)", margin: 0 }}>{card.word} <span style={{ fontWeight: 500, fontStyle: "italic" }}>· {card.pos}</span></p>
              <p style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.18, margin: 0 }}>{card.definition}</p>
              <div style={{ height: 1, background: "var(--l-line)" }} />
              <p style={{ fontSize: 16, lineHeight: 1.55, color: "var(--l-text2)", margin: 0 }}><Example sentence={card.example} word={card.word} /></p>
            </div>
          </div>
        </div>

        <button className="l-arrow prev" onClick={prev} disabled={index === 0 || moving} aria-label="Previous card"><Chevron dir="left" /></button>
        <button className="l-arrow next" onClick={next} disabled={moving || (index === cards.length - 1 && !cards.every((c) => graded[c.word]))} aria-label="Next card"><Chevron dir="right" /></button>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button className="l-btn ghost" onClick={() => grade("still_learning")} disabled={moving}>Still learning</button>
        <button className="l-btn gradient" onClick={() => grade("got_it")} disabled={moving}>Got it</button>
      </div>
      </div>
      {saveError && <ErrorNote message="Some cards didn't save. Check your connection." />}
    </main>
  );
}

/** Vocab: today's deck and progress, then studying it as flashcards. */
export default function LiteVocab() {
  const { data, error, refresh, setData } = useCached<VocabData>("vocab", "/api/lite/vocab");
  const [studying, setStudying] = useState<Card[] | null>(null);
  const [summary, setSummary] = useState<{ got: number; learning: number } | null>(null);

  function finish(tally: { got: number; learning: number }) {
    setStudying(null);
    setSummary(tally);
    // Don't show the just-studied deck again from the cache while fresh data loads.
    if (data) { const cleared = { ...data, deck: [] }; setData(cleared); writeCache("vocab", cleared); }
    refresh();
  }

  if (studying) return <Study deck={studying} onDone={finish} />;

  const tile = (n: number | undefined, label: string, tone: string) => (
    <div className="l-tile" style={{ textAlign: "center", background: tone }}>
      <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>{n ?? "–"}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--l-muted)", margin: "2px 0 0" }}>{label}</p>
    </div>
  );

  const deck = data?.deck ?? [];
  const stats = data?.stats;

  return (
    <>
      <Glow tone="violet" size={420} style={{ right: -150, top: -120 }} />
      <Glow tone="coral" size={340} style={{ left: -150, top: 180 }} />
      <main className="l-page">
        <div>
          <h1 className="l-h1">Vocab</h1>
          <p className="l-sub" style={{ marginTop: 6 }}>SAT words, a few minutes a day.</p>
        </div>

        {summary && (
          <div className="l-card" style={{ background: "var(--l-gradient-soft)", textAlign: "center", padding: "26px 22px" }}>
            <p className="l-eyebrow">Deck done</p>
            <p className="l-big-num" style={{ fontSize: 64, margin: "10px 0 0" }}>{summary.got}</p>
            <p style={{ fontSize: 16, fontWeight: 600, margin: "8px 0 0" }}>
              {summary.got === 1 ? "word" : "words"} got right{summary.learning > 0 ? ` · ${summary.learning} still learning` : ""}
            </p>
          </div>
        )}

        {!data ? <Skeleton height={190} style={{ borderRadius: 28 }} /> : (
          <div className="l-card" style={{ background: "var(--l-ink)", color: "#fff" }}>
            <Glow tone="rose" size={280} style={{ right: -100, top: -120 }} />
            <Glow tone="violet" size={240} style={{ left: -90, bottom: -140 }} />
            <div style={{ position: "relative" }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,.72)", margin: 0 }}>
                {stats!.dueNow > 0 ? `${stats!.dueNow} ${stats!.dueNow === 1 ? "word" : "words"} due for review` : "Nothing due right now"}
              </p>
              <p style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.04em", margin: "8px 0 0" }}>{deck.length > 0 ? `${deck.length} cards today` : "All caught up"}</p>
              {deck.length > 0 && (
                <p style={{ fontSize: 15, color: "rgba(255,255,255,.72)", margin: "6px 0 0" }}>
                  {deck.filter((c) => c.isNew).length} new · {deck.filter((c) => !c.isNew).length} review
                </p>
              )}
              <button className="l-btn gradient" style={{ marginTop: 20 }} onClick={() => { setSummary(null); setStudying(deck); }} disabled={deck.length === 0}>
                {deck.length === 0 ? "Come back later" : "Study"}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {tile(stats?.learned, "Learned", "var(--l-violet-soft)")}
          {tile(stats?.learning, "Learning", "var(--l-accent-soft)")}
          {tile(stats?.unseen, "New", "var(--l-coral-soft)")}
        </div>
        {stats && <p className="l-sub">{stats.total} words in the deck. A word counts as learned once you&apos;ve known it five times in a row, spaced out over about a month.</p>}
        <ErrorNote message={error} onRetry={refresh} />
      </main>
      <TabBar />
    </>
  );
}
