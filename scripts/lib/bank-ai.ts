/**
 * Shared Claude plumbing for the question-bank scripts (generate-advanced-math.ts,
 * audit-question-bank.ts): a Message Batches wrapper, and a blind "solve + review" request
 * that answers a question without ever seeing its answer key.
 */
import Anthropic from "@anthropic-ai/sdk";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { gradeGridAnswer } from "../../lib/grading";

process.loadEnvFile(join(process.cwd(), ".env.local"));

export const MODEL = "claude-opus-5";
export const client = new Anthropic();

export const STATE_DIR = join(process.cwd(), "scripts/.bank-ai");
mkdirSync(STATE_DIR, { recursive: true });

export function saveJson(name: string, data: unknown) {
  writeFileSync(join(STATE_DIR, name), JSON.stringify(data, null, 2));
}
export function loadJson<T>(name: string): T {
  const p = join(STATE_DIR, name);
  if (!existsSync(p)) throw new Error(`Missing ${p} — run the earlier step first.`);
  return JSON.parse(readFileSync(p, "utf8")) as T;
}

// ── Batches ──────────────────────────────────────────────────────────────────

export type BatchRequest = Anthropic.Messages.Batches.BatchCreateParams.Request;

export async function submitBatch(requests: BatchRequest[]): Promise<string> {
  const batch = await client.messages.batches.create({ requests });
  console.log(`Submitted batch ${batch.id} (${requests.length} requests).`);
  return batch.id;
}

/** Polls until the batch has ended. Most finish well within an hour. */
export async function waitForBatch(id: string): Promise<void> {
  for (;;) {
    const b = await client.messages.batches.retrieve(id);
    const c = b.request_counts;
    if (b.processing_status === "ended") {
      console.log(`Batch ${id} ended — succeeded ${c.succeeded}, errored ${c.errored}, expired ${c.expired}, canceled ${c.canceled}.`);
      return;
    }
    console.log(`Batch ${id}: ${b.processing_status} — ${c.processing} processing, ${c.succeeded} done…`);
    await new Promise((r) => setTimeout(r, 60_000));
  }
}

export interface BatchOutcome<T> {
  ok: boolean;
  parsed?: T;
  /** Why it failed: errored / expired / canceled / refusal / max_tokens / bad JSON. */
  failure?: string;
  usage?: { input_tokens: number; output_tokens: number };
}

/** Reads a finished batch's results keyed by custom_id (results arrive in any order). */
export async function readBatch<T>(id: string): Promise<Map<string, BatchOutcome<T>>> {
  const out = new Map<string, BatchOutcome<T>>();
  for await (const r of await client.messages.batches.results(id)) {
    if (r.result.type !== "succeeded") {
      out.set(r.custom_id, { ok: false, failure: r.result.type });
      continue;
    }
    const msg = r.result.message;
    const usage = { input_tokens: msg.usage.input_tokens, output_tokens: msg.usage.output_tokens };
    if (msg.stop_reason === "refusal" || msg.stop_reason === "max_tokens") {
      out.set(r.custom_id, { ok: false, failure: msg.stop_reason, usage });
      continue;
    }
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    try {
      out.set(r.custom_id, { ok: true, parsed: JSON.parse(text) as T, usage });
    } catch {
      out.set(r.custom_id, { ok: false, failure: "bad_json", usage });
    }
  }
  return out;
}

/** Opus 5 batch pricing is half of $5 / $25 per million tokens. */
export function batchCostUSD(usages: ({ input_tokens: number; output_tokens: number } | undefined)[]): number {
  let inTok = 0, outTok = 0;
  for (const u of usages) if (u) { inTok += u.input_tokens; outTok += u.output_tokens; }
  return (inTok * 2.5 + outTok * 12.5) / 1_000_000;
}

// ── Blind solve + review ─────────────────────────────────────────────────────

export interface ReviewItem {
  section: "Reading and Writing" | "Math";
  skill: string;
  difficulty: string;
  passage: string | null;
  stem: string;
  /** null for a student-produced-response (grid-in) question. */
  options: { A: string; B: string; C: string; D: string } | null;
}

