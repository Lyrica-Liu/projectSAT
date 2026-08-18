import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBankQuestions } from "@/lib/questions/parser";
import { getMathBankQuestions } from "@/lib/questions/mathParser";
import type { Difficulty } from "@/lib/types";

const MATH_SUBCATEGORIES = new Set(["Algebra", "Data Analysis", "Geometry"]);

const SUBCATEGORY_TO_DOMAIN: Record<string, "reading" | "writing"> = {
  "Central Ideas and Details":          "reading",
  "Command of Evidence (Textual)":      "reading",
  "Command of Evidence (Quantitative)": "reading",
  "Inferences":                         "reading",
  "Words in Context":                   "reading",
  "Text Structure and Purpose":         "reading",
  "Cross-Text Connections":             "reading",
  "Transitions":                        "writing",
  "Rhetorical Synthesis":               "writing",
  "Boundaries":                         "writing",
  "Form, Structure, and Sense":         "writing",
};

interface PoolItem {
  domain: "reading" | "writing" | "math";
  skill: string;
  difficulty: Difficulty;
  passage: string | null;
  stem: string;
  question_type: "multiple_choice" | "grid_in";
  options: { A: string; B: string; C: string; D: string } | null;
  answer: "A" | "B" | "C" | "D" | null;
  grid_answer: string | null;
  explanation: string;
}

/**
 * Builds an extra-practice session directly from the static question banks
 * (English + Math) — no AI generation, works for any mix of subcategories
 * from either subject in the same session.
 */
export async function POST(req: NextRequest) {
  const { subcategories, difficulty, count } = await req.json() as {
    subcategories: string[];
    difficulty: Difficulty;
    count: number;
  };
  if (!subcategories?.length || !difficulty || !count) {
    return NextResponse.json({ error: "Missing subcategories, difficulty, or count." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const pool: PoolItem[] = [];
  for (const subcategory of subcategories) {
    if (MATH_SUBCATEGORIES.has(subcategory)) {
      for (const q of getMathBankQuestions(subcategory, difficulty)) {
        pool.push({
          domain: "math", skill: q.skill, difficulty: q.difficulty, passage: q.passage, stem: q.stem,
          question_type: q.questionType, options: q.options, answer: q.answer,
          grid_answer: q.gridAnswer, explanation: q.explanation,
        });
      }
    } else {
      for (const q of getBankQuestions(subcategory, difficulty)) {
        pool.push({
          domain: SUBCATEGORY_TO_DOMAIN[subcategory] ?? "reading", skill: q.skill, difficulty: q.difficulty,
          passage: q.passage, stem: q.stem, question_type: "multiple_choice", options: q.options,
          answer: q.answer, grid_answer: null, explanation: q.explanation,
        });
      }
    }
  }

  if (pool.length === 0) {
    return NextResponse.json({ error: `No questions found for "${subcategories.join(", ")}" / "${difficulty}"` }, { status: 500 });
  }

  const shuffled = pool.slice().sort(() => Math.random() - 0.5);
  const picked = Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);

  const questions = picked.map((q) => ({
    user_id:       user.id,
    domain:        q.domain,
    skill:         q.skill,
    difficulty:    q.difficulty,
    passage:       q.passage,
    stem:          q.stem,
    question_type: q.question_type,
    options:       q.options,
    answer:        q.answer,
    grid_answer:   q.grid_answer,
    explanation:   q.explanation,
  }));

  const { data: savedQuestions, error: qErr } = await supabase
    .from("questions")
    .insert(questions)
    .select("id");

  if (qErr || !savedQuestions) {
    return NextResponse.json({ error: `Could not save questions: ${qErr?.message ?? "unknown error"}` }, { status: 500 });
  }

  const domains = new Set(picked.map((q) => q.domain));
  const domainFilter = domains.size > 1 ? "both" : (domains.values().next().value ?? "reading");

  const { data: session, error: sErr } = await supabase
    .from("sessions")
    .insert({ user_id: user.id, question_count: count, domain_filter: domainFilter })
    .select("id")
    .single();

  if (sErr || !session) {
    return NextResponse.json({ error: `Could not create session: ${sErr?.message ?? "unknown error"}` }, { status: 500 });
  }

  const { error: aErr } = await supabase
    .from("answers")
    .insert(savedQuestions.map((q, i) => ({ session_id: session.id, question_id: q.id, position: i })));

  if (aErr) {
    return NextResponse.json({ error: `Could not link questions to session: ${aErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ sessionId: session.id });
}
