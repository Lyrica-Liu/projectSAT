import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import { SAT_GENERATOR_PROMPT } from "@/lib/prompts/sat-generator";
import type { QuestionDomain, QuestionSkill, Difficulty } from "@/lib/types";

export const maxDuration = 120;

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
  if (skillDifficulty === "LOW" || skillDifficulty === "MEDIUM-LOW") return "easy";
  if (skillDifficulty === "MEDIUM-HIGH") return "medium";
  return "hard";
}

function appDifficultyToSkill(d: Difficulty): string {
  if (d === "easy") return "LOW";
  if (d === "medium") return "MEDIUM-HIGH";
  return "HIGH";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const { domain, difficulty, count } = await req.json() as {
    domain: QuestionDomain | "both";
    difficulty: Difficulty;
    count: number;
  };

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

  const categories = categoriesForDomain(domain);
  const subcategories = subcategoriesForDomain(domain);
  const skillDifficulty = appDifficultyToSkill(difficulty);

  const userMessage = `Generate ${count} SAT Reading & Writing questions in JSON format.

Parameters:
- Difficulty: ${skillDifficulty}
- Categories: ${categories.join(", ")}
- Count: ${count}

Distribute questions evenly across these subcategories (vary them — do not repeat the same subcategory more than twice):
${subcategories.join(", ")}

Return ONLY valid JSON — no prose, no code fences. Use this exact structure:

{
  "questions": [
    {
      "id": 1,
      "subcategory": "<exact subcategory name from the list above>",
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
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    responseText = response.content[0].type === "text" ? response.content[0].text : "";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const questions = (parsed.questions as any[]).map((q) => {
    const subcategory: string = q.subcategory ?? "Central Ideas and Details";
    return {
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

  return NextResponse.json({ questions });
}
