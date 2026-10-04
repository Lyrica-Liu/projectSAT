/**
 * Repairs the questions a bank audit flagged (scripts/audit-question-bank.ts), then re-checks
 * every repair blind before using it.
 *
 * Usage (each step waits for its batch):
 *   npx tsx scripts/repair-question-bank.ts fix [reports/question-audit/<date>.json]
 *   npx tsx scripts/repair-question-bank.ts verify
 *   npx tsx scripts/repair-question-bank.ts apply
 *
 * Targets: wrong answer keys, ambiguous items, Math items that lean on a table or "previous"
 * question they don't include, and grid-in keys students can't type (π, √).
 * `apply` writes lib/questions/bank-overrides.json: a repair that passes the blind re-check
 * replaces the original; anything Claude couldn't salvage, or whose repair failed, is removed
 * from rotation. The bank .txt files are never edited.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import {
  MODEL, submitBatch, waitForBatch, readBatch, reviewRequest, judge, batchCostUSD, saveJson, loadJson,
  type BatchRequest, type Review, type Verdict,
} from "./lib/bank-ai";
import { questionKey, type Override } from "../lib/questions/overrides";

const OVERRIDES_PATH = join(process.cwd(), "lib/questions/bank-overrides.json");

interface AuditRow {
  id: string;
  bank: "english" | "math";
  category: string;
  difficulty: string;
  passage: string | null;
  stem: string;
  options: { A: string; B: string; C: string; D: string } | null;
  key: string;
  explanation: string;
  verdict: Verdict;
  review?: Review;
}

interface Repair {
  action: "fix" | "drop";
  passage: string;
  stem: string;
  kind: "multiple_choice" | "grid_in";
  choices: { A: string; B: string; C: string; D: string };
  correct_answer: string;
  correct_explanation: string;
  wrong_explanations: { A: string; B: string; C: string; D: string };
  change_note: string;
}

const CHOICES = {
  type: "object", additionalProperties: false, required: ["A", "B", "C", "D"],
  properties: { A: { type: "string" }, B: { type: "string" }, C: { type: "string" }, D: { type: "string" } },
} as const;

const REPAIR_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["action", "passage", "stem", "kind", "choices", "correct_answer", "correct_explanation", "wrong_explanations", "change_note"],
  properties: {
    action: { type: "string", enum: ["fix", "drop"] },
    passage: { type: "string", description: "Full passage/text/table the question needs, or empty if none." },
    stem: { type: "string" },
    kind: { type: "string", enum: ["multiple_choice", "grid_in"] },
    choices: { ...CHOICES, description: "Empty strings for grid-in." },
    correct_answer: { type: "string" },
    correct_explanation: { type: "string" },
    wrong_explanations: { ...CHOICES, description: "Why each wrong choice is wrong; empty for the correct letter and for grid-in." },
    change_note: { type: "string", description: "One sentence: what was wrong and what you changed." },
  },
} as const;

const REPAIR_SYSTEM = `You fix broken Digital SAT practice questions so students can trust them.

You'll get a question from a practice bank, its current answer key, and a reviewer's findings. Return a corrected version that:
- has exactly one defensible correct answer, and an answer key that matches it;
- is fully self-contained — if it relies on a table, data or "the previous question", put that information in the passage (tables as markdown rows);
- keeps the same skill, difficulty tier, question format and topic, changing as little as needed (often one distractor or a few words);
- for a student-produced response (grid-in), has a numeric answer a student can type: an integer, decimal or fraction like 7/2 — never π, a radical or a variable (rephrase the question, e.g. "the area is kπ; what is k?");
- uses plain-text math (x^2, sqrt(x), a/b), matching the original.

Reading and Writing questions follow College Board conventions: one BEST answer, using only the text given and Standard English conventions.

If the reviewer is wrong and the question is actually sound, return it unchanged with action "fix" and say so in change_note. Use action "drop" only if the question can't be salvaged without becoming a different question.`;

function latestAudit(): string {
  const dir = join(process.cwd(), "reports/question-audit");
  const files = readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  if (!files.length) throw new Error("No full audit report found — run audit-question-bank.ts first.");
  return join(dir, files[files.length - 1]);
}

const DANGLING = /\b(previous|above|same (cone|triangle|circle|rectangle|function|figure|graph|data))\b|\busing the .{0,50}table\b/i;
const UNTYPEABLE = (key: string) => !/^-?[\d.]+(\/[\d.]+)?$/.test(key.trim());

function isTarget(r: AuditRow): string | null {
  if (r.verdict === "wrong_key") return "wrong answer key";
  if (r.verdict === "ambiguous") return "ambiguous";
  if (r.bank === "math" && !r.passage && DANGLING.test(r.stem)) return "depends on missing context";
  if (r.bank === "math" && r.options === null && UNTYPEABLE(r.key)) return "grid-in answer can't be typed";
  return null;
}

function renderForRepair(r: AuditRow, why: string): string {
  const parts = [
    `Section: ${r.bank === "math" ? "Math" : "Reading and Writing"} · Skill: ${r.category} · Difficulty tier: ${r.difficulty}`,
    `Flagged because: ${why}`,
  ];
  if (r.passage) parts.push(`\nPassage / text:\n${r.passage}`);
  parts.push(`\nQuestion:\n${r.stem}`);
  parts.push(r.options
    ? `\nChoices:\nA) ${r.options.A}\nB) ${r.options.B}\nC) ${r.options.C}\nD) ${r.options.D}`
    : "\nStudent-produced response (grid-in).");
  parts.push(`\nCurrent answer key: ${r.key}`, `Current explanation: ${r.explanation}`);
  if (r.review) {
    parts.push(`\nReviewer (solved without seeing the key) answered: ${r.review.answer} (${r.review.confidence} confidence)`);
    for (const d of r.review.other_defensible_choices) parts.push(`- Also defensible: ${d.choice} — ${d.reason}`);
    for (const p of r.review.problems) parts.push(`- ${p.kind}: ${p.detail}`);
  }
  return parts.join("\n");
}

interface Target extends AuditRow { why: string; originalKey: string }

async function fix(auditPath?: string) {
  const rows = JSON.parse(readFileSync(auditPath ?? latestAudit(), "utf8")) as AuditRow[];
  const targets: Target[] = rows.flatMap((r) => {
    const why = isTarget(r);
    return why ? [{ ...r, why, originalKey: questionKey({ passage: r.passage, stem: r.stem, options: r.options }) }] : [];
  });
  console.log(`${targets.length} questions to repair.`);

  const requests: BatchRequest[] = targets.map((t) => ({
    custom_id: t.id,
    params: {
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: REPAIR_SYSTEM,
      messages: [{ role: "user", content: renderForRepair(t, t.why) }],
      output_config: { format: { type: "json_schema", schema: REPAIR_SCHEMA } },
    },
  }) as BatchRequest);

  const batchId = await submitBatch(requests);
  saveJson("repair-state.json", { fixBatch: batchId });
  saveJson("repair-targets.json", targets);
  await waitForBatch(batchId);

  const outcomes = await readBatch<Repair>(batchId);
  const repairs = targets.map((t) => ({ target: t, repair: outcomes.get(t.id)?.ok ? outcomes.get(t.id)!.parsed! : null }));
  saveJson("repair-drafts.json", repairs);
  const fixed = repairs.filter((r) => r.repair?.action === "fix").length;
  console.log(`${fixed} repaired, ${repairs.length - fixed} dropped or failed. Cost ≈ $${batchCostUSD([...outcomes.values()].map((o) => o.usage)).toFixed(2)}.`);
}

type Draft = { target: Target; repair: Repair | null };

async function verify() {
  const state = loadJson<{ fixBatch: string }>("repair-state.json");
  const drafts = loadJson<Draft[]>("repair-drafts.json").filter((d) => d.repair?.action === "fix");
  const batchId = await submitBatch(drafts.map((d) => reviewRequest(d.target.id, {
    section: d.target.bank === "math" ? "Math" : "Reading and Writing",
    skill: d.target.category, difficulty: d.target.difficulty,
    passage: d.repair!.passage.trim() || null, stem: d.repair!.stem,
    options: d.repair!.kind === "grid_in" ? null : d.repair!.choices,
  })));
  saveJson("repair-state.json", { ...state, verifyBatch: batchId });
  await waitForBatch(batchId);

  const outcomes = await readBatch<Review>(batchId);
  const verdicts: Record<string, Verdict> = {};
  for (const d of drafts) {
    const o = outcomes.get(d.target.id);
    verdicts[d.target.id] = judge(d.repair!.correct_answer, d.repair!.kind === "grid_in", o?.ok ? o.parsed : undefined);
  }
  saveJson("repair-verdicts.json", verdicts);
  const passed = Object.values(verdicts).filter((v) => v === "ok" || v === "minor").length;
  console.log(`${passed} of ${drafts.length} repairs passed the blind re-check. Cost ≈ $${batchCostUSD([...outcomes.values()].map((o) => o.usage)).toFixed(2)}.`);
}

function explanationFor(r: Repair): string {
  if (r.kind === "grid_in") return r.correct_explanation.trim();
  const key = r.correct_answer.trim().toUpperCase();
  const wrong = (["A", "B", "C", "D"] as const)
    .filter((l) => l !== key && r.wrong_explanations[l].trim())
    .map((l) => `${l}) ${r.wrong_explanations[l].trim()}`).join(" ");
  return `Correct answer: ${key}. ${r.correct_explanation.trim()} ${wrong}`.trim();
}

function apply() {
  const drafts = loadJson<Draft[]>("repair-drafts.json");
  const verdicts = loadJson<Record<string, Verdict>>("repair-verdicts.json");
  const overrides: Record<string, Override> = existsSync(OVERRIDES_PATH) ? JSON.parse(readFileSync(OVERRIDES_PATH, "utf8")) : {};

  let replaced = 0, removed = 0;
  for (const { target: t, repair: r } of drafts) {
    // R&W bank questions are always multiple choice, so a repair can't turn one into a grid-in.
    const passed = r?.action === "fix" && (verdicts[t.id] === "ok" || verdicts[t.id] === "minor")
      && !(t.bank === "english" && r.kind === "grid_in");
    if (passed) {
      const isGrid = r!.kind === "grid_in";
      overrides[t.originalKey] = {
        action: "replace", category: t.category, difficulty: t.difficulty,
        reason: `${t.why}: ${r!.change_note}`,
        question: {
          passage: r!.passage.trim() || null,
          stem: r!.stem.trim(),
          options: isGrid ? null : r!.choices,
          answer: isGrid ? null : (r!.correct_answer.trim().toUpperCase() as "A" | "B" | "C" | "D"),
          gridAnswer: isGrid ? r!.correct_answer.trim() : null,
          explanation: explanationFor(r!),
        },
      };
      replaced++;
    } else {
      overrides[t.originalKey] = {
        action: "remove", category: t.category, difficulty: t.difficulty,
        reason: `${t.why}: ${r ? (r.action === "drop" ? `unsalvageable — ${r.change_note}` : `repair failed blind re-check (${verdicts[t.id]})`) : "repair request failed"}`,
      };
      removed++;
    }
  }
  writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2) + "\n");
  console.log(`Wrote ${OVERRIDES_PATH}: ${replaced} replaced, ${removed} removed from rotation.`);
}

async function main() {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === "fix") await fix(arg);
  else if (cmd === "verify") await verify();
  else if (cmd === "apply") apply();
  else console.log("Usage: npx tsx scripts/repair-question-bank.ts fix [audit.json] | verify | apply");
}

main().catch((err) => { console.error(err); process.exit(1); });
