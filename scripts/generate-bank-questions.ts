/**
 * Bulk-generates additional SAT R&W questions using SAT_GENERATOR_PROMPT
 * (lib/prompts/sat-generator.ts) and inserts them into
 * lib/questions/english_question_bank.txt, appended to the existing
 * questions for each (subcategory, difficulty) pair.
 *
 * Usage:
 *   npx tsx scripts/generate-bank-questions.ts "<Subcategory Name>" [count] [tier]
 *
 * Examples:
 *   npx tsx scripts/generate-bank-questions.ts "Central Ideas and Details" 20
 *   npx tsx scripts/generate-bank-questions.ts "Cross-Text Connections" 20 HIGH
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { SAT_GENERATOR_PROMPT } from "../lib/prompts/sat-generator";

process.loadEnvFile(join(process.cwd(), ".env.local"));

const BANK_PATH = join(process.cwd(), "lib/questions/english_question_bank.txt");
const TIERS = ["LOW", "MEDIUM-LOW", "MEDIUM-HIGH", "HIGH"];
const SEPARATOR = "-".repeat(67);

const CATEGORY_OF: Record<string, string> = {
  "Central Ideas and Details": "Information and Ideas",
  "Command of Evidence (Textual)": "Information and Ideas",
  "Command of Evidence (Quantitative)": "Information and Ideas",
  "Inferences": "Information and Ideas",
  "Words in Context": "Craft and Structure",
  "Text Structure and Purpose": "Craft and Structure",
  "Cross-Text Connections": "Craft and Structure",
  "Transitions": "Expression of Ideas",
  "Rhetorical Synthesis": "Expression of Ideas",
  "Boundaries": "Standard English Conventions",
  "Form, Structure, and Sense": "Standard English Conventions",
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface BlockLocation {
  skillStart: number;
  diffBlockEndAbs: number;
  rangeStart: number;
  rangeEnd: number;
  headerText: string;
}

function locateBlock(content: string, subcategory: string, difficulty: string): BlockLocation {
  const skillHeaderRegex = new RegExp(`^[ \\t]*•\\s+${escapeRegex(subcategory)}\\s*$`, "m");
  const skillMatch = skillHeaderRegex.exec(content);
  if (!skillMatch) throw new Error(`Could not find skill header for "${subcategory}"`);
  const skillStart = skillMatch.index;

  // Only match known subcategory headers here — Rhetorical Synthesis questions
  // embed their own "• <note>" bullet lines (synthesis notes), which a generic
  // "any bulleted line" regex would mistake for the start of the next skill
  // section, truncating the block before later difficulty tiers.
  const otherSubcategories = Object.keys(CATEGORY_OF).filter((s) => s !== subcategory);
  const nextSkillRegex = new RegExp(`^[ \\t]*•\\s+(?:${otherSubcategories.map(escapeRegex).join("|")})\\s*$`, "gm");
  nextSkillRegex.lastIndex = skillStart + skillMatch[0].length;
  const nextSkillMatch = nextSkillRegex.exec(content);
  const skillEnd = nextSkillMatch ? nextSkillMatch.index : content.length;
  const skillBlock = content.slice(skillStart, skillEnd);

  const diffHeaderRegex = new RegExp(`\\[DIFFICULTY LEVEL:\\s*${difficulty}\\s*-\\s*QUESTIONS\\s*(\\d+)-(\\d+)\\]`);
  const diffMatch = diffHeaderRegex.exec(skillBlock);
  if (!diffMatch) throw new Error(`Could not find difficulty header ${difficulty} for "${subcategory}"`);

  // Bound the block by whichever comes first: the next difficulty header, or a
  // stray "====" editorial marker line (a few of these sit between sections in
  // the file, e.g. "[REMAINING TARGETS...]" / "[STATUS: ...]" notes) — without
  // this, HIGH-tier insertions at a skill/file boundary would land after them.
  const nextBoundaryRegex = /\[DIFFICULTY LEVEL:|^={10,}$/gm;
  nextBoundaryRegex.lastIndex = diffMatch.index + diffMatch[0].length;
  const nextBoundaryMatch = nextBoundaryRegex.exec(skillBlock);
  const diffBlockEndInSkill = nextBoundaryMatch ? nextBoundaryMatch.index : skillBlock.length;

  return {
    skillStart,
    diffBlockEndAbs: skillStart + diffBlockEndInSkill,
    rangeStart: parseInt(diffMatch[1], 10),
    rangeEnd: parseInt(diffMatch[2], 10),
    headerText: diffMatch[0],
  };
}

async function generateBatch(subcategory: string, difficulty: string, count: number, startNumber: number): Promise<string> {
  const category = CATEGORY_OF[subcategory];
  if (!category) throw new Error(`Unknown subcategory "${subcategory}"`);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMessage = `category: ${category}
subcategory: ${subcategory}
difficulty: ${difficulty}
count: ${count}
format: text

Additional strict formatting requirements for this output (required by the file this gets inserted into, on top of the format spec above):
- Prefix each question with a line "QUESTION <n>" where <n> starts at ${startNumber} and increments by 1 per question, so the ${count} questions are numbered ${startNumber} through ${startNumber + count - 1}.
- Separate each question block from the next with a line of exactly 67 dashes: ${SEPARATOR}
- Output ONLY the ${count} question blocks in the exact field format described in the system prompt for this subcategory (Passage/Prompt/Options/Correct Answer/etc.), each preceded by its QUESTION line. No preamble, no commentary, no markdown code fences.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system: SAT_GENERATOR_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text.trim() : "";
}

function validateBatch(text: string, expectedCount: number, subcategory: string, difficulty: string): string[] {
  const qPositions: number[] = [];
  const qRegex = /QUESTION\s+\d+/g;
  let m: RegExpExecArray | null;
  while ((m = qRegex.exec(text)) !== null) qPositions.push(m.index);

  if (qPositions.length !== expectedCount) {
    throw new Error(`${subcategory} / ${difficulty}: expected ${expectedCount} questions, model returned ${qPositions.length}`);
  }

  const blocks: string[] = [];
  for (let i = 0; i < qPositions.length; i++) {
    const start = qPositions[i];
    const end = i + 1 < qPositions.length ? qPositions[i + 1] : text.length;
    const block = text.slice(start, end).trim();

    if (!/Prompt:/.test(block)) throw new Error(`${subcategory} / ${difficulty}: block ${i + 1} missing "Prompt:"`);
    if (!/Correct Answer:\s*[A-D]/.test(block)) throw new Error(`${subcategory} / ${difficulty}: block ${i + 1} missing/invalid "Correct Answer:"`);
    const optionCount = (["A", "B", "C", "D"] as const).filter((l) => new RegExp(`^${l}\\)`, "m").test(block)).length;
    if (optionCount !== 4) throw new Error(`${subcategory} / ${difficulty}: block ${i + 1} has ${optionCount}/4 options`);
    if (!/False Answer Explanations:/.test(block)) throw new Error(`${subcategory} / ${difficulty}: block ${i + 1} missing "False Answer Explanations:"`);

    blocks.push(block);
  }
  return blocks;
}

function insertIntoBank(subcategory: string, difficulty: string, newBlocks: string[]): void {
  const content = readFileSync(BANK_PATH, "utf-8");
  const loc = locateBlock(content, subcategory, difficulty);

  const before = content.slice(0, loc.diffBlockEndAbs).replace(/[ \t]*\n?$/, "\n\n");
  const after = content.slice(loc.diffBlockEndAbs);
  const insertion = newBlocks.map((b) => `${b}\n\n${SEPARATOR}\n\n`).join("");

  const newRangeEnd = loc.rangeEnd + newBlocks.length;
  const newHeaderText = `[DIFFICULTY LEVEL: ${difficulty} - QUESTIONS ${loc.rangeStart}-${newRangeEnd}]`;

  const combined = before + insertion + after;
  const updated = combined.slice(0, loc.skillStart) + combined.slice(loc.skillStart).replace(loc.headerText, newHeaderText);

  writeFileSync(BANK_PATH, updated, "utf-8");
}

function currentCount(subcategory: string, difficulty: string): number {
  const content = readFileSync(BANK_PATH, "utf-8");
  const loc = locateBlock(content, subcategory, difficulty);
  return loc.rangeEnd - loc.rangeStart + 1;
}

const MAX_CHUNK = 10;

/** Generates one chunk, retrying once (at half size) if the model miscounts. */
async function generateChunk(subcategory: string, tier: string, count: number, startNumber: number): Promise<string[]> {
  try {
    const raw = await generateBatch(subcategory, tier, count, startNumber);
    return validateBatch(raw, count, subcategory, tier);
  } catch (err) {
    if (count <= 5) throw err;
    console.log(`[${subcategory} / ${tier}] batch of ${count} failed (${err instanceof Error ? err.message : err}), retrying as two smaller batches...`);
    const half = Math.ceil(count / 2);
    const first = await generateChunk(subcategory, tier, half, startNumber);
    const second = await generateChunk(subcategory, tier, count - half, startNumber + half);
    return [...first, ...second];
  }
}

