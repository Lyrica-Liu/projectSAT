import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import { SAT_GENERATOR_PROMPT } from "@/lib/prompts/sat-generator";
import { createClient } from "@/lib/supabase/server";
import type { QuestionDomain, QuestionSkill, Difficulty } from "@/lib/types";

export const maxDuration = 120;

const MAX_QUESTIONS_PER_REQUEST = 20;
const DAILY_GENERATION_LIMIT = 6;

const SUBCATEGORY_TO_SKILL: Record<string, QuestionSkill> = {
  "Central Ideas and Details":          "central_idea",
  "Command of Evidence (Textual)":      "command_of_evidence",
  "Command of Evidence (Quantitative)": "command_of_evidence",
  "Inferences":                         "inferences",
  "Words in Context":                   "words_in_context",
  "Text Structure and Purpose":         "text_structure",
  "Cross-Text Connections":             "cross_text_connections",
  "Transitions":                        "transitions",
  "Rhetorical Synthesis":               "rhetorical_synthesis",
  "Boundaries":                         "boundaries",
  "Form, Structure, and Sense":         "form_structure_sense",
};

const SUBCATEGORY_TO_DOMAIN: Record<string, QuestionDomain> = {
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

const READING_SUBCATEGORIES = [
  "Central Ideas and Details",
  "Command of Evidence (Textual)",
  "Command of Evidence (Quantitative)",
  "Inferences",
  "Words in Context",
  "Text Structure and Purpose",
  "Cross-Text Connections",
];

const WRITING_SUBCATEGORIES = [
  "Transitions",
  "Rhetorical Synthesis",
  "Boundaries",
  "Form, Structure, and Sense",
];

function categoriesForDomain(domain: QuestionDomain | "both"): string[] {
  if (domain === "reading") return ["Information and Ideas", "Craft and Structure"];
  if (domain === "writing") return ["Expression of Ideas", "Standard English Conventions"];
  return [
    "Information and Ideas",
    "Craft and Structure",
    "Expression of Ideas",
    "Standard English Conventions",
  ];
}

function subcategoriesForDomain(domain: QuestionDomain | "both"): string[] {
  if (domain === "reading") return READING_SUBCATEGORIES;
  if (domain === "writing") return WRITING_SUBCATEGORIES;
  return [...READING_SUBCATEGORIES, ...WRITING_SUBCATEGORIES];
}

function mapDifficulty(skillDifficulty: string): Difficulty {
  if (skillDifficulty === "LOW") return "easy";
  if (skillDifficulty === "MEDIUM-LOW") return "medium-low";
  if (skillDifficulty === "MEDIUM-HIGH") return "medium-high";
  return "hard";
}

function appDifficultyToSkill(d: Difficulty): string {
  if (d === "easy") return "LOW";
  if (d === "medium-low") return "MEDIUM-LOW";
  if (d === "medium-high") return "MEDIUM-HIGH";
  return "HIGH";
}

 
function buildPassage(q: any): string | null {
  if (q.type === "cross_text") {
    return `Passage 1:\n${q.passage_1}\n\nPassage 2:\n${q.passage_2}`;
  }
  if (q.type === "quantitative") {
    return q.table ? `${q.passage}\n\n${q.table}` : q.passage ?? null;
  }
  if (q.type === "rhetorical_synthesis") {
    if (!q.notes) return null;
    const lines = Array.isArray(q.notes)
      ? q.notes.map((n: string) => `• ${n}`).join("\n")
      : String(q.notes);
    return `Notes:\n${lines}`;
  }
  return q.passage ?? null;
}

function extractJson(text: string): string {
  // Strip markdown code fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Otherwise find the outermost { ... }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  throw new Error("No JSON object found in response");
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server." },
      { status: 500 }
    );
  }

  // Auth before anything that costs money — the Claude call below is billed per request.
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json() as {
    subcategories: string[];
    difficulty: Difficulty;
    count: number;
  };
  const subcategories = (body.subcategories ?? []).filter((s) => s in SUBCATEGORY_TO_SKILL);
  const difficulty = body.difficulty;
  if (!subcategories.length) {
    return NextResponse.json({ error: "No valid subcategories provided." }, { status: 400 });
  }
  const requested = Math.floor(Number(body.count));
  if (!Number.isFinite(requested) || requested < 1) {
    return NextResponse.json({ error: "count must be a positive number." }, { status: 400 });
  }
  const count = Math.min(requested, MAX_QUESTIONS_PER_REQUEST);

  // Per-user daily cap on AI generations. Rows are insert/select-only under RLS, so a
  // client can't delete its own usage to reset the counter.
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count: usedToday, error: usageErr } = await supabase
    .from("ai_generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfDay.toISOString());
  if (usageErr) {
    console.error("Supabase usage lookup error:", usageErr);
    return NextResponse.json({ error: "Could not check your daily usage." }, { status: 500 });
  }
  if ((usedToday ?? 0) >= DAILY_GENERATION_LIMIT) {
    return NextResponse.json(
      { error: `You've reached today's limit of ${DAILY_GENERATION_LIMIT} AI-generated sets. Try again tomorrow, or practice from the question bank.` },
      { status: 429 }
    );
  }
  const { error: logErr } = await supabase
    .from("ai_generations")
    .insert({ user_id: user.id, question_count: count });
  if (logErr) {
    console.error("Supabase usage insert error:", logErr);
    return NextResponse.json({ error: "Could not record usage." }, { status: 500 });
  }

  // Load examples if available
  let examplesContent = "";
  try {
    examplesContent = readFileSync(
      join(process.cwd(), "lib/prompts/references/examples.md"),
      "utf-8"
    );
  } catch {
    // examples.md is optional — generation works without it
  }

  const systemPrompt = examplesContent
    ? `${SAT_GENERATOR_PROMPT}\n\n---\n\nAnnotated Examples (use as style anchors):\n\n${examplesContent}`
    : SAT_GENERATOR_PROMPT;

  const skillDifficulty = appDifficultyToSkill(difficulty);
  const subcategoryList = subcategories.join(", ");

  const userMessage = `Generate ${count} SAT Reading & Writing questions in JSON format.

Parameters:
- Subcategories: ${subcategoryList}
- Difficulty: ${skillDifficulty}
- Count: ${count}

Distribute the ${count} questions across these subcategories as evenly as possible: ${subcategoryList}.
Set "subcategory" on each question to one of those exact names.

Return ONLY valid JSON — no prose, no code fences. Use this exact structure:

{
  "questions": [
    {
      "id": 1,
      "subcategory": "<one of: ${subcategoryList}>",
      "type": "standard",
      "passage": "...",
      "prompt": "...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct_answer": "B",
      "correct_answer_explanation": "...",
      "false_answer_explanations": {
        "A": "Choice A is incorrect because ...",
        "C": "Choice C is incorrect because ...",
        "D": "Choice D is incorrect because ..."
      }
    }
  ]
}

Type field values:
- "standard" — single passage (most subcategories)
- "quantitative" — use "passage" + "table" (markdown string) instead of just "passage"
- "cross_text" — use "passage_1" and "passage_2" instead of "passage"
- "rhetorical_synthesis" — use "notes" (array of strings) instead of "passage"

correct_answer_explanation is required for every question in JSON output.`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let responseText: string;
  try {
    // Streamed so a large max_tokens doesn't hit the SDK's non-streaming timeout.
    const response = await client.messages
      .stream({
        model: "claude-sonnet-5",
        max_tokens: 32000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      })
      .finalMessage();
    // Sonnet 5 thinks by default, so the first block may be a thinking block — collect the text.
    responseText = response.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    if (response.stop_reason === "max_tokens") {
      console.error("Claude response hit max_tokens");
      return NextResponse.json({ error: "Question generation was cut off. Try fewer questions." }, { status: 502 });
    }
  } catch (err) {
    console.error("Anthropic API error:", err);
    return NextResponse.json({ error: "Failed to call Claude API." }, { status: 502 });
  }

  let parsed: { questions: unknown[] };
  try {
    parsed = JSON.parse(extractJson(responseText));
  } catch (err) {
    console.error("JSON parse error. Raw response:", responseText.slice(0, 500));
    return NextResponse.json({ error: "Claude returned malformed JSON." }, { status: 502 });
  }

  // Map generated questions to the app's Question shape (minus id/created_at — Supabase adds those)
   
  const questions = (parsed.questions as any[]).slice(0, count).map((q) => {
    const subcategory: string = q.subcategory ?? "Central Ideas and Details";
    return {
      user_id:     user.id,
      domain:      SUBCATEGORY_TO_DOMAIN[subcategory] ?? "reading",
      skill:       SUBCATEGORY_TO_SKILL[subcategory]  ?? "central_idea",
      difficulty:  mapDifficulty(skillDifficulty),
      passage:     buildPassage(q),
      stem:        q.prompt,
      options:     q.options,
      answer:      q.correct_answer,
      explanation: q.correct_answer_explanation ?? "",
    };
  });

  const { data: savedQuestions, error: qErr } = await supabase
    .from("questions")
    .insert(questions)
    .select("id");

  if (qErr || !savedQuestions) {
    console.error("Supabase insert questions error:", qErr);
    return NextResponse.json({ error: `Could not save questions: ${qErr?.message ?? "unknown error"}` }, { status: 500 });
  }

  const { data: session, error: sErr } = await supabase
    .from("sessions")
    .insert({ user_id: user.id, question_count: count, domain_filter: (() => {
      const domains = new Set(subcategories.map((s) => SUBCATEGORY_TO_DOMAIN[s] ?? "reading"));
      return domains.size > 1 ? "both" : (domains.values().next().value ?? "reading");
    })() })
    .select("id")
    .single();

  if (sErr || !session) {
    console.error("Supabase insert session error:", sErr);
    return NextResponse.json({ error: `Could not create session: ${sErr?.message ?? "unknown error"}` }, { status: 500 });
  }

  const { error: aErr } = await supabase
    .from("answers")
    .insert(savedQuestions.map((q, i) => ({ session_id: session.id, question_id: q.id, position: i })));

  if (aErr) {
    console.error("Supabase insert answers error:", aErr);
    return NextResponse.json({ error: `Could not link questions to session: ${aErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ sessionId: session.id });
}
