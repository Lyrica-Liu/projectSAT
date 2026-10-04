/**
 * Checks every question in both banks with a blind Claude review and writes a report of the
 * ones that look broken (wrong key, more than one defensible answer, unclear, formatting).
 * Nothing in the bank is changed — the report is for a human to act on.
 *
 * Usage:
 *   npx tsx scripts/audit-question-bank.ts submit [--sample N]   # sends a batch (half price)
 *   npx tsx scripts/audit-question-bank.ts collect                # waits, then writes the report
 *
 * The report lands in reports/question-audit/. Batch state lives in scripts/.bank-ai/.
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { getQuestionBank } from "../lib/questions/parser";
import { getMathQuestionBank } from "../lib/questions/mathParser";
import {
  submitBatch, waitForBatch, readBatch, reviewRequest, judge, batchCostUSD, saveJson, loadJson,
  type ReviewItem, type Review, type Verdict,
} from "./lib/bank-ai";

interface ManifestEntry extends ReviewItem {
  id: string;
  bank: "english" | "math";
  category: string;
  /** Position within its (category, difficulty) cell, 1-based — how to find it in the bank file. */
  position: number;
  key: string;
  explanation: string;
}

function buildManifest(): ManifestEntry[] {
  const entries: ManifestEntry[] = [];
  let n = 0;
  const nextId = () => `q${String(++n).padStart(5, "0")}`;

  for (const [category, tiers] of Object.entries(getQuestionBank())) {
    for (const [difficulty, qs] of Object.entries(tiers)) {
      qs.forEach((q, i) => entries.push({
        id: nextId(), bank: "english", category, position: i + 1,
        section: "Reading and Writing", skill: category, difficulty,
        passage: q.passage, stem: q.stem, options: q.options, key: q.answer, explanation: q.explanation,
      }));
    }
  }
  for (const [category, tiers] of Object.entries(getMathQuestionBank())) {
    for (const [difficulty, qs] of Object.entries(tiers)) {
      qs.forEach((q, i) => entries.push({
        id: nextId(), bank: "math", category, position: i + 1,
        section: "Math", skill: category, difficulty,
        passage: q.passage, stem: q.stem, options: q.options,
        key: q.questionType === "grid_in" ? (q.gridAnswer ?? "") : (q.answer ?? ""), explanation: q.explanation,
      }));
    }
  }
  return entries;
}

async function submit(sampleSize: number | null) {
  let manifest = buildManifest();
  if (sampleSize) {
    manifest = manifest.slice().sort(() => Math.random() - 0.5).slice(0, sampleSize);
  }
  const batchId = await submitBatch(manifest.map((m) => reviewRequest(m.id, m)));
  saveJson("audit-state.json", { batchId, sample: !!sampleSize, submittedAt: new Date().toISOString() });
  saveJson("audit-manifest.json", manifest);
  console.log(`Run "collect" when you're ready — it will wait for the batch to finish.`);
}

async function collect() {
  const { batchId, sample } = loadJson<{ batchId: string; sample: boolean }>("audit-state.json");
  const manifest = loadJson<ManifestEntry[]>("audit-manifest.json");
  await waitForBatch(batchId);
  const outcomes = await readBatch<Review>(batchId);

  const rows = manifest.map((m) => {
    const o = outcomes.get(m.id);
    const review = o?.ok ? o.parsed : undefined;
    const verdict: Verdict = judge(m.key, m.options === null, review);
    return { ...m, verdict, review, failure: o?.failure ?? null };
  });

  const cost = batchCostUSD([...outcomes.values()].map((o) => o.usage));
  const counts = rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.verdict]: (acc[r.verdict] ?? 0) + 1 }), {});

  const dir = join(process.cwd(), "reports/question-audit");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10) + (sample ? "-sample" : "");
  writeFileSync(join(dir, `${stamp}.json`), JSON.stringify(rows, null, 2));

  const order: Verdict[] = ["wrong_key", "ambiguous", "needs_manual_review", "minor"];
  const lines: string[] = [
    `# Question bank audit — ${stamp}`,
    "",
    `Reviewed ${rows.length} questions blind with Claude Opus 5 (the reviewer never saw the answer key).`,
    "",
    `| Verdict | Count |`, `|---|---|`,
    ...["ok", ...order].map((v) => `| ${v} | ${counts[v] ?? 0} |`),
    "",
    `Batch cost: about $${cost.toFixed(2)} (${rows.length} questions, so about $${(cost / Math.max(rows.length, 1)).toFixed(4)} each).`,
    "",
  ];
  for (const v of order) {
    const flagged = rows.filter((r) => r.verdict === v);
    if (flagged.length === 0) continue;
    lines.push(`## ${v} (${flagged.length})`, "");
    for (const r of flagged) {
      lines.push(`### ${r.bank === "math" ? "Math" : "R&W"} · ${r.category} · ${r.difficulty} · #${r.position} (${r.id})`);
      if (r.passage) lines.push("", `> ${r.passage.replace(/\n/g, "\n> ")}`);
      lines.push("", `**Q:** ${r.stem}`);
      if (r.options) lines.push("", ...(["A", "B", "C", "D"] as const).map((l) => `- ${l}) ${r.options![l]}`));
      lines.push("", `**Key:** ${r.key} · **Reviewer:** ${r.review?.answer ?? "—"} (${r.review?.confidence ?? r.failure})`);
      for (const d of r.review?.other_defensible_choices ?? []) lines.push(`- Also defensible: **${d.choice}** — ${d.reason}`);
      for (const p of r.review?.problems ?? []) lines.push(`- ${p.kind}: ${p.detail}`);
      lines.push("");
    }
  }
  writeFileSync(join(dir, `${stamp}.md`), lines.join("\n"));
  console.log(counts);
  console.log(`Cost ≈ $${cost.toFixed(2)}. Report: reports/question-audit/${stamp}.md`);
}

async function main() {
  const [cmd, flag, val] = process.argv.slice(2);
  if (cmd === "submit") await submit(flag === "--sample" ? Number(val) : null);
  else if (cmd === "collect") await collect();
  else console.log("Usage: npx tsx scripts/audit-question-bank.ts submit [--sample N] | collect");
}

main().catch((err) => { console.error(err); process.exit(1); });
