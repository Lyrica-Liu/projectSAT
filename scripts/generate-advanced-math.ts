/**
 * Adds the Digital SAT's "Advanced Math" domain to lib/questions/dsat_math_question_bank.txt:
 * 40 questions per difficulty tier, each one independently re-solved before it's kept.
 *
 * Usage (each step waits for its batch, so they can be run back to back):
 *   npx tsx scripts/generate-advanced-math.ts generate   # writes 50 candidates per tier
 *   npx tsx scripts/generate-advanced-math.ts verify     # blind re-solve of every candidate
 *   npx tsx scripts/generate-advanced-math.ts write      # appends the 40 best per tier to the bank
 *
 * A candidate is kept only if a blind solve (no answer key shown) agrees with its key and finds
 * no second defensible answer or serious problem. Batch state lives in scripts/.bank-ai/.
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  MODEL, submitBatch, waitForBatch, readBatch, reviewRequest, judge, batchCostUSD, saveJson, loadJson,
  type BatchRequest, type Review,
} from "./lib/bank-ai";

const BANK_PATH = join(process.cwd(), "lib/questions/dsat_math_question_bank.txt");
const TIERS = ["EASY", "MEDIUM-LOW", "MEDIUM-HIGH", "HIGH"] as const;
type Tier = typeof TIERS[number];
const KEEP_PER_TIER = 40;
const PER_REQUEST = 25;

/** Two requests per tier, split by College Board's Advanced Math skills so they don't overlap. */
const TOPIC_GROUPS = [
  {
    key: "eq",
    topics: "Equivalent expressions (factoring, expanding, rational exponents, radicals, rational expressions) and nonlinear equations in one variable or systems in two variables (quadratic, absolute value, radical, rational and exponential equations; linear–quadratic systems; number of solutions).",
  },
  {
    key: "fn",
    topics: "Nonlinear functions: quadratic functions (vertex, intercepts, axis of symmetry, forms), exponential growth and decay (including percent change models), polynomial zeros and factors, function notation and composition, transformations of graphs, and interpreting nonlinear models in context.",
  },
] as const;

const TIER_GUIDE: Record<Tier, string> = {
  "EASY": "one or two routine steps; a student comfortable with Algebra 1 gets it right quickly.",
  "MEDIUM-LOW": "two or three steps; requires recognizing which form or method to use.",
  "MEDIUM-HIGH": "several steps or a less obvious insight (e.g. choosing an equivalent form, reasoning about parameters).",
  "HIGH": "the hardest SAT Advanced Math items: parameters, number-of-solutions reasoning, structure, or multi-step modeling, still solvable in under three minutes.",
};

interface Candidate {
  kind: "multiple_choice" | "grid_in";
  topic: string;
  prompt: string;
  table: string;
  choices: { A: string; B: string; C: string; D: string };
  correct_answer: string;
  correct_explanation: string;
  wrong_explanations: { A: string; B: string; C: string; D: string };
}

const CHOICES_SCHEMA = {
  type: "object", additionalProperties: false, required: ["A", "B", "C", "D"],
  properties: { A: { type: "string" }, B: { type: "string" }, C: { type: "string" }, D: { type: "string" } },
} as const;

const GENERATE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["kind", "topic", "prompt", "table", "choices", "correct_answer", "correct_explanation", "wrong_explanations"],
        properties: {
          kind: { type: "string", enum: ["multiple_choice", "grid_in"] },
          topic: { type: "string" },
          prompt: { type: "string" },
          table: { type: "string", description: "Markdown table rows if the question needs one, otherwise empty." },
          choices: { ...CHOICES_SCHEMA, description: "Empty strings for a grid-in question." },
          correct_answer: { type: "string", description: "A–D for multiple choice; the exact value for grid-in." },
          correct_explanation: { type: "string" },
          wrong_explanations: { ...CHOICES_SCHEMA, description: "Why each wrong choice is wrong (the trap it represents); empty string for the correct letter and for grid-in." },
        },
      },
    },
  },
} as const;

