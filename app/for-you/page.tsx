"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppNav, LoadingScreen } from "@/components/ui/nav";
import { Badge, Button, ScoreRing, SkillBar } from "@/components/ui/ds";
import { Icon } from "@/components/ui/icon";
import { nextTier } from "@/lib/adaptive";
import { ENGLISH_CATEGORY_ORDER, MATH_CATEGORY_ORDER, DIFFICULTY_LABELS, DIFFICULTY_TONES } from "@/lib/plan";
import type { QuestionSkill, MathSkill, Difficulty } from "@/lib/types";

type View = "english" | "math";

type Domain = "Information and Ideas" | "Craft and Structure" | "Expression of Ideas" | "Standard English Conventions";

const DOMAIN_SKILLS: Record<Domain, QuestionSkill[]> = {
  "Information and Ideas": ["central_idea", "command_of_evidence", "inferences"],
  "Craft and Structure": ["words_in_context", "text_structure", "cross_text_connections"],
  "Expression of Ideas": ["transitions", "rhetorical_synthesis"],
  "Standard English Conventions": ["boundaries", "form_structure_sense"],
};

const DOMAIN_ICON: Record<Domain, { icon: string; bg: string; fg: string }> = {
  "Information and Ideas": { icon: "lightbulb", bg: "var(--indigo-surface)", fg: "var(--indigo-ink)" },
  "Craft and Structure": { icon: "pen-tool", bg: "var(--violet-surface)", fg: "var(--violet-ink)" },
  "Expression of Ideas": { icon: "message-square", bg: "var(--magenta-surface)", fg: "var(--magenta-ink)" },
  "Standard English Conventions": { icon: "check-check", bg: "var(--rose-surface)", fg: "var(--rose-ink)" },
};

const SKILL_LABELS: Record<QuestionSkill, string> = {
  central_idea: "Central Ideas & Details",
  command_of_evidence: "Command of Evidence",
  inferences: "Inferences",
  words_in_context: "Words in Context",
  text_structure: "Text Structure & Purpose",
  cross_text_connections: "Cross-Text Connections",
  transitions: "Transitions",
  rhetorical_synthesis: "Rhetorical Synthesis",
  boundaries: "Boundaries",
  form_structure_sense: "Form, Structure & Sense",
};

const SKILL_NOTES: Record<QuestionSkill, string> = {
  central_idea: "Main idea, summary",
  command_of_evidence: "Textual & quantitative",
  inferences: "Logical completion",
  words_in_context: "Vocabulary, tone",
  text_structure: "Function of a part",
  cross_text_connections: "Compare two passages",
  transitions: "Logical connectors",
  rhetorical_synthesis: "Use notes to meet a goal",
  boundaries: "Punctuation, clauses",
  form_structure_sense: "Agreement, verb tense",
};

const MATH_CATEGORY_ICON: Record<string, { icon: string; bg: string; fg: string }> = {
  "Algebra": { icon: "calculator", bg: "var(--indigo-surface)", fg: "var(--indigo-ink)" },
  "Data Analysis": { icon: "bar-chart-3", bg: "var(--violet-surface)", fg: "var(--violet-ink)" },
  "Geometry": { icon: "triangle", bg: "var(--magenta-surface)", fg: "var(--magenta-ink)" },
};

const MATH_SKILL_LABELS: Record<MathSkill, string> = {
  algebra: "Algebra",
  data_analysis: "Data Analysis",
  geometry: "Geometry",
};

const MATH_SKILL_NOTES: Record<MathSkill, string> = {
  algebra: "Linear equations, systems, inequalities",
  data_analysis: "Ratios, percentages, statistics, models",
  geometry: "Lines, angles, triangles, circles, trig",
};

const GRASP_LABEL_BY_N = ["", "Emerging", "Developing", "Proficient", "Strong"];
const GRASP_N: Record<Difficulty, number> = { easy: 1, "medium-low": 2, "medium-high": 3, hard: 4 };
const TIER_RANK: Record<Difficulty, number> = { easy: 0, "medium-low": 1, "medium-high": 2, hard: 3 };

