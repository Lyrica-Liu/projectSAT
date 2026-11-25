"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mark } from "@/components/ui/mark";
import { createClient } from "@/lib/supabase/client";
import { SkillMapView } from "@/components/home/mind-map";
import type { Tiers } from "@/components/home/skill-map";
import { CATEGORIES } from "@/lib/categories";
import type { CategoryMastery, MasteryLevel } from "@/lib/mastery";

/** An illustrative map for the landing page (not anyone's real data). Unlisted skills are not started. */
const SAMPLE_LEVELS: Record<string, [MasteryLevel, number]> = {
  "Central Ideas and Details": ["strong", 74],
  "Inferences": ["weak", 48],
  "Words in Context": ["mastered", 91],
  "Text Structure and Purpose": ["strong", 70],
  "Transitions": ["weak", 52],
  "Boundaries": ["strong", 77],
  "Algebra": ["strong", 72],
  "Advanced Math": ["weak", 45],
};
const SAMPLE_MASTERY: CategoryMastery[] = CATEGORIES.map((c) => {
  const [level, score] = SAMPLE_LEVELS[c.subcategory] ?? ["not_started", 0];
  const started = level !== "not_started";
  return { subcategory: c.subcategory, level, score, answered: started ? 20 : 0, hardAnswered: level === "mastered" ? 4 : 0, estimate: false, ability: 0, uncertainty: started ? 0.5 : 1.5 };
});
const SAMPLE_TIERS: Tiers = Object.fromEntries(SAMPLE_MASTERY.map((m) => [m.subcategory, m.level === "mastered" ? "hard" : m.level === "strong" ? "medium-high" : "medium-low"]));

const SPRINT_EXAMPLES = [
  { title: "3-Day Math Cram", body: "Your three weakest Math skills, one a day." },
  { title: "7-Day Grammar Sprint", body: "Punctuation and transitions, weakest first." },
  { title: "30-Day Full Prep", body: "The whole test, paced over a month." },
];

const HERO_HEADLINE = "You don't have to grind the DSAT for a year.";