async function run(subcategory: string, countPerTier: number, onlyTier?: string) {
  const tiers = onlyTier ? [onlyTier] : TIERS;
  for (const tier of tiers) {
    let remaining = countPerTier;
    while (remaining > 0) {
      const chunkSize = Math.min(MAX_CHUNK, remaining);
      const existing = currentCount(subcategory, tier);
      const startNumber = existing + 1;
      console.log(`[${subcategory} / ${tier}] generating ${chunkSize} questions (numbered ${startNumber}-${startNumber + chunkSize - 1})...`);
      const blocks = await generateChunk(subcategory, tier, chunkSize, startNumber);
      insertIntoBank(subcategory, tier, blocks);
      console.log(`[${subcategory} / ${tier}] inserted ${blocks.length}. New total: ${currentCount(subcategory, tier)}.`);
      remaining -= chunkSize;
    }
  }
}

const subcategoryArg = process.argv[2];
const countArg = parseInt(process.argv[3] ?? "20", 10);
const tierArg = process.argv[4];

if (!subcategoryArg) {
  console.error('Usage: npx tsx scripts/generate-bank-questions.ts "<Subcategory Name>" [countPerTier] [tier]');
  process.exit(1);
}
if (tierArg && !TIERS.includes(tierArg)) {
  console.error(`Unknown tier "${tierArg}". Expected one of: ${TIERS.join(", ")}`);
  process.exit(1);
}

run(subcategoryArg, countArg, tierArg).catch((err) => {
  console.error("FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