/** The first multiple-choice and grid-in Algebra question of a tier, verbatim, as style anchors. */
function styleAnchors(tier: Tier): string {
  const bank = readFileSync(BANK_PATH, "utf8");
  const start = bank.indexOf(`CATEGORY: ALGEBRA | DIFFICULTY: ${tier}`);
  const section = bank.slice(start, bank.indexOf("CATEGORY:", start + 10));
  const blocks = section.split(/\n(?=QUESTION \d+ \|)/).slice(1);
  const mc = blocks.find((b) => b.includes("| Multiple Choice")) ?? "";
  const grid = blocks.find((b) => b.includes("| Grid-In")) ?? "";
  return `${mc.trim()}\n\n${grid.trim()}`;
}

function generateRequest(tier: Tier, group: typeof TOPIC_GROUPS[number]): BatchRequest {
  const prompt = `Write ${PER_REQUEST} new Digital SAT Math questions in the Advanced Math domain at the ${tier} difficulty tier.

Skills to cover (spread the questions across all of them): ${group.topics}

Difficulty — ${tier}: ${TIER_GUIDE[tier]}

Requirements:
- About 75% multiple choice with exactly one correct answer, and about 25% grid-in (student-produced response).
- Grid-in answers must be enterable on the real test: a positive answer fits in 5 characters, a negative one in 6 (the minus sign counts); use a fraction like 7/2 or a decimal, never a variable or a radical.
- Wrong choices should come from realistic student mistakes, and each wrong-answer explanation should name that mistake.
- Plain-text math only, matching the examples: x^2 for powers, sqrt(x) for roots, a/b for fractions, * only where needed. No LaTeX, no Unicode superscripts.
- Every question must be different — vary the functions, numbers, contexts and what is asked. No two questions may share an answer setup.
- The prompt is a single paragraph. Put any table in "table" as markdown rows instead of in the prompt.
- Double-check every answer key and that no other choice is also correct.

Two existing questions from this bank (a different domain, same tier), to match tone and format:

${styleAnchors(tier)}`;

  return {
    custom_id: `gen-${tier}-${group.key}`,
    params: {
      model: MODEL,
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      output_config: { format: { type: "json_schema", schema: GENERATE_SCHEMA } },
      messages: [{ role: "user", content: prompt }],
    },
  } as BatchRequest;
}

interface CandidateRecord extends Candidate { id: string; tier: Tier }

async function generate() {
  const requests = TIERS.flatMap((t) => TOPIC_GROUPS.map((g) => generateRequest(t, g)));
  const batchId = await submitBatch(requests);
  saveJson("advmath-state.json", { generateBatch: batchId });
  await waitForBatch(batchId);

  const outcomes = await readBatch<{ questions: Candidate[] }>(batchId);
  const candidates: CandidateRecord[] = [];
  for (const [customId, o] of outcomes) {
    const tier = customId.replace(/^gen-/, "").replace(/-(eq|fn)$/, "") as Tier;
    if (!o.ok) { console.warn(`${customId}: ${o.failure}`); continue; }
    o.parsed!.questions.forEach((q, i) => candidates.push({ ...q, id: `${customId}-${i}`.replace(/[^a-zA-Z0-9_-]/g, "_"), tier }));
  }
  saveJson("advmath-candidates.json", candidates);
  console.log(`${candidates.length} candidates. Generation cost ≈ $${batchCostUSD([...outcomes.values()].map((o) => o.usage)).toFixed(2)}.`);
}