interface TierStats { correct: number; total: number }

interface SkillInsight {
  skill: QuestionSkill | MathSkill;
  label: string;
  note: string;
  hasData: boolean;
  currentTier: Difficulty;
  graspN: number;
  grasp: string;
  accuracy: number;
  totalAnswered: number;
  suggestedTier: Difficulty;
  suggestedLabel: string;
  suggestedTone: string;
  advice: string;
}

interface DomainCard {
  name: string;
  skills: SkillInsight[];
  accuracy: number;
  graspN: number;
  grasp: string;
  questions: number;
}

interface ChartPoint { date: Date; score: number }

function buildSkillInsight(
  skill: QuestionSkill | MathSkill,
  label: string,
  note: string,
  subcats: string[],
  byTier: Partial<Record<QuestionSkill | MathSkill, Partial<Record<Difficulty, TierStats>>>>,
  progressBySubcategory: Map<string, Difficulty>
): SkillInsight {
  const tiers = byTier[skill] ?? {};
  const totalAnswered = Object.values(tiers).reduce((a, t) => a + (t?.total ?? 0), 0);
  const hasData = totalAnswered > 0;

  const progressTiers = subcats.map((sc) => progressBySubcategory.get(sc)).filter((t): t is Difficulty => !!t);
  let currentTier: Difficulty = "medium-low";
  if (progressTiers.length > 0) {
    currentTier = progressTiers.sort((a, b) => TIER_RANK[b] - TIER_RANK[a])[0];
  } else if (hasData) {
    currentTier = (Object.entries(tiers).sort((a, b) => (b[1]?.total ?? 0) - (a[1]?.total ?? 0))[0]?.[0] as Difficulty) ?? "medium-low";
  }

  const atTier = tiers[currentTier];
  const overallCorrect = Object.values(tiers).reduce((a, t) => a + (t?.correct ?? 0), 0);
  const accuracy = atTier && atTier.total > 0
    ? Math.round((atTier.correct / atTier.total) * 100)
    : hasData ? Math.round((overallCorrect / totalAnswered) * 100) : 0;

  const suggestedTier: Difficulty = !hasData ? currentTier : accuracy > 83 ? nextTier(currentTier, "up") : accuracy < 50 ? nextTier(currentTier, "down") : currentTier;
  const direction = suggestedTier === currentTier ? "hold" : accuracy > 83 ? "up" : "down";
  const tierLabel = DIFFICULTY_LABELS[currentTier];
  const advice = !hasData
    ? "Not practiced yet — a quick session here will unlock suggestions."
    : direction === "up"
    ? `Acing ${tierLabel} at ${accuracy}% — moving you up to find your ceiling.`
    : direction === "down"
    ? `Under 50% at ${tierLabel} — dropping a notch to rebuild confidence.`
    : `Steady at ${tierLabel} — ${accuracy}% and holding the sweet spot.`;

  return {
    skill, label, note, hasData,
    currentTier, graspN: GRASP_N[currentTier], grasp: GRASP_LABEL_BY_N[GRASP_N[currentTier]],
    accuracy, totalAnswered,
    suggestedTier, suggestedLabel: DIFFICULTY_LABELS[suggestedTier], suggestedTone: DIFFICULTY_TONES[suggestedTier],
    advice,
  };
}

const byWeakness = (a: SkillInsight, b: SkillInsight) => a.graspN - b.graspN || a.accuracy - b.accuracy;

function Pips({ n, size = "md" }: { n: number; size?: "sm" | "md" }) {
  const w = size === "sm" ? 18 : 20;
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} style={{ width: w, height: 7, borderRadius: 99, background: i < n ? "var(--brand)" : "var(--surface-sunken)" }} />
      ))}
    </span>
  );
}

