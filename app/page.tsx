"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mark } from "@/components/ui/mark";

const STUDY_MECHANICS = ["Adaptive difficulty", "Real test timing", "Full explanations"];

const SEQUENCE_DAYS = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  const tag = n === 30 ? "R" : n % 3 === 0 ? "M" : "E";
  return { n, tag };
});

const TREND_POINTS = [
  { x: 0, y: 46 }, { x: 44, y: 39 }, { x: 88, y: 41 },
  { x: 132, y: 26 }, { x: 176, y: 30 }, { x: 220, y: 12 },
];
const TREND_LEN = 260;

const RING_R = 42;
const RING_C = 2 * Math.PI * RING_R;
const RING_ACCURACY = 78;

const HERO_HEADLINE = "You don't have to grind the DSAT for a year.";

const HOW_IT_WORKS = [
  { n: "01", title: "Take the diagnostic", body: "26 questions across Reading & Writing and Math, about 40 minutes. It shows where you actually lose points." },
  { n: "02", title: "Get your thirty-day plan", body: "A day-by-day sequence built around your weakest skills, laid out in full before you start." },
  { n: "03", title: "Do one session a day", body: "About 30 minutes each. Difficulty adjusts as you go, and every answer comes with an explanation." },
];

type Choice = "A" | "B" | "C" | "D";

/** A real Words in Context question from the bank, answerable right on the page — nothing is saved. */
const SAMPLE_QUESTION: {
  passage: string; stem: string; options: Record<Choice, string>; answer: Choice;
  why: string; wrong: Partial<Record<Choice, string>>;
} = {
  passage: "Though praised by audiences, the film was dismissed by several prominent critics as a superficial spectacle — visually striking, they conceded, but ultimately hollow in its emotional and intellectual content. The director, undeterred by these assessments, argued that cinema need not always carry a weighty message to be valuable.",
  stem: "As used in the text, what does the word \u201cconceded\u201d most nearly mean?",
  options: { A: "Strongly denied", B: "Reluctantly acknowledged", C: "Enthusiastically celebrated", D: "Carefully analyzed" },
  answer: "B",
  why: "The critics dismiss the film overall, but grant one point in its favor — it is \u201cvisually striking.\u201d That grudging admission is what \u201cconceded\u201d means here.",
  wrong: {
    A: "The critics did acknowledge the film's visual quality; they didn't deny it.",
    C: "The critics were dismissive overall — \u201cconceded\u201d signals a grudging admission, not enthusiasm.",
    D: "\u201cConceded\u201d describes admitting a point, not analyzing it carefully.",
  },
};

const FAQS = [
  {
    q: "How much does it cost?",
    a: "Nothing, for now. 800Path is free during early access — the diagnostic, the thirty-day plan, and every practice session. You don't need an account to start.",
  },
  {
    q: "How much time does it take each day?",
    a: "About 30 minutes. Each daily session is 20 questions, timed at the Digital SAT's pace of roughly a minute and a half per question. The diagnostic at the start takes about 40 minutes.",
  },
  {
    q: "Where do the questions come from?",
    a: "Most come from a hand-built bank written to the Digital SAT's question types and four difficulty tiers, across all eleven Reading & Writing skills and the Math domains. AI-generated practice sets add extra reps on the skills you pick. They aren't official College Board questions.",
  },
];

function useTypewriter(text: string, speed = 32) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return count;
}

/** Types `text` out once, on mount. */
function TypewriterHeadline({ text }: { text: string }) {
  const typedCount = useTypewriter(text);
  const typingDone = typedCount >= text.length;
  return (
    <>
      {text.slice(0, typedCount)}
      <span style={{
        display: "inline-block", width: 3, height: "0.86em", marginLeft: 4, verticalAlign: "-0.08em",
        background: "var(--text-strong)", opacity: typingDone ? 0 : 1,
        animation: typingDone ? "none" : "blink-caret 0.85s step-end infinite",
      }} />
    </>
  );
}

const eyebrowLight: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 500, letterSpacing: "0.16em",
  textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 14px",
};