export interface Review {
  answer: string;
  other_defensible_choices: { choice: string; reason: string }[];
  problems: { kind: ProblemKind; detail: string }[];
  confidence: "high" | "medium" | "low";
}

const PROBLEM_KINDS = [
  "no_correct_answer", "multiple_correct_answers", "unclear_or_ambiguous",
  "factual_or_math_error", "formatting", "difficulty_mismatch", "other",
] as const;
type ProblemKind = typeof PROBLEM_KINDS[number];

const REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "other_defensible_choices", "problems", "confidence"],
  properties: {
    answer: { type: "string", description: "A, B, C or D for multiple choice; the numeric answer for a student-produced response." },
    other_defensible_choices: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["choice", "reason"],
        properties: { choice: { type: "string" }, reason: { type: "string" } },
      },
    },
    problems: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["kind", "detail"],
        properties: { kind: { type: "string", enum: [...PROBLEM_KINDS] }, detail: { type: "string" } },
      },
    },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
} as const;

const REVIEW_SYSTEM = `You review practice questions for the Digital SAT before students see them.

Solve the question yourself, carefully, the way a strong test-maker would. Then judge whether it is a fair SAT item.

- answer: your answer. For multiple choice, the single best choice letter. For a student-produced response, the exact value (an integer, decimal, or fraction like 7/2).
- other_defensible_choices: any OTHER choice that a careful expert reviewer would also accept as correct. Leave it empty when one choice is clearly best — a choice that is merely tempting or partly true does not belong here.
- problems: real defects only — no correct answer, more than one correct answer, wording that makes the task unclear, a factual or math error in the question itself, broken formatting (e.g. a missing blank, table or choice), or a difficulty clearly unlike the stated tier. Leave it empty for a sound question.
- confidence: how sure you are of your answer.

Reading and Writing questions follow College Board conventions: choose the BEST answer, using only the text provided and Standard English conventions.`;

function renderItem(q: ReviewItem): string {
  const parts = [`Section: ${q.section}`, `Skill: ${q.skill}`, `Stated difficulty: ${q.difficulty}`];
  if (q.passage) parts.push(`\nPassage / text:\n${q.passage}`);
  parts.push(`\nQuestion:\n${q.stem}`);
  parts.push(q.options
    ? `\nChoices:\nA) ${q.options.A}\nB) ${q.options.B}\nC) ${q.options.C}\nD) ${q.options.D}`
    : "\nStudent-produced response (no choices).");
  return parts.join("\n");
}

/** A batch request that solves and reviews one question. The answer key is never sent. */
export function reviewRequest(customId: string, q: ReviewItem): BatchRequest {
  return {
    custom_id: customId,
    params: {
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: REVIEW_SYSTEM,
      messages: [{ role: "user", content: renderItem(q) }],
      output_config: { format: { type: "json_schema", schema: REVIEW_SCHEMA } },
    },
  } as BatchRequest;
}

export type Verdict = "ok" | "wrong_key" | "ambiguous" | "minor" | "needs_manual_review";

/**
 * Compares a blind review against the answer key.
 * - wrong_key: the reviewer confidently picked something else
 * - ambiguous: another defensible answer, or no/unclear correct answer
 * - minor: formatting or a stated-difficulty mismatch only
 */
export function judge(key: string, isGrid: boolean, review: Review | undefined): Verdict {
  if (!review) return "needs_manual_review";
  const agrees = isGrid
    ? gradeGridAnswer(review.answer, key)
    : review.answer.trim().toUpperCase().startsWith(key.trim().toUpperCase());
  const serious = review.problems.some((p) =>
    p.kind === "no_correct_answer" || p.kind === "multiple_correct_answers" || p.kind === "unclear_or_ambiguous" || p.kind === "factual_or_math_error"
  );
  if (!agrees) return review.confidence === "low" ? "ambiguous" : "wrong_key";
  if (review.other_defensible_choices.length > 0 || serious) return "ambiguous";
  if (review.problems.length > 0) return "minor";
  return "ok";
}