function ViewToggle({ view, setView }: { view: View; setView: (v: View) => void }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--surface-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius-pill)", padding: 3, gap: 2, marginBottom: 22 }}>
      {(["english", "math"] as View[]).map((v) => {
        const active = view === v;
        return (
          <button key={v} onClick={() => setView(v)} style={{
            position: "relative", border: "none", background: active ? "var(--surface)" : "none",
            fontFamily: "inherit", fontSize: "var(--text-sm)", fontWeight: 700,
            color: active ? "var(--brand-ink)" : "var(--text-muted)",
            padding: "9px 22px", borderRadius: "var(--radius-pill)", cursor: "pointer",
            boxShadow: active ? "var(--shadow-sm)" : "none",
          }}>{v === "english" ? "English" : "Math"}</button>
        );
      })}
    </div>
  );
}

function AccuracyChart({ points }: { points: ChartPoint[] }) {
  const [range, setRange] = useState(90);
  const [hover, setHover] = useState<number | null>(null);

  const [now] = useState(() => Date.now());
  const rangeDefs: { v: number; l: string }[] = [{ v: 7, l: "7D" }, { v: 30, l: "30D" }, { v: 90, l: "3M" }, { v: 100000, l: "All" }];
  const rangeLabels: Record<number, string> = { 7: "Last 7 days", 30: "Last 30 days", 90: "Last 3 months", 100000: "All time" };

  let pts = points
    .filter((r) => (now - r.date.getTime()) / 86400000 <= range)
    .map((r) => ({ x: r.date.getTime(), y: r.score, date: r.date }))
    .sort((a, b) => a.x - b.x);
  if (pts.length < 2) pts = points.slice().sort((a, b) => a.date.getTime() - b.date.getTime()).map((r) => ({ x: r.date.getTime(), y: r.score, date: r.date }));

  const W = 780, H = 220, padL = 34, padR = 12, padT = 14, padB = 40;
  const xs = pts.map((p) => p.x);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const yMin = 0, yMax = 100;
  const px = (x: number) => padL + (maxX === minX ? 0 : (x - minX) / (maxX - minX)) * (W - padL - padR);
  const py = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT - padB);

  const linePts = pts.map((p) => `${px(p.x)},${py(p.y)}`).join(" ");
  const areaPts = `${padL},${H - padB} ${linePts} ${W - padR},${H - padB}`;
  const short = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const nLabels = Math.min(5, pts.length);
  const xLabels = [];
  for (let i = 0; i < nLabels; i++) {
    const idx = nLabels === 1 ? 0 : Math.round((i * (pts.length - 1)) / (nLabels - 1));
    const p = pts[idx];
    const anchor = i === 0 ? "start" : i === nLabels - 1 ? "end" : "middle";
    xLabels.push(
      <text key={`xl${i}`} x={px(p.x)} y={H - padB + 18} textAnchor={anchor} fontSize={10.5} fill="var(--text-faint)" fontWeight={600}>{short(p.date)}</text>
    );
  }

  const gridY = [0, 25, 50, 75, 100].map((v, i) => (
    <g key={`g${i}`}>
      <line x1={padL} x2={W - padR} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={1} strokeDasharray={v === 0 ? "0" : "3 4"} />
      <text x={padL - 8} y={py(v) + 4} textAnchor="end" fontSize={10} fill="var(--text-faint)" fontFamily="var(--font-mono)">{v}%</text>
    </g>
  ));

  let tip = null;
  if (hover != null && pts[hover]) {
    const p = pts[hover];
    const tx = px(p.x);
    const boxW = 92;
    const left = Math.min(Math.max(tx - boxW / 2, 2), W - boxW - 2);
    tip = (
      <g style={{ pointerEvents: "none" }}>
        <line x1={tx} x2={tx} y1={padT} y2={H - padB} stroke="var(--brand)" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        <rect x={left} y={4} width={boxW} height={40} rx={8} fill="var(--text-strong)" />
        <text x={left + boxW / 2} y={20} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff" fontFamily="var(--font-mono)">{p.y}%</text>
        <text x={left + boxW / 2} y={35} textAnchor="middle" fontSize={9.5} fill="rgba(255,255,255,0.75)">{short(p.date)}</text>
      </g>
    );
  }

  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-2xl)", boxShadow: "var(--shadow-sm)", padding: "24px 26px", marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: "var(--text-md)", color: "var(--text-strong)", margin: 0 }}>Accuracy over time</h2>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: "4px 0 0" }}>Hover any point for detail · pick a range to zoom · {rangeLabels[range]}</p>
        </div>
        <div style={{ display: "inline-flex", background: "var(--surface-sunken)", borderRadius: "var(--radius-pill)", padding: 3, gap: 2 }}>
          {rangeDefs.map((r) => {
            const active = range === r.v;
            return (
              <button key={r.l} onClick={() => { setRange(r.v); setHover(null); }} style={{
                position: "relative", border: "none", background: active ? "var(--surface)" : "none",
                fontFamily: "inherit", fontSize: "var(--text-xs)", fontWeight: 700,
                color: active ? "var(--brand-ink)" : "var(--text-muted)",
                padding: "7px 13px", borderRadius: "var(--radius-pill)", cursor: "pointer",
                boxShadow: active ? "var(--shadow-sm)" : "none",
              }}>{r.l}</button>
            );
          })}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="accFill" x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
          </linearGradient>
        </defs>
        {gridY}
        <polygon points={areaPts} fill="url(#accFill)" />
        <polyline points={linePts} fill="none" stroke="var(--brand)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke="var(--border)" strokeWidth={1} />
        {xLabels}
        {tip}
        {pts.map((p, i) => (
          <circle key={`d${i}`} cx={px(p.x)} cy={py(p.y)} r={hover === i ? 5.5 : 3.5}
            fill="#fff" stroke="var(--brand)" strokeWidth={2}
            style={{ cursor: "pointer", transition: "r .12s" }}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        ))}
      </svg>
    </section>
  );
}