const HOW_IT_WORKS = [
  { n: "01", title: "Tap a skill", body: "Every SAT skill is a tile on your map. Pick one and answer 5 or 10 questions — no setup, no account." },
  { n: "02", title: "See where you stand", body: "Your score and every explanation the moment you finish, and the tile changes color as you improve." },
  { n: "03", title: "Follow \u201cNext up\u201d", body: "One suggestion for what to practice next. Want more structure? Start a 3- or 7-day sprint — and quit anytime." },
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
    a: "Nothing, for now. 800Path is free during early access — every practice set, sprint and explanation. You don't need an account to start.",
  },
  {
    q: "How much time does it take?",
    a: "As little as you like. A set is 5 or 10 questions — at the Digital SAT's pace of about a minute and a half each, that's under 15 minutes. Sprints are one 10-question set a day. The optional quick start that colors in your whole map takes about 40 minutes.",
  },
  {
    q: "Do I have to follow a plan?",
    a: "No. Practice whatever you want from your skill map, and \u201cNext up\u201d suggests what to do next — it focuses on your weakest skills as your test date gets closer, if you add one. Sprints are there when you want a finish line, and you can quit one anytime.",
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

/** Layout that changes with width: one column on phones. */
const LANDING_CSS = `
.lp-wrap { max-width: 1220px; margin-left: auto; margin-right: auto; padding-left: 40px; padding-right: 40px; box-sizing: content-box; }
.lp-h1 { font-size: clamp(38px, 4.6vw, 60px); }
.lp-hero { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 56px; align-items: center; }
.lp-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
.lp-split { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 56px; align-items: start; }
.lp-sprint { display: flex; justify-content: space-between; align-items: baseline; gap: 20px; }
.lp-sprint > :last-child { text-align: right; }
@media (max-width: 820px) {
  .lp-wrap { padding-left: 20px; padding-right: 20px; }
  .lp-steps { grid-template-columns: 1fr; gap: 8px; }
  .lp-hero { grid-template-columns: 1fr; gap: 40px; }
  .lp-split { grid-template-columns: 1fr; gap: 24px; }
  .lp-sprint { flex-direction: column; gap: 4px; }
  .lp-sprint > :last-child { text-align: left; }
}
`;

function CTAButton({ onClick, busy = false }: { onClick: () => void; busy?: boolean }) {
  return (
    <div style={{ textAlign: "inherit" }}>
      <button onClick={onClick} disabled={busy} style={{
        display: "inline-flex", alignItems: "center", background: "var(--brand-fill)", color: "var(--text-on-brand)",
        fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 600, padding: "19px 36px",
        borderRadius: "var(--radius-lg)", border: "none", cursor: "pointer", transition: "background 0.16s",
        boxShadow: "0 10px 26px rgba(32,31,28,.16)", opacity: busy ? 0.7 : 1,
      }}>{busy ? "Getting your first questions…" : "Start practicing"}</button>
      <p style={{ fontFamily: "var(--font-serif)", fontSize: 14, lineHeight: 1.5, color: "var(--text-muted)", margin: "12px 0 0" }}>
        Free. No account needed.
      </p>
    </div>
  );
}

/** Rest state the card animates in from: a photo sitting at a slight angle, small and faded, that
 *  straightens flat, rises, and pops up to full size once it's in view. */
const MOCKUP_HIDDEN_TRANSFORM = "rotate(-22deg) scale(0.62) translateY(120px)";
const MOCKUP_VISIBLE_TRANSFORM = "rotate(0deg) scale(1) translateY(0)";
const MOCKUP_POP_EASE = "cubic-bezier(0.34, 1.76, 0.64, 1)";

/** Wraps `children` in the "photo straightens and pops up" reveal. */
function PhotoReveal({ visible, style, className, children }: { visible: boolean; style?: React.CSSProperties; className?: string; children: React.ReactNode }) {
  return (
    <div className={className} style={{
      willChange: "transform, opacity",
      opacity: visible ? 1 : 0, transform: visible ? MOCKUP_VISIBLE_TRANSFORM : MOCKUP_HIDDEN_TRANSFORM,
      transition: `opacity 0.7s ${MOCKUP_POP_EASE}, transform 1.1s ${MOCKUP_POP_EASE}`,
      ...style,
    }}>
      {children}
    </div>
  );
}

/** The hero's question card: one Words in Context question mid-set, answered. */
function HeroCard({ visible }: { visible: boolean }) {
  return (
    <PhotoReveal visible={visible} className="pw-glass" style={{ borderRadius: "var(--radius-xl)", padding: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px 12px", fontSize: 11, color: "var(--text-muted)" }}>
        <span style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Words in Context · Medium</span>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>3 / 10</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-strong)" }}>14:22</span>
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
                borderLeft: o.correct ? "2px solid var(--brand)" : "2px solid transparent",
                background: o.correct ? "var(--claret-50)" : "transparent", fontSize: 13,
                color: o.correct ? "var(--text-strong)" : "var(--text-body)",
              }}>
                <span style={{ fontSize: 9, color: o.correct ? "var(--brand)" : "var(--text-faint)", width: 9, paddingTop: 3 }}>{o.l}</span>
                <span>{o.t}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--text-muted)", margin: "10px 0 0", paddingLeft: 10, borderLeft: "2px solid var(--brand)" }}>
            She is set against writers who were <span style={{ fontStyle: "italic" }}>exhaustive</span>. The contrast is length, not tone, which rules out <span style={{ fontStyle: "italic" }}>abrupt</span>.
          </p>
        </div>
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
                  borderLeft: `2px solid ${showCorrect ? "var(--brand)" : showWrong ? "var(--danger)" : "transparent"}`,
                  background: showCorrect ? "var(--claret-50)" : "transparent",
                  fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--text-strong)",
                  cursor: answered ? "default" : "pointer", opacity: answered && !isAnswer && !isPicked ? 0.55 : 1,
                }}
              >
                <span style={{ fontFamily: "var(--font-serif)", fontSize: 12, width: 12, flexShrink: 0, color: showCorrect ? "var(--brand)" : showWrong ? "var(--danger)" : "var(--text-faint)" }}>{letter}</span>
                <span>{q.options[letter]}</span>
              </button>
            );
          })}
        </div>

        {answered ? (
          <div aria-live="polite" style={{ margin: "16px 0 0", paddingLeft: 12, borderLeft: `2px solid ${gotIt ? "var(--brand)" : "var(--danger)"}` }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: gotIt ? "var(--brand)" : "var(--danger)", margin: "0 0 6px" }}>
              {gotIt ? "Correct" : `Not quite — the answer is ${q.answer}`}
            </p>
            {!gotIt && picked && q.wrong[picked] && (
              <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-muted)", margin: "0 0 8px" }}>{q.wrong[picked]}</p>
            )}
            <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-body)", margin: 0 }}>{q.why}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", margin: "18px 0 0" }}>
              <button onClick={onBegin} style={{
                background: "var(--brand-fill)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600,
                padding: "12px 22px", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer",
              }}>Start practicing</button>
              <button onClick={() => setPicked(null)} style={{
                background: "none", border: "none", padding: 0, cursor: "pointer",
                fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", textDecoration: "underline",
              }}>Try it again</button>
            </div>
          </div>
        ) : (
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 13, color: "var(--text-faint)", margin: "14px 0 0" }}>Pick an answer to see the explanation.</p>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  // No onboarding in the way: sign in quietly (an anonymous account, upgradeable later) and go
  // straight to the skill map.
  const [starting, setStarting] = useState(false);
  async function goBegin() {
    if (starting) return;
    setStarting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const { error } = await supabase.auth.signInAnonymously({ options: { data: { signup_source: "landing" } } });
      if (error) { setStarting(false); router.push("/auth"); return; }
    }
    router.push("/dashboard");
  }

  const [heroCardVisible, setHeroCardVisible] = useState(false);
  const heroCardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = heroCardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setHeroCardVisible(true); observer.disconnect(); } }, { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="pw-page lp" style={{ background: "var(--canvas)", minHeight: "100vh", fontFamily: "var(--font-serif)", color: "var(--text-body)", overflowX: "hidden" }}>
      <style>{LANDING_CSS}</style>

      <nav style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(252,251,248,.72)", backdropFilter: "blur(16px) saturate(1.4)", borderBottom: "1px solid var(--border)" }}>
        <div className="lp-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <Mark height={20} />
            <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-strong)" }}>800Path</span>
          </span>
          <Link href="/auth" style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--text-strong)", padding: "8px 18px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--surface)" }}>Sign in</Link>
        </div>
      </nav>

      <header className="lp-wrap lp-hero" style={{ paddingTop: 48, paddingBottom: 56 }}>
        <div>
          <p style={{ ...eyebrowLight, margin: "0 0 18px" }}>Digital SAT · Reading, Writing &amp; Math</p>
          <h1 className="lp-h1" style={{ fontWeight: 400, lineHeight: 1.06, letterSpacing: "-0.026em", color: "var(--text-strong)", margin: 0, minHeight: "2.12em" }}>
            <TypewriterHeadline text={HERO_HEADLINE} />
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.5, color: "var(--text-muted)", margin: "18px 0 28px", maxWidth: "34ch", textWrap: "pretty" }}>
            Every skill on the test, on one map. Short sets fill it in.
          </p>
          <CTAButton onClick={goBegin} busy={starting} />
        </div>
        <div ref={heroCardRef}><HeroCard visible={heroCardVisible} /></div>
      </header>

      <section id="skill-map" aria-label="Sample skill map" className="lp-wrap" style={{ paddingTop: 8, paddingBottom: 0 }}>
        <SkillMapView
          mastery={SAMPLE_MASTERY} tiers={SAMPLE_TIERS} guest height="min(640px, 74vh)"
          header={
            <div>
              <h2 style={{ fontWeight: 400, fontSize: 26, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: 0 }}>This is what you&apos;ll see</h2>
              <p style={{ fontSize: 15, color: "var(--text-muted)", margin: "4px 0 0" }}>A sample map. Tap any skill to try it.</p>
            </div>
          }
        />
      </section>

      <section id="how-it-works" className="lp-wrap" style={{ paddingTop: 88, paddingBottom: 0 }}>
        <p style={eyebrowLight}>How it works</p>
        <ol className="lp-steps" style={{ listStyle: "none", padding: 0, margin: 0, borderTop: "1px solid var(--line-strong)" }}>
          {HOW_IT_WORKS.map((step) => (
            <li key={step.n} style={{ padding: "20px 0 0" }}>
              <span style={{ fontSize: 12, letterSpacing: "0.1em", color: "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>{step.n}</span>
              <h3 style={{ fontWeight: 400, fontSize: 22, lineHeight: 1.25, color: "var(--text-strong)", margin: "8px 0 8px", letterSpacing: "-0.012em" }}>{step.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)", margin: 0, maxWidth: "34ch" }}>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="try-one" className="lp-wrap" style={{ paddingTop: 88, paddingBottom: 0 }}>
        <div className="lp-split">
          <div>
            <p style={eyebrowLight}>Try one</p>
            <h2 style={{ fontWeight: 400, fontSize: 32, lineHeight: 1.18, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: 0, maxWidth: "16ch", textWrap: "pretty" }}>
              A real question, before you sign up for anything.
            </h2>
          </div>
          <SampleQuestion onBegin={goBegin} />
        </div>
      </section>

      <section id="sprints" className="lp-wrap" style={{ paddingTop: 88, paddingBottom: 0 }}>
        <div className="lp-split">
          <div>
            <p style={eyebrowLight}>Short sprints</p>
            <h2 style={{ fontWeight: 400, fontSize: 32, lineHeight: 1.18, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: 0, maxWidth: "16ch" }}>
              Want a finish line? Pick a sprint. Quit anytime.
            </h2>
          </div>
          <div style={{ borderTop: "1px solid var(--line-strong)" }}>
            {SPRINT_EXAMPLES.map((sp) => (
              <div key={sp.title} className="lp-sprint" style={{ padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 18, color: "var(--text-strong)" }}>{sp.title}</span>
                <span style={{ fontSize: 15, color: "var(--text-muted)" }}>{sp.body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="lp-wrap" style={{ paddingTop: 88, paddingBottom: 0 }}>
        <div className="lp-split">
          <div>
            <p style={eyebrowLight}>Questions</p>
            <h2 style={{ fontWeight: 400, fontSize: 32, lineHeight: 1.16, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: 0 }}>Before you start</h2>
          </div>
          <div style={{ borderTop: "1px solid var(--line-strong)" }}>
            {FAQS.map((f) => (
              <details key={f.q} style={{ borderBottom: "1px solid var(--border)", padding: "16px 0" }}>
                <summary style={{ cursor: "pointer", fontSize: 18, color: "var(--text-strong)", letterSpacing: "-0.01em" }}>{f.q}</summary>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--text-muted)", margin: "10px 0 0", maxWidth: "62ch" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-wrap" style={{ textAlign: "center", paddingTop: 96, paddingBottom: 0 }}>
        <h2 style={{ fontWeight: 400, fontSize: 36, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--text-strong)", margin: "0 0 24px" }}>Start filling in your map.</h2>
        <div style={{ display: "flex", justifyContent: "center" }}><CTAButton onClick={goBegin} busy={starting} /></div>
      </section>

      <footer style={{ borderTop: "1px solid var(--border)", marginTop: 88 }}>
        <div className="lp-wrap" style={{ paddingTop: 24, paddingBottom: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, fontFamily: "var(--font-serif)", fontSize: 12, color: "var(--text-faint)" }}>
          <span>800Path © 2026</span>
          <span>SAT is a trademark of College Board, which does not endorse this tool.</span>
        </div>
      </footer>
    </div>
  );
}
