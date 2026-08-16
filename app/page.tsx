"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mark } from "@/components/ui/mark";

const METHOD_POINTS = [
  {
    title: "One decision a day: begin",
    desc: "Today's module is already chosen — subject, skills, difficulty. Consistency is a design problem, and this is the solution.",
  },
  {
    title: "Timed as the test is timed",
    desc: "Twelve questions against the clock at real pace. Thirty days of this and the timer stops being the thing you fear.",
  },
  {
    title: "Reasoning, not verdicts",
    desc: "Every explanation names the clue in the text and why each wrong answer tempts you. You leave with a method, not a letter.",
  },
  {
    title: "A record you can read",
    desc: "Accuracy per skill, day by day, kept plainly. On day thirty it becomes a score report and an honest retrospective.",
  },
];

const SEQUENCE_DAYS = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  const tag = n === 30 ? "R" : n % 3 === 0 ? "M" : "E";
  return { n, tag };
});

export default function LandingPage() {
  const router = useRouter();
  const goSignup = () => router.push("/auth?mode=signup");

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh", fontFamily: "var(--font-serif)", color: "var(--text-body)", overflowX: "hidden" }}>

      <nav style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(246,244,239,.94)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 11 }}>
            <Mark width={33} height={20} fill="var(--text-strong)" />
            <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-strong)" }}>800Path</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 32, fontFamily: "var(--font-sans)", fontSize: 13 }}>
            <a href="#method" style={{ color: "var(--text-muted)" }}>The method</a>
            <a href="#sequence" style={{ color: "var(--text-muted)" }}>The thirty days</a>
            <Link href="/auth" style={{ color: "var(--text-muted)" }}>Sign in</Link>
            <button onClick={goSignup} style={{
              background: "var(--brand)", color: "var(--text-on-brand)", fontFamily: "var(--font-sans)",
              fontWeight: 500, fontSize: 13, padding: "9px 17px", borderRadius: "var(--radius-md)",
              border: "none", cursor: "pointer", transition: "background 0.16s",
            }}>Begin</button>
          </div>
        </div>
      </nav>

      <section style={{ maxWidth: 1220, margin: "0 auto", padding: "0 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.02fr 0.98fr", gap: 64, alignItems: "center", padding: "84px 0 88px" }}>

          <div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 30px", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ width: 26, height: 1, background: "var(--line-strong)" }} />
              Digital SAT · Reading, Writing &amp; Math
            </p>
            <h1 style={{ fontWeight: 400, fontSize: 64, lineHeight: 1.03, letterSpacing: "-0.026em", color: "var(--text-strong)", margin: 0, textWrap: "pretty" }}>
              Made for people who intend to do this properly.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.62, color: "var(--text-muted)", margin: "28px 0 0", maxWidth: "44ch", textWrap: "pretty" }}>
              Thirty days, decided in advance. Twelve questions a sitting, timed like the real thing and explained the way a good tutor would. Nothing to configure — only the work.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 24, margin: "36px 0 0" }}>
              <button onClick={goSignup} style={{
                display: "inline-flex", alignItems: "center", background: "var(--brand)", color: "var(--text-on-brand)",
                fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "14px 26px",
                borderRadius: "var(--radius-lg)", border: "none", cursor: "pointer", transition: "background 0.16s",
              }}>Start day one</button>
              <a href="#method" style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)" }}>Read the method →</a>
            </div>
            <div style={{ display: "flex", gap: 36, margin: "44px 0 0", padding: "20px 0 0", borderTop: "1px solid var(--border)", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>
              <span><span style={{ display: "block", fontSize: 20, fontWeight: 500, color: "var(--text-strong)", fontVariantNumeric: "tabular-nums", marginBottom: 5 }}>30</span>days, fixed</span>
              <span><span style={{ display: "block", fontSize: 20, fontWeight: 500, color: "var(--text-strong)", fontVariantNumeric: "tabular-nums", marginBottom: 5 }}>12</span>questions a sitting</span>
              <span><span style={{ display: "block", fontSize: 20, fontWeight: 500, color: "var(--text-strong)", fontVariantNumeric: "tabular-nums", marginBottom: 5 }}>18</span>minutes a day</span>
            </div>
          </div>

          <div>
            <div style={{ background: "var(--dark-900)", borderRadius: "var(--radius-2xl)", padding: 12, boxShadow: "0 24px 60px rgba(32,31,28,.14)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px 14px", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-on-dark-faint)" }}>
                <span style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Day 4 · English</span>
                <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>3 / 12</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-on-dark)" }}>14:22</span>
                </span>
              </div>
              <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                <div style={{ padding: "26px 28px 22px", borderBottom: "1px solid var(--border)" }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)", margin: "0 0 14px" }}>Passage</p>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-body)", margin: 0 }}>
                    The naturalist Anna Botsford Comstock argued that a child taught to look closely at a single leaf had learned more than one marched through a textbook. Her <span style={{ borderBottom: "1.5px solid var(--accent)", paddingBottom: 1, color: "var(--text-strong)" }}>terse</span> field guides omitted nearly everything a rival volume would include.
                  </p>
                </div>
                <div style={{ padding: "24px 28px 26px" }}>
                  <p style={{ fontSize: 16, lineHeight: 1.5, color: "var(--text-strong)", margin: "0 0 16px" }}>
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
                        display: "flex", gap: 14, padding: "11px 12px", borderTop: "1px solid var(--border)",
                        borderLeft: o.correct ? "2px solid var(--success)" : "2px solid transparent",
                        background: o.correct ? "var(--moss-50)" : "transparent", fontSize: 15,
                        color: o.correct ? "var(--text-strong)" : "var(--text-body)",
                      }}>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: o.correct ? "var(--success)" : "var(--text-faint)", width: 11, paddingTop: 3 }}>{o.l}</span>
                        <span>{o.t}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.62, color: "var(--text-muted)", margin: "16px 0 0", paddingLeft: 13, borderLeft: "2px solid var(--accent)" }}>
                    She is set against writers who were <span style={{ fontStyle: "italic" }}>exhaustive</span>. The contrast is length, not tone — which rules out <span style={{ fontStyle: "italic" }}>abrupt</span>.
                  </p>
                </div>
              </div>
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", margin: "14px 0 0", display: "flex", gap: 10 }}>
              <span style={{ letterSpacing: "0.12em", color: "var(--text-muted)" }}>PLATE I</span>
              <span>The reading desk — passage held left, reasoning right.</span>
            </p>
          </div>

        </div>
      </section>

      <section id="method" style={{ background: "var(--dark-900)", color: "var(--text-on-dark)" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto", padding: "96px 40px 100px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 48, alignItems: "start" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-on-dark-faint)", margin: "8px 0 0" }}>
              Plate II<br /><span style={{ color: "var(--dark-700)" }}>——</span><br />The method
            </p>
            <div>
              <h2 style={{ fontWeight: 400, fontSize: 40, lineHeight: 1.14, letterSpacing: "-0.022em", color: "var(--text-on-dark)", margin: 0, maxWidth: "28ch", textWrap: "pretty" }}>
                Most prep opens by asking what you would like to practice. On day one, that is the wrong question.
              </h2>
              <p style={{ fontSize: 17, lineHeight: 1.66, color: "var(--text-on-dark-muted)", margin: "26px 0 0", maxWidth: "52ch" }}>
                You do not yet know where you are weakest, and the honest answer — everything, a little — makes a poor lesson plan. So the sequence is decided for you, then revised as your work comes in.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", margin: "64px 0 0", borderTop: "1px solid var(--dark-border)" }}>
                {METHOD_POINTS.map((p, i) => (
                  <div key={p.title} style={{
                    padding: i % 2 === 0 ? "30px 44px 30px 0" : "30px 0 30px 44px",
                    borderLeft: i % 2 === 1 ? "1px solid var(--dark-border)" : "none",
                    borderBottom: "1px solid var(--dark-border)",
                  }}>
                    <h3 style={{ fontWeight: 600, fontSize: 20, color: "var(--text-on-dark)", margin: "0 0 9px" }}>{p.title}</h3>
                    <p style={{ fontSize: 15, lineHeight: 1.66, color: "var(--text-on-dark-muted)", margin: 0 }}>{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sequence" style={{ maxWidth: 1220, margin: "0 auto", padding: "96px 40px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 48, alignItems: "start" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-faint)", margin: "8px 0 0" }}>
            Plate III<br /><span style={{ color: "var(--line-strong)" }}>——</span><br />The sequence
          </p>
          <div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, margin: "0 0 36px", flexWrap: "wrap" }}>
              <h2 style={{ fontWeight: 400, fontSize: 38, lineHeight: 1.12, letterSpacing: "-0.022em", color: "var(--text-strong)", margin: 0, maxWidth: "22ch", textWrap: "pretty" }}>
                Thirty days, printed in full before you start.
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)", margin: 0, maxWidth: "32ch" }}>
                Weeks run English, English, Math. Twenty modules of Reading &amp; Writing, ten of Math, and a closing report.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10,1fr)", gap: 1, background: "var(--border)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              {SEQUENCE_DAYS.map((d) => (
                <div key={d.n} style={{ background: "var(--surface)", aspectRatio: 1.24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums", fontSize: 13, color: "var(--ink-300)" }}>{d.n}</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, letterSpacing: "0.1em", color: "var(--ink-300)" }}>{d.tag}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 26, margin: "14px 0 0", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>
              <span>E — Reading &amp; Writing</span><span>M — Math</span><span>R — Score report</span>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1220, margin: "0 auto", padding: "88px 40px 96px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-2xl)", padding: "52px 56px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontWeight: 400, fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.022em", color: "var(--text-strong)", margin: "0 0 12px", maxWidth: "20ch", textWrap: "pretty" }}>
              Day one is waiting. It takes eighteen minutes.
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>Free, and free of paywalls. Bring a pencil for the Math weeks.</p>
          </div>
          <button onClick={goSignup} style={{
            display: "inline-flex", alignItems: "center", background: "var(--brand)", color: "var(--text-on-brand)",
            fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, padding: "15px 30px",
            borderRadius: "var(--radius-lg)", border: "none", cursor: "pointer", transition: "background 0.16s",
          }}>Begin the thirty days</button>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto", padding: "24px 40px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>
          <span>800Path © 2026</span>
          <span>SAT is a trademark of College Board, which does not endorse this tool.</span>
        </div>
      </footer>
    </div>
  );
}