export default function ForYouPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Record<QuestionSkill, SkillInsight> | null>(null);
  const [mathInsights, setMathInsights] = useState<Record<MathSkill, SkillInsight> | null>(null);
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [recap, setRecap] = useState<{ headline: string; body: string } | null>(null);
  const [view, setView] = useState<View>("english");
  const [selected, setSelected] = useState<Domain>("Information and Ideas");
  const [selectedMath, setSelectedMath] = useState<string>("Algebra");
  const [startingSkill, setStartingSkill] = useState<QuestionSkill | MathSkill | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }

      const [answersRes, progressRes, sessionsRes, planDaysRes] = await Promise.all([
        supabase.from("answers").select("session_id, is_correct, question:questions(skill, difficulty)").not("is_correct", "is", null),
        supabase.from("category_progress").select("subcategory, difficulty"),
        supabase.from("sessions").select("*").eq("user_id", user.id).not("completed_at", "is", null).order("completed_at", { ascending: false }),
        supabase.from("plan_days").select("session_id").eq("user_id", user.id).not("session_id", "is", null),
      ]);

      const byTier: Partial<Record<QuestionSkill | MathSkill, Partial<Record<Difficulty, TierStats>>>> = {};
      const perSessionSkillCounts: Record<string, Partial<Record<QuestionSkill | MathSkill, number>>> = {};
       
      (answersRes.data ?? []).forEach((row: any) => {
        const q = Array.isArray(row.question) ? row.question[0] : row.question;
        if (!q) return;
        const skill = q.skill as QuestionSkill | MathSkill;
        const diff = q.difficulty as Difficulty;
        if (!byTier[skill]) byTier[skill] = {};
        if (!byTier[skill]![diff]) byTier[skill]![diff] = { correct: 0, total: 0 };
        byTier[skill]![diff]!.total++;
        if (row.is_correct) byTier[skill]![diff]!.correct++;

        if (row.session_id) {
          if (!perSessionSkillCounts[row.session_id]) perSessionSkillCounts[row.session_id] = {};
          perSessionSkillCounts[row.session_id]![skill] = (perSessionSkillCounts[row.session_id]![skill] ?? 0) + 1;
        }
      });

      const progressBySubcategory = new Map((progressRes.data ?? []).map((r) => [r.subcategory, r.difficulty as Difficulty]));

      const allEnglishSkills = Object.values(DOMAIN_SKILLS).flat();
      const builtEnglish: Record<string, SkillInsight> = {};
      allEnglishSkills.forEach((skill) => {
        const subcats = ENGLISH_CATEGORY_ORDER.filter((c) => c.skill === skill).map((c) => c.subcategory);
        builtEnglish[skill] = buildSkillInsight(skill, SKILL_LABELS[skill], SKILL_NOTES[skill], subcats, byTier, progressBySubcategory);
      });
      setInsights(builtEnglish as Record<QuestionSkill, SkillInsight>);

      const builtMath: Record<string, SkillInsight> = {};
      MATH_CATEGORY_ORDER.forEach((cat) => {
        builtMath[cat.skill] = buildSkillInsight(cat.skill, MATH_SKILL_LABELS[cat.skill], MATH_SKILL_NOTES[cat.skill], [cat.subcategory], byTier, progressBySubcategory);
      });
      setMathInsights(builtMath as Record<MathSkill, SkillInsight>);

      // ── chart + recap banner ──
      const sessions = sessionsRes.data ?? [];
      setChartPoints(sessions.map((s) => ({ date: new Date(s.completed_at as string), score: s.score ?? 0 })));

      if (sessions.length > 0) {
        const planSessionIds = new Set((planDaysRes.data ?? []).map((r) => r.session_id as string));
        const recent = sessions.slice(0, 6);
        const recentAvg = Math.round(recent.reduce((a, s) => a + (s.score ?? 0), 0) / recent.length);
        const prev = sessions.slice(6, 12);
        const prevAvg = prev.length > 0 ? Math.round(prev.reduce((a, s) => a + (s.score ?? 0), 0) / prev.length) : null;
        const delta = prevAvg != null ? recentAvg - prevAvg : 0;
        const planDayCount = sessions.filter((s) => planSessionIds.has(s.id)).length;

        const skillCounts: Record<string, number> = {};
        recent.forEach((s) => {
          const counts = perSessionSkillCounts[s.id] ?? {};
          Object.entries(counts).forEach(([sk, n]) => {
            const label = SKILL_LABELS[sk as QuestionSkill] ?? MATH_SKILL_LABELS[sk as MathSkill] ?? sk;
            skillCounts[label] = (skillCounts[label] || 0) + (n ?? 0);
          });
        });
        const topSkills = Object.keys(skillCounts).sort((a, b) => skillCounts[b] - skillCounts[a]).slice(0, 2);
        const skillPhrase = topSkills.length >= 2 ? `${topSkills[0]} and ${topSkills[1]}` : topSkills[0] || "your skills";

        setRecap({
          headline: planDayCount > 0 ? `${planDayCount} plan ${planDayCount === 1 ? "day" : "days"} in — right on schedule.` : "Great start — keep it going.",
          body: prevAvg != null
            ? `Accuracy is ${delta >= 0 ? `up ${delta}` : `down ${Math.abs(delta)}`} points over your last ${recent.length} sessions (now averaging ${recentAvg}%), with ${skillPhrase} getting the most work.`
            : `You're averaging ${recentAvg}% so far, with ${skillPhrase} getting the most work.`,
        });
      }

      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startSuggestedPractice(skill: SkillInsight) {
    setStartingSkill(skill.skill);
    setStartError(null);
    try {
      const isMath = MATH_CATEGORY_ORDER.some((c) => c.skill === skill.skill);
      if (isMath) {
        const subcategory = MATH_CATEGORY_ORDER.find((c) => c.skill === skill.skill)!.subcategory;
        const res = await fetch("/api/start-math-practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subcategories: [subcategory], difficulty: skill.suggestedTier, count: 10 }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Could not generate questions");
        router.push(`/practice/${body.sessionId}`);
      } else {
        const subcategories = ENGLISH_CATEGORY_ORDER.filter((c) => c.skill === skill.skill).map((c) => c.subcategory);
        const res = await fetch("/api/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subcategories, difficulty: skill.suggestedTier, count: 10 }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Could not generate questions");
        router.push(`/practice/${body.sessionId}`);
      }
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Could not start a session. Please try again.");
      setStartingSkill(null);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!insights || !mathInsights) return null;

  const allEnglish = Object.values(insights);
  const allMath = Object.values(mathInsights);
  const withDataEnglish = allEnglish.filter((s) => s.hasData);
  const withDataMath = allMath.filter((s) => s.hasData);

  if (withDataEnglish.length === 0 && withDataMath.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--canvas)", zoom: 1.15 }}>
        <AppNav />
        <main style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 24px" }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: "var(--text-2xl)", color: "var(--text-strong)", margin: "0 0 20px" }}>
            Picked for you
          </h1>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-sm)", padding: 40, textAlign: "center" }}>
            <p style={{ fontWeight: 600, fontSize: "var(--text-base)", color: "var(--text-strong)", margin: "0 0 8px" }}>No insights yet</p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: 24, lineHeight: "var(--leading-relaxed)" }}>
              Complete a plan day or a practice session and we&apos;ll show you exactly where to focus next.
            </p>
            <Button onClick={() => router.push("/plan")}>Go to my plan →</Button>
          </div>
        </main>
      </div>
    );
  }

  const activeInsights: Record<string, SkillInsight> = view === "english" ? insights : mathInsights;
  const activeWithData = view === "english" ? withDataEnglish : withDataMath;

  let domainData: DomainCard[] = [];
  if (view === "english") {
    const domainNames = Object.keys(DOMAIN_SKILLS) as Domain[];
    domainData = domainNames.map((name) => {
      const skills = DOMAIN_SKILLS[name].map((sk) => activeInsights[sk]);
      const skillsWithData = skills.filter((s) => s.hasData);
      const accuracy = skillsWithData.length
        ? Math.round((skillsWithData.reduce((a, s) => a + (s.accuracy * s.totalAnswered) / 100, 0) / skillsWithData.reduce((a, s) => a + s.totalAnswered, 0)) * 100)
        : 0;
      const graspN = skillsWithData.length ? Math.round(skillsWithData.reduce((a, s) => a + s.graspN, 0) / skillsWithData.length) : 1;
      const questions = skills.reduce((a, s) => a + s.totalAnswered, 0);
      return { name, skills, accuracy, graspN, grasp: GRASP_LABEL_BY_N[graspN] || "Emerging", questions };
    });
  } else {
    domainData = MATH_CATEGORY_ORDER.map((cat) => {
      const insight = activeInsights[cat.skill];
      const graspN = insight.hasData ? insight.graspN : 1;
      return { name: cat.subcategory, skills: [insight], accuracy: insight.accuracy, graspN, grasp: insight.hasData ? insight.grasp : "Emerging", questions: insight.totalAnswered };
    });
  }

  const selectedName = view === "english" ? selected : selectedMath;
  const setSelectedName = view === "english" ? (n: string) => setSelected(n as Domain) : setSelectedMath;
  const sel = domainData.find((d) => d.name === selectedName) ?? domainData[0];
  const selMeta = view === "english" ? DOMAIN_ICON[sel.name as Domain] : MATH_CATEGORY_ICON[sel.name];
  const improve = sel.skills.slice().sort(byWeakness);

  const overallCorrectPct = activeWithData.length > 0
    ? Math.round((activeWithData.reduce((a, s) => a + (s.accuracy * s.totalAnswered) / 100, 0) / activeWithData.reduce((a, s) => a + s.totalAnswered, 0)) * 100)
    : 0;
  const overallGraspN = activeWithData.length > 0 ? Math.round(activeWithData.reduce((a, s) => a + s.graspN, 0) / activeWithData.length) : 1;
  const weakest = activeWithData.slice().sort(byWeakness).slice(0, 3);

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", zoom: 1.15 }}>
      <AppNav />

      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 24px 64px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: "var(--text-2xl)", color: "var(--text-strong)", margin: 0, letterSpacing: "var(--tracking-snug)" }}>
            Picked for you
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "8px 0 0" }}>
            Extra practice tuned to your results — great for sharpening, though only plan days advance your 30-day path.
          </p>
        </div>

        {/* Recap banner */}
        {recap && (
          <div style={{ position: "relative", overflow: "hidden", borderRadius: "var(--radius-2xl)", padding: "24px 26px", marginBottom: 22, color: "#fff", boxShadow: "var(--shadow-brand)" }}>
            <span style={{ position: "absolute", inset: 0, background: "var(--gradient-radiant)" }} />
            <span style={{ position: "absolute", top: -50, right: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
            <div style={{ position: "relative" }}>
              <p style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.3, letterSpacing: "var(--tracking-snug)" }}>{recap.headline}</p>
              <p style={{ fontSize: "var(--text-sm)", opacity: 0.92, margin: 0, lineHeight: "var(--leading-relaxed)", maxWidth: 560 }}>{recap.body}</p>
            </div>
          </div>
        )}

        <ViewToggle view={view} setView={setView} />

        {activeWithData.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-sm)", padding: 40, textAlign: "center", marginBottom: 22 }}>
            <p style={{ fontWeight: 600, fontSize: "var(--text-base)", color: "var(--text-strong)", margin: "0 0 8px" }}>
              No {view === "english" ? "English" : "Math"} insights yet
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: 24, lineHeight: "var(--leading-relaxed)" }}>
              Complete a {view === "english" ? "English" : "Math"} plan day or practice session and we&apos;ll show you exactly where to focus next.
            </p>
            <Button onClick={() => router.push("/plan")}>Go to my plan →</Button>
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, marginBottom: 22, alignItems: "stretch" }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "var(--space-6)", boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ScoreRing score={overallCorrectPct} caption="overall accuracy" />
              </div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "var(--space-6)", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
                <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)", margin: 0 }}>Overall grasp</p>
                <p style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--text-strong)", margin: 0, lineHeight: 1.1 }}>{GRASP_LABEL_BY_N[overallGraspN] || "Emerging"}</p>
                <Pips n={overallGraspN} />
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", margin: 0 }}>Difficulty-adjusted skill level.</p>
              </div>
            </div>

            {/* Suggested extra practice */}
            <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-2xl)", boxShadow: "var(--shadow-sm)", padding: "22px 26px", marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
                <h2 style={{ fontWeight: 700, fontSize: "var(--text-md)", color: "var(--text-strong)", margin: 0 }}>Suggested extra practice</h2>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>lowest grasp first</span>
              </div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: "4px 0 16px" }}>
                Automatically picked from where you&apos;re weakest — one tap starts a short session at the right difficulty.
              </p>
              {startError && (
                <p style={{ fontSize: "var(--text-sm)", color: "var(--danger)", margin: "0 0 12px" }}>{startError}</p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {weakest.map((s) => (
                  <div key={s.skill} style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--surface-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "14px 16px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <p style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-strong)", margin: 0 }}>{s.label}</p>
                        <Badge tone={s.suggestedTone as "mint" | "sky" | "peach" | "rose"} size="sm">{s.suggestedLabel}</Badge>
                      </div>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--text-body)", margin: 0, lineHeight: "var(--leading-relaxed)" }}>{s.advice}</p>
                    </div>
                    <Button size="sm" onClick={() => startSuggestedPractice(s)} disabled={startingSkill !== null}>
                      {startingSkill === s.skill ? "Generating…" : "Start →"}
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            {/* Domain / category cards */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${domainData.length},1fr)`, gap: 14, marginBottom: 30 }}>
              {domainData.map((d) => {
                const meta = view === "english" ? DOMAIN_ICON[d.name as Domain] : MATH_CATEGORY_ICON[d.name];
                const isSel = d.name === selectedName;
                return (
                  <button key={d.name} onClick={() => setSelectedName(d.name)} style={{
                    position: "relative", display: "flex", flexDirection: "column", gap: 13, cursor: "pointer", textAlign: "left",
                    background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: 18,
                    fontFamily: "inherit", border: `1.5px solid ${isSel ? "var(--brand)" : "var(--border)"}`,
                    boxShadow: isSel ? "0 0 0 3px var(--brand-soft), var(--shadow-sm)" : "var(--shadow-sm)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "inline-flex", width: 38, height: 38, borderRadius: 11, background: meta.bg, color: meta.fg, alignItems: "center", justifyContent: "center" }}>
                        <Icon name={meta.icon} size={19} />
                      </span>
                      <Icon name="chevron-right" size={16} color="var(--text-faint)" />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-strong)", margin: 0, lineHeight: 1.25 }}>{d.name}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      <Pips n={d.graspN} size="sm" />
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)" }}>{d.grasp} grasp</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                      <span style={{ fontWeight: 800, fontSize: "var(--text-md)", color: "var(--text-strong)" }}>{d.accuracy}%</span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>accuracy</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail panel */}
            <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-2xl)", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "22px 26px", background: "var(--surface-sunken)", borderBottom: "1px solid var(--border)" }}>
                <span style={{ display: "inline-flex", width: 44, height: 44, borderRadius: 13, background: "var(--surface)", color: selMeta.fg, alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)", flexShrink: 0 }}>
                  <Icon name={selMeta.icon} size={22} />
                </span>
                <h3 style={{ flex: 1, fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--text-strong)", margin: 0, letterSpacing: "var(--tracking-snug)" }}>{sel.name}</h3>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap" }}>{sel.grasp} grasp · {sel.accuracy}% accuracy</p>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", margin: "3px 0 0", whiteSpace: "nowrap" }}>{sel.questions} questions</p>
                </div>
              </div>

              {/* Sub-category table */}
              <div style={{ padding: "8px 26px 8px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.9fr 1.3fr 1fr", gap: 18, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--text-faint)" }}>Sub-category</span>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--text-faint)" }}>Grasp</span>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--text-faint)" }}>Accuracy</span>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--text-faint)", textAlign: "right" }}>Next level</span>
                </div>
                {sel.skills.map((row) => (
                  <div key={row.skill} style={{ display: "grid", gridTemplateColumns: "1.5fr 0.9fr 1.3fr 1fr", gap: 18, alignItems: "center", padding: "15px 0", borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text-strong)", margin: 0 }}>{row.label}</p>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", margin: "2px 0 0" }}>{row.note}</p>
                    </div>
                    {row.hasData ? (
                      <>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <Pips n={row.graspN} />
                          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)" }}>{row.grasp}</span>
                        </div>
                        <div>
                          <SkillBar label="" accuracy={row.accuracy} detail={`${row.accuracy}% · at ${DIFFICULTY_LABELS[row.currentTier]}`} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <Badge tone={row.suggestedTone as "mint" | "sky" | "peach" | "rose"} size="sm">{row.suggestedLabel}</Badge>
                        </div>
                      </>
                    ) : (
                      <span style={{ gridColumn: "2 / -1", fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>Not started yet</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Improvement areas */}
              <div style={{ padding: "18px 26px 26px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "0 0 12px" }}>
                  <p style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-strong)", margin: 0, whiteSpace: "nowrap" }}>Improvement areas</p>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>weakest first</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 236, overflowY: "auto", paddingRight: 6 }}>
                  {improve.map((row) => (
                    <div key={row.skill} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "var(--surface-sunken)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "14px 16px" }}>
                      <div style={{ flexShrink: 0, paddingTop: 1 }}>
                        <Badge tone={row.hasData ? (row.accuracy >= 75 ? "mint" : row.accuracy >= 50 ? "butter" : "rose") : "sky"} size="sm">
                          {row.hasData ? `${row.accuracy}%` : "—"}
                        </Badge>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 3 }}>
                          <p style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-strong)", margin: 0 }}>{row.label}</p>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", whiteSpace: "nowrap", flexShrink: 0 }}>{row.hasData ? `${row.grasp} grasp` : ""}</span>
                        </div>
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-body)", margin: 0, lineHeight: "var(--leading-relaxed)" }}>{row.advice}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
                  <Button onClick={() => router.push("/practice")}>Practice {sel.name} →</Button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Accuracy chart */}
        {chartPoints.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <AccuracyChart points={chartPoints} />
          </div>
        )}
      </main>
    </div>
  );
}
