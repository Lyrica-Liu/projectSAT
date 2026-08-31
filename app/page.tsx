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

/** Types `text` out on mount. Give it a `key` that changes to make it retype from scratch (a fresh
 *  mount gets a fresh `count`, which is the idiomatic way to "reset" without setState-in-effect). */
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
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", background: "var(--brand)", color: "var(--text-on-brand)",
      fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 600, padding: "19px 42px",
      borderRadius: "var(--radius-lg)", border: "none", cursor: "pointer", transition: "background 0.16s",
      boxShadow: "0 10px 26px rgba(32,31,28,.16)",
    }}>Begin</button>
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

export default function LandingPage() {
  const router = useRouter();
  const goBegin = () => router.push("/onboarding");

  const [analysisVisible, setAnalysisVisible] = useState(false);
  const analysisRef = useRef<HTMLDivElement>(null);
  const [heroMockupVisible, setHeroMockupVisible] = useState(false);
  const heroMockupRef = useRef<HTMLDivElement>(null);

  // The headline retypes itself every time it scrolls back into view (but not on its very first
  // appearance — that one already plays once on mount via TypewriterHeadline's own effect).
  const [heroReplayKey, setHeroReplayKey] = useState(0);
  const heroRef = useRef<HTMLHeadingElement>(null);

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

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    let isFirstCallback = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isFirstCallback) {
          isFirstCallback = false;
          return;
        }
        if (entry.isIntersecting) setHeroReplayKey((k) => k + 1);
      },
      { threshold: 0.6 }
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
            <h1 ref={heroRef} style={{ fontWeight: 400, fontSize: 58, lineHeight: 1.06, letterSpacing: "-0.026em", color: "var(--text-strong)", margin: 0, minHeight: "2.12em" }}>
              <TypewriterHeadline key={heroReplayKey} text={HERO_HEADLINE} />
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

      <footer style={{ borderTop: "1px solid var(--border)", marginTop: 64 }}>
        <div style={{ maxWidth: 1220, margin: "0 auto", padding: "24px 40px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>
          <span>800Path © 2026</span>
          <span>SAT is a trademark of College Board, which does not endorse this tool.</span>
        </div>
      </footer>
    </div>
  );
}
