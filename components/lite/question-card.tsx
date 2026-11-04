"use client";

import { useEffect, useRef } from "react";
import type { LiteCard } from "@/lib/server/lite-stream";
import { Burst, DIFFICULTY } from "@/components/lite/ui";

export type Letter = "A" | "B" | "C" | "D";
const LETTERS: Letter[] = ["A", "B", "C", "D"];

/** Passage text, with any markdown table (Math data questions) drawn as a real table. */
function Passage({ text }: { text: string }) {
  const blocks: { table: boolean; lines: string[] }[] = [];
  for (const line of text.split("\n")) {
    const table = line.trim().startsWith("|");
    const last = blocks.at(-1);
    if (last && last.table === table) last.lines.push(line);
    else blocks.push({ table, lines: [line] });
  }
  return (
    // Passages in the website's serif, the way the real test sets them.
    <div style={{ fontFamily: "var(--l-serif)", fontSize: 18, lineHeight: 1.6, color: "var(--l-body)" }}>
      {blocks.map((b, i) => {
        if (!b.table) return <p key={i} style={{ margin: "0 0 10px", whiteSpace: "pre-wrap", textWrap: "pretty" }}>{b.lines.join("\n").trim()}</p>;
        const rows = b.lines.filter((l) => !/^\s*\|[\s:|-]+\|\s*$/.test(l)).map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
        return (
          <div key={i} style={{ overflowX: "auto", margin: "4px 0 12px" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 15, minWidth: "100%" }}>
              <tbody>
                {rows.map((cells, r) => (
                  <tr key={r} style={{ background: r === 0 ? "var(--l-soft)" : undefined }}>
                    {cells.map((c, j) => <td key={j} style={{ border: "1px solid var(--l-line)", padding: "6px 10px", fontWeight: r === 0 ? 700 : 400 }}>{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

/**
 * One question. Tapping a choice grades it at once (`onAnswer` resolves with the graded card),
 * then the parent shows the explanation. Grid-ins can't be answered in Lite.
 */
export function QuestionCard({ card, onAnswer, fullSiteHref }: {
  card: LiteCard;
  /** Called once per card; the parent marks it graded right away (see gradeLocally). */
  onAnswer: (choice: Letter) => void;
  /** Where a grid-in (typed answer) can be done instead. */
  fullSiteHref?: string;
}) {
  const result = card.result;

  function stateOf(letter: Letter): string {
    if (!result) return "";
    if (letter === result.answer) return result.choice === letter ? "right pop" : "right";
    if (letter === result.choice) return "wrong shake";
    return "dim";
  }

  function mark(letter: Letter) {
    if (!result) return letter;
    if (letter === result.answer) return "✓";
    if (letter === result.choice) return "✕";
    return letter;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <span className="l-chip" style={{ background: "var(--l-soft2)", color: "var(--l-text2)" }}>{card.subcategory} · {DIFFICULTY[card.difficulty] ?? card.difficulty}</span>
        {card.mistake && <span className="l-chip" style={{ background: "var(--l-accent-soft)", color: "var(--l-accent-ink)" }}>From your mistakes</span>}
      </div>

      {card.passage && <Passage text={card.passage} />}
      <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4, margin: 0, whiteSpace: "pre-wrap" }}>{card.stem}</p>

      {card.questionType !== "multiple_choice" || !card.options ? (
        <div className="l-tile" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>This one needs a typed answer, so it&apos;s done on the full site.</p>
          {fullSiteHref && <a className="l-btn small" href={fullSiteHref} style={{ textDecoration: "none", alignSelf: "flex-start" }}>Answer on full site</a>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }} role="group" aria-label="Answer choices">
          {LETTERS.map((letter) => (
            <button key={letter} className={`l-choice ${stateOf(letter)}`} onClick={() => { if (!result) onAnswer(letter); }} disabled={!!result}
              aria-label={`${letter}: ${card.options![letter]}${result?.answer === letter ? " (correct answer)" : result?.choice === letter ? " (your answer)" : ""}`}>
              <span className="l-letter">{mark(letter)}</span>
              <span style={{ paddingTop: 3 }}>{card.options![letter]}</span>
            </button>
          ))}
        </div>
      )}
      {result?.correct && <Burst key={card.answerId} />}
    </div>
  );
}

/**
 * Once the explanation is up, a tap anywhere (or Enter, Space, →) moves on, so nobody has to
 * reach for the Next button. Taps on other controls (✕, links, the Next button itself) keep
 * their own meaning, and a short grace period stops the answering tap from also skipping.
 */
export function useTapToContinue(enabled: boolean, onContinue: () => void) {
  const latest = useRef(onContinue);
  useEffect(() => { latest.current = onContinue; });
  useEffect(() => {
    if (!enabled) return;
    const since = Date.now();
    const ready = () => Date.now() - since > 400;
    const onClick = (e: MouseEvent) => {
      if (!ready() || (e.target as Element).closest("button, a, input, [data-no-advance]")) return;
      latest.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!ready() || !["Enter", " ", "ArrowRight"].includes(e.key)) return;
      if ((e.target as Element).closest?.("button, a, input")) return;
      e.preventDefault();
      latest.current();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
  }, [enabled]);
}

/** A light buzz on phones that support it: one tap for right, two for wrong. */
export function buzz(correct: boolean) {
  try { navigator.vibrate?.(correct ? 18 : [30, 60, 30]); } catch { /* not supported */ }
}

/**
 * The card as answered, worked out on the phone from its answer key so right/wrong shows the
 * instant it's tapped. The server records the same answer in the background (/api/lite/answer).
 */
export function gradeLocally(card: LiteCard, choice: Letter): LiteCard {
  if (!card.key) return card;
  return { ...card, result: { choice, correct: choice === card.key.answer, answer: card.key.answer, gridAnswer: null, explanation: card.key.explanation } };
}

/** The sheet that slides up after an answer: right/wrong, the explanation, and Next. */
export function ExplanationSheet({ card, onNext, nextLabel = "Next", busy = false }: {
  card: LiteCard; onNext: () => void; nextLabel?: string; busy?: boolean;
}) {
  const r = card.result!;
  return (
    <div className="l-sheet docked" role="region" aria-label="Explanation" aria-live="polite">
      <div className="l-grabber" />
      <p className="l-h2" style={{ color: r.correct ? "var(--l-right)" : "var(--l-wrong)" }}>
        {r.correct ? ["Nice!", "Correct!", "Got it!", "Nailed it!"][card.position % 4] : `Not quite: it's ${r.answer}`}
      </p>
      <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--l-text2)", margin: "10px 0 18px", whiteSpace: "pre-wrap" }}>{r.explanation}</p>
      <button className="l-btn" onClick={onNext} disabled={busy}>{busy ? "Loading…" : nextLabel}</button>
      <p style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--l-faint)", margin: "10px 0 0" }}>or tap anywhere to continue</p>
    </div>
  );
}