function CTAButton({ onClick }: { onClick: () => void }) {
  return (
    <div>
      <button onClick={onClick} style={{
        display: "inline-flex", alignItems: "center", background: "var(--brand)", color: "var(--text-on-brand)",
        fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 600, padding: "19px 36px",
        borderRadius: "var(--radius-lg)", border: "none", cursor: "pointer", transition: "background 0.16s",
        boxShadow: "0 10px 26px rgba(32,31,28,.16)",
      }}>Take the free diagnostic</button>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5, color: "var(--text-muted)", margin: "12px 0 0", maxWidth: "44ch" }}>
        About 40 minutes. See where you stand in Reading &amp; Writing and Math, and get a thirty-day plan built around your weak spots. No account needed.
      </p>
    </div>
  );
}

const SKILL_ROWS = [
  { l: "Command of Evidence", v: 82 },
  { l: "Boundaries", v: 61 },
  { l: "Transitions", v: 74 },
];

/** Rest state the mockup animates in from — a photo sitting at a slight angle, small and faded, that
 *  straightens flat, rises, and pops up to full size once it scrolls into view. */
const MOCKUP_HIDDEN_TRANSFORM = "rotate(-22deg) scale(0.62) translateY(120px)";
const MOCKUP_VISIBLE_TRANSFORM = "rotate(0deg) scale(1) translateY(0)";
const MOCKUP_POP_EASE = "cubic-bezier(0.34, 1.76, 0.64, 1)";

/** Wraps `children` in the "photo straightens and pops up" reveal — reused by both mockups so they animate identically. */
function PhotoReveal({ visible, style, children }: { visible: boolean; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{
      willChange: "transform, opacity",
      opacity: visible ? 1 : 0, transform: visible ? MOCKUP_VISIBLE_TRANSFORM : MOCKUP_HIDDEN_TRANSFORM,
      transition: `opacity 0.7s ${MOCKUP_POP_EASE}, transform 1.1s ${MOCKUP_POP_EASE}`,
      ...style,
    }}>
      {children}
    </div>
  );
}

function AnalysisMockup({ visible }: { visible: boolean }) {
  return (
    <PhotoReveal visible={visible} style={{
      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)",
      padding: "20px 22px 22px", boxShadow: "var(--shadow-lg)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13, fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>
        <span>For You · Insights</span>
        <span style={{ letterSpacing: "0", textTransform: "none" }}>Day 24</span>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 15, fontFamily: "var(--font-sans)", fontSize: 12, borderBottom: "1px solid var(--border)" }}>
        <span style={{ paddingBottom: 8, borderBottom: "2px solid var(--text-strong)", color: "var(--text-strong)", fontWeight: 500 }}>English</span>
        <span style={{ paddingBottom: 8, color: "var(--text-faint)" }}>Math</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
        <div style={{ position: "relative", width: 74, height: 74, flexShrink: 0 }}>
          <svg width={74} height={74} viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx={50} cy={50} r={RING_R} fill="none" stroke="var(--surface-2)" strokeWidth={7} />
            <circle
              cx={50} cy={50} r={RING_R} fill="none" stroke="var(--accent)" strokeWidth={7} strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={visible ? RING_C * (1 - RING_ACCURACY / 100) : RING_C}
              style={{ transition: "stroke-dashoffset 1.2s var(--ease-out) 0.45s" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 600, color: "var(--text-strong)" }}>{RING_ACCURACY}%</span>
          </div>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 6px" }}>Overall grasp</p>
          <p style={{ fontSize: 16, color: "var(--text-strong)", margin: "0 0 7px", letterSpacing: "-0.014em" }}>Proficient</p>
          <span style={{ display: "inline-flex", gap: 4 }}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} style={{ width: 18, height: 3, background: i < 3 ? "var(--brand)" : "var(--surface-2)" }} />
            ))}
          </span>
        </div>
      </div>

      <div style={{ padding: "14px 0", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
        {SKILL_ROWS.map((s) => (
          <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-body)", width: 138, flexShrink: 0 }}>{s.l}</span>
            <div style={{ flex: 1, height: 4, background: "var(--surface-2)" }}>
              <div style={{
                height: "100%", background: "var(--text-strong)", width: visible ? `${s.v}%` : "0%",
                transition: "width 1s var(--ease-out) 0.55s",
              }} />
            </div>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", width: 26, textAlign: "right", flexShrink: 0 }}>{s.v}%</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 9 }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)", margin: 0 }}>Accuracy over time</p>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--success)" }}>+9 vs last month</span>
        </div>
        <svg width="100%" height={46} viewBox="0 0 220 60" style={{ display: "block", overflow: "visible" }} preserveAspectRatio="none">
          <polyline
            points={TREND_POINTS.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={TREND_LEN}
            strokeDashoffset={visible ? 0 : TREND_LEN}
            style={{ transition: "stroke-dashoffset 1.3s var(--ease-out) 0.6s" }}
          />
          <g style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s var(--ease-out) 1.7s" }}>
            {TREND_POINTS.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.5} />
            ))}
          </g>
        </svg>
      </div>

      <div style={{ paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, color: "var(--text-strong)" }}>Suggested next: Boundaries</span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--accent)" }}>Start →</span>
      </div>
    </PhotoReveal>
  );
}