async function verify() {
  const state = loadJson<{ generateBatch: string }>("advmath-state.json");
  const candidates = loadJson<CandidateRecord[]>("advmath-candidates.json");
  const batchId = await submitBatch(candidates.map((c) => reviewRequest(c.id, {
    section: "Math", skill: "Advanced Math", difficulty: c.tier,
    passage: c.table.trim() ? c.table : null, stem: c.prompt,
    options: c.kind === "grid_in" ? null : c.choices,
  })));
  saveJson("advmath-state.json", { ...state, verifyBatch: batchId });
  await waitForBatch(batchId);

  const outcomes = await readBatch<Review>(batchId);
  const verified = candidates.map((c) => {
    const o = outcomes.get(c.id);
    return { ...c, verdict: judge(c.correct_answer, c.kind === "grid_in", o?.ok ? o.parsed : undefined), review: o?.parsed };
  });
  saveJson("advmath-verified.json", verified);
  const byTier = TIERS.map((t) => `${t}: ${verified.filter((v) => v.tier === t && v.verdict === "ok").length} passed`);
  console.log(byTier.join(" · "));
  console.log(`Verification cost ≈ $${batchCostUSD([...outcomes.values()].map((o) => o.usage)).toFixed(2)}.`);
}

function formatQuestion(n: number, tier: Tier, q: Candidate): string {
  const table = q.table.trim() ? `\nTable: ${q.topic}\n${q.table.trim()}\n` : "";
  if (q.kind === "grid_in") {
    return `QUESTION ${n} | Advanced Math | ${tier} | Grid-In
Prompt: ${q.prompt.replace(/\s+/g, " ").trim()}${table}

Correct Answer: ${q.correct_answer.trim()}
Explanation: ${q.correct_explanation.trim()}`;
  }
  const letters = ["A", "B", "C", "D"] as const;
  const wrong = letters.filter((l) => l !== q.correct_answer.trim().toUpperCase());
  return `QUESTION ${n} | Advanced Math | ${tier} | Multiple Choice
Prompt: ${q.prompt.replace(/\s+/g, " ").trim()}${table}
${letters.map((l) => `${l}) ${q.choices[l].trim()}`).join("\n")}

Correct Answer: ${q.correct_answer.trim().toUpperCase()}
Correct Answer Explanation: ${q.correct_explanation.trim()}
False Answer Explanations:
${wrong.map((l) => `${l}) ${q.wrong_explanations[l].trim()}`).join("\n")}`;
}

function write() {
  const verified = loadJson<(CandidateRecord & { verdict: string })[]>("advmath-verified.json");
  let bank = readFileSync(BANK_PATH, "utf8");
  if (bank.includes("CATEGORY: ADVANCED MATH")) throw new Error("The bank already has an Advanced Math section — remove it first to regenerate.");

  const bar = "=".repeat(80);
  let n = 0;
  const sections: string[] = [];
  for (const tier of TIERS) {
    const passed = verified.filter((v) => v.tier === tier && v.verdict === "ok");
    // Keep the bank's ~25% grid-in mix when trimming to 40.
    const grid = passed.filter((q) => q.kind === "grid_in").slice(0, Math.round(KEEP_PER_TIER * 0.25));
    const mc = passed.filter((q) => q.kind === "multiple_choice").slice(0, KEEP_PER_TIER - grid.length);
    const kept = [...mc, ...grid].slice(0, KEEP_PER_TIER);
    if (kept.length < KEEP_PER_TIER) console.warn(`${tier}: only ${kept.length} passed verification (wanted ${KEEP_PER_TIER}).`);
    sections.push(`\n\n${bar}\nCATEGORY: ADVANCED MATH | DIFFICULTY: ${tier}\n${bar}\n\n` +
      kept.map((q) => formatQuestion(++n, tier, q)).join("\n\n"));
  }
  bank = bank.replace(/^(\d+) Questions \| 3 Categories x 4 Difficulties x 40 Questions\nCategories: Algebra \| Data Analysis \| Geometry/m,
    `${480 + n} Questions | 4 Categories x 4 Difficulties x 40 Questions\nCategories: Algebra | Data Analysis | Geometry | Advanced Math`);
  writeFileSync(BANK_PATH, bank.trimEnd() + sections.join("") + "\n");
  console.log(`Appended ${n} Advanced Math questions to ${BANK_PATH}.`);
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === "generate") await generate();
  else if (cmd === "verify") await verify();
  else if (cmd === "write") write();
  else console.log("Usage: npx tsx scripts/generate-advanced-math.ts generate | verify | write");
}

main().catch((err) => { console.error(err); process.exit(1); });