/** One real question, answerable before signing up. Picking a choice locks the answer and reveals why. */
function SampleQuestion({ onBegin }: { onBegin: () => void }) {
  const [picked, setPicked] = useState<Choice | null>(null);
  const q = SAMPLE_QUESTION;
  const answered = picked !== null;
  const gotIt = picked === q.answer;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
      <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid var(--border)" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 10px" }}>
          Reading &amp; Writing · Words in Context
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--text-body)", margin: 0 }}>{q.passage}</p>
      </div>
      <div style={{ padding: "18px 26px 24px" }}>
        <p style={{ fontSize: 16, lineHeight: 1.45, color: "var(--text-strong)", margin: "0 0 12px" }}>{q.stem}</p>
        <div role="radiogroup" aria-label="Answer choices" style={{ display: "grid" }}>
          {(Object.keys(q.options) as Choice[]).map((letter) => {
            const isAnswer = letter === q.answer;
            const isPicked = letter === picked;
            const showCorrect = answered && isAnswer;
            const showWrong = answered && isPicked && !isAnswer;
            return (
              <button
                key={letter}
                role="radio"
                aria-checked={isPicked}
                disabled={answered}
                onClick={() => setPicked(letter)}
                style={{
                  display: "flex", gap: 12, alignItems: "baseline", textAlign: "left", width: "100%",
                  padding: "11px 12px", border: "none", borderTop: "1px solid var(--border)",
                  borderLeft: `2px solid ${showCorrect ? "var(--success)" : showWrong ? "var(--danger)" : "transparent"}`,
                  background: showCorrect ? "var(--moss-50)" : "transparent",
                  fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--text-strong)",
                  cursor: answered ? "default" : "pointer", opacity: answered && !isAnswer && !isPicked ? 0.55 : 1,
                }}
              >
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, width: 12, flexShrink: 0, color: showCorrect ? "var(--success)" : showWrong ? "var(--danger)" : "var(--text-faint)" }}>{letter}</span>
                <span>{q.options[letter]}</span>
              </button>
            );
          })}
        </div>

        {answered ? (
          <div aria-live="polite" style={{ margin: "16px 0 0", paddingLeft: 12, borderLeft: `2px solid ${gotIt ? "var(--success)" : "var(--danger)"}` }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: gotIt ? "var(--success)" : "var(--danger)", margin: "0 0 6px" }}>
              {gotIt ? "Correct" : `Not quite — the answer is ${q.answer}`}
            </p>
            {!gotIt && picked && q.wrong[picked] && (
              <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-muted)", margin: "0 0 8px" }}>{q.wrong[picked]}</p>
            )}
            <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-body)", margin: 0 }}>{q.why}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", margin: "18px 0 0" }}>
              <button onClick={onBegin} style={{
                background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600,
                padding: "12px 22px", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer",
              }}>Take the free diagnostic</button>
              <button onClick={() => setPicked(null)} style={{
                background: "none", border: "none", padding: 0, cursor: "pointer",
                fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", textDecoration: "underline",
              }}>Try it again</button>
            </div>
          </div>
        ) : (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", margin: "14px 0 0" }}>Pick an answer to see the explanation.</p>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const goBegin = () => router.push("/onboarding");

  const [analysisVisible, setAnalysisVisible] = useState(false);
  const analysisRef = useRef<HTMLDivElement>(null);
  const [heroMockupVisible, setHeroMockupVisible] = useState(false);
  const heroMockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = analysisRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setAnalysisVisible(entry.isIntersecting),
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = heroMockupRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroMockupVisible(entry.isIntersecting),
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh", fontFamily: "var(--font-serif)", color: "var(--text-body)", overflowX: "hidden" }}>

      <nav style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(246,244,239,.94)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto", padding: "0 40px", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", height: 58 }}>
          <span />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 12, justifySelf: "center" }}>
            <Mark width={30} height={18} fill="var(--text-strong)" />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, letterSpacing: "0.01em", color: "var(--text-muted)" }}>DSAT for self studiers</span>
          </span>
          <Link href="/auth" style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)", justifySelf: "end" }}>Sign in</Link>
        </div>
      </nav>

      <section style={{ maxWidth: 1220, margin: "0 auto", padding: "0 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.02fr 0.98fr", gap: 40, alignItems: "center", padding: "36px 0 40px" }}>

          <div>
            <p style={{ ...eyebrowLight, margin: "0 0 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ width: 26, height: 1, background: "var(--line-strong)" }} />
              Digital SAT · Reading, Writing &amp; Math
            </p>
            <h1 style={{ fontWeight: 400, fontSize: 58, lineHeight: 1.06, letterSpacing: "-0.026em", color: "var(--text-strong)", margin: 0, minHeight: "2.12em" }}>
              <TypewriterHeadline text={HERO_HEADLINE} />
            </h1>
            <div style={{ margin: "26px 0 0" }}>
              <CTAButton onClick={goBegin} />
            </div>
          </div>

          <div ref={heroMockupRef}>
            <PhotoReveal visible={heroMockupVisible} style={{ background: "var(--dark-900)", borderRadius: "var(--radius-xl)", padding: 8, boxShadow: "0 24px 60px rgba(32,31,28,.14)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px 12px", fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--text-on-dark-faint)" }}>
                <span style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Day 4 · English</span>
                <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>7 / 20</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-on-dark)" }}>14:22</span>
                </span>
              </div>
              <div style={{ background: "var(--surface)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                <div style={{ padding: "15px 20px 13px", borderBottom: "1px solid var(--border)" }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 9px" }}>Passage</p>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-body)", margin: 0 }}>
                    The naturalist Anna Botsford Comstock argued that a child taught to look closely at a single leaf had learned more than one marched through a textbook. Her <span style={{ borderBottom: "1.5px solid var(--accent)", paddingBottom: 1, color: "var(--text-strong)" }}>terse</span> field guides omitted nearly everything a rival volume would include.
                  </p>
                </div>
                <div style={{ padding: "14px 20px 16px" }}>
                  <p style={{ fontSize: 14, lineHeight: 1.4, color: "var(--text-strong)", margin: "0 0 10px" }}>
                    As used in the text, <span style={{ fontStyle: "italic" }}>terse</span> most nearly means
                  </p>
                  <div style={{ display: "grid" }}>
                    {[
                      { l: "A", t: "lengthy" },
                      { l: "B", t: "abrupt" },
                      { l: "C", t: "concise", correct: true },
                      { l: "D", t: "unclear" },
                    ].map((o) => (
                      <div key={o.l} style={{
                        display: "flex", gap: 10, padding: "7px 9px", borderTop: "1px solid var(--border)",
                        borderLeft: o.correct ? "2px solid var(--success)" : "2px solid transparent",
                        background: o.correct ? "var(--moss-50)" : "transparent", fontSize: 13,
                        color: o.correct ? "var(--text-strong)" : "var(--text-body)",
                      }}>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, color: o.correct ? "var(--success)" : "var(--text-faint)", width: 9, paddingTop: 3 }}>{o.l}</span>
                        <span>{o.t}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--text-muted)", margin: "10px 0 0", paddingLeft: 10, borderLeft: "2px solid var(--success)" }}>
                    She is set against writers who were <span style={{ fontStyle: "italic" }}>exhaustive</span>. The contrast is length, not tone — which rules out <span style={{ fontStyle: "italic" }}>abrupt</span>.
                  </p>
                </div>
              </div>
            </PhotoReveal>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--text-faint)", margin: "10px 0 0" }}>
              The reading desk — passage held left, reasoning right.
            </p>
          </div>

        </div>
      </section>

      <section id="how-it-works" style={{ maxWidth: 1220, margin: "0 auto", padding: "72px 40px 0" }}>
        <p style={eyebrowLight}>How it works</p>
        <h2 style={{ fontWeight: 400, fontSize: 30, lineHeight: 1.16, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "0 0 28px", maxWidth: "22ch", textWrap: "pretty" }}>
          Diagnose, plan, then practice a little every day.
        </h2>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32, borderTop: "1px solid var(--line-strong)" }}>
          {HOW_IT_WORKS.map((step) => (
            <li key={step.n} style={{ padding: "20px 0 0" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.1em", color: "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>{step.n}</span>
              <h3 style={{ fontWeight: 400, fontSize: 20, lineHeight: 1.25, color: "var(--text-strong)", margin: "8px 0 8px", letterSpacing: "-0.012em" }}>{step.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)", margin: 0, maxWidth: "34ch" }}>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="try-one" style={{ maxWidth: 1220, margin: "0 auto", padding: "72px 40px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 48, alignItems: "start" }}>
          <div>
            <p style={eyebrowLight}>Try one</p>
            <h2 style={{ fontWeight: 400, fontSize: 30, lineHeight: 1.18, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "0 0 14px", maxWidth: "18ch", textWrap: "pretty" }}>
              A real question, before you sign up for anything.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--text-muted)", margin: 0, maxWidth: "36ch" }}>
              This is what a session looks like: a Digital SAT–style question, then a plain explanation of why each choice is right or wrong.
            </p>
          </div>
          <SampleQuestion onBegin={goBegin} />
        </div>
      </section>

      <section id="method" style={{ maxWidth: 1220, margin: "0 auto", padding: "72px 40px 76px" }}>
        <div ref={analysisRef} style={{ display: "grid", gridTemplateColumns: "1.08fr 0.92fr", gap: 48, alignItems: "center" }}>
          <AnalysisMockup visible={analysisVisible} />
          <div>
            <p style={eyebrowLight}>The method</p>
            <h2 style={{ fontWeight: 400, fontSize: 30, lineHeight: 1.18, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "0 0 24px", maxWidth: "20ch", textWrap: "pretty" }}>
              Every session feeds the next one.
            </h2>
            <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--line-strong)" }}>
              {STUDY_MECHANICS.map((title) => (
                <div key={title} style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 15, color: "var(--text-strong)" }}>{title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="sequence" style={{ maxWidth: 1220, margin: "0 auto", padding: "72px 40px 0" }}>
        <p style={eyebrowLight}>The thirty days</p>
        <h2 style={{ fontWeight: 400, fontSize: 30, lineHeight: 1.16, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "0 0 24px", maxWidth: "22ch", textWrap: "pretty" }}>
          Thirty days, printed in full before you start.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10,1fr)", gap: 1, background: "var(--border)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {SEQUENCE_DAYS.map((d) => (
            <div key={d.n} style={{ background: "var(--surface)", aspectRatio: 1.7, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
              <span style={{ fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", fontSize: 12, color: "var(--ink-300)" }}>{d.n}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 8, letterSpacing: "0.1em", color: "var(--ink-300)" }}>{d.tag}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 22, margin: "12px 0 0", fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--text-faint)" }}>
          <span>E — Reading &amp; Writing</span><span>M — Math</span><span>R — Score report</span>
        </div>
      </section>

      <section id="faq" style={{ maxWidth: 1220, margin: "0 auto", padding: "72px 40px 0" }}>
        <p style={eyebrowLight}>Questions</p>
        <h2 style={{ fontWeight: 400, fontSize: 30, lineHeight: 1.16, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "0 0 24px" }}>
          Before you start
        </h2>
        <div style={{ borderTop: "1px solid var(--line-strong)", maxWidth: 760 }}>
          {FAQS.map((f) => (
            <details key={f.q} style={{ borderBottom: "1px solid var(--border)", padding: "16px 0" }}>
              <summary style={{ cursor: "pointer", fontSize: 18, color: "var(--text-strong)", letterSpacing: "-0.01em" }}>{f.q}</summary>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--text-muted)", margin: "10px 0 0", maxWidth: "62ch" }}>{f.a}</p>
            </details>
          ))}
        </div>
        <div style={{ margin: "36px 0 0" }}>
          <CTAButton onClick={goBegin} />
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--border)", marginTop: 64 }}>
        <div style={{ maxWidth: 1220, margin: "0 auto", padding: "24px 40px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>
          <span>800Path © 2026</span>
          <span>SAT is a trademark of College Board, which does not endorse this tool.</span>
        </div>
      </footer>
    </div>
  );
}
