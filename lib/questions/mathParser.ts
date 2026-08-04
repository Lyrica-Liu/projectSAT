import { readFileSync } from "fs";
import { join } from "path";
import type { Difficulty, MathSkill } from "@/lib/types";

export interface MathBankQuestion {
  questionType: "multiple_choice" | "grid_in";
  category: string; // "Algebra" | "Data Analysis" | "Geometry"
  skill: MathSkill;
  difficulty: Difficulty;
  passage: string | null; // table markdown, if any
  stem: string;
  options: { A: string; B: string; C: string; D: string } | null;
  answer: "A" | "B" | "C" | "D" | null;
  gridAnswer: string | null;
  explanation: string;
  domain: "math";
}

// category -> difficulty -> questions
export type MathBank = Record<string, Record<string, MathBankQuestion[]>>;

const CATEGORY_TO_SKILL: Record<string, MathSkill> = {
  "Algebra": "algebra",
  "Data Analysis": "data_analysis",
  "Geometry": "geometry",
};

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  "EASY": "easy",
  "MEDIUM-LOW": "medium-low",
  "MEDIUM-HIGH": "medium-high",
  "HIGH": "hard",
};

function titleCase(s: string): string {
  return s.trim().split(/\s+/).map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

/** Cuts off a trailing "====" separator/trailer line, if the capture ran into one. */
function stripTrailingSeparator(s: string): string {
  return s.split(/\n[ \t]*={10,}/)[0].trim();
}

/** Splits an embedded "Table: ..." markdown block out of a prompt, if present. */
function splitTable(raw: string): { passage: string | null; stem: string } {
  const tableIdx = raw.indexOf("Table:");
  if (tableIdx === -1) {
    return { passage: null, stem: raw.replace(/\s+/g, " ").trim() };
  }
  const before = raw.slice(0, tableIdx).trim();
  const fromTable = raw.slice(tableIdx);
  const blankMatch = fromTable.match(/\n[ \t]*\n/);
  const tableBlock = (blankMatch && blankMatch.index !== undefined ? fromTable.slice(0, blankMatch.index) : fromTable).trim();
  const after = (blankMatch && blankMatch.index !== undefined ? fromTable.slice(blankMatch.index) : "").trim();
  const stem = [before, after].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  return { passage: tableBlock, stem };
}

function parseOptions(block: string): { A: string; B: string; C: string; D: string } {
  const opts = { A: "", B: "", C: "", D: "" };
  const pattern = /^([A-D])\)\s*(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(block)) !== null) {
    opts[m[1] as "A" | "B" | "C" | "D"] = m[2].trim();
  }
  return opts;
}

function parseLetterExplanations(block: string): Partial<Record<"A" | "B" | "C" | "D", string>> {
  const out: Partial<Record<"A" | "B" | "C" | "D", string>> = {};
  const pattern = /^([A-D])\)\s*(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(block)) !== null) {
    out[m[1] as "A" | "B" | "C" | "D"] = m[2].trim();
  }
  return out;
}

function parseMultipleChoice(block: string, category: string, skill: MathSkill, difficulty: Difficulty): MathBankQuestion | null {
  const promptM = block.match(/Prompt:\s*([\s\S]*?)\n[ \t]*A\)/);
  if (!promptM) return null;
  const { passage, stem } = splitTable(promptM[1]);

  const optionsM = block.match(/\n[ \t]*A\)[\s\S]*?(?=\n[ \t]*Correct Answer:)/);
  if (!optionsM) return null;
  const options = parseOptions(optionsM[0]);

  const answerM = block.match(/Correct Answer:\s*([A-D])/);
  if (!answerM) return null;
  const answer = answerM[1] as "A" | "B" | "C" | "D";

  const correctExplM = block.match(/Correct Answer Explanation:\s*([\s\S]*?)(?=\n[ \t]*False Answer Explanations:|$)/);
  const correctExpl = correctExplM ? stripTrailingSeparator(correctExplM[1]) : "";

  const falseExplM = block.match(/False Answer Explanations:\s*([\s\S]*)$/);
  const falseExpl = falseExplM ? parseLetterExplanations(stripTrailingSeparator(falseExplM[1])) : {};
  const falseText = (["A", "B", "C", "D"] as const)
    .filter((l) => l !== answer && falseExpl[l])
    .map((l) => `${l}) ${falseExpl[l]}`)
    .join(" ");

  const explanation = `Correct answer: ${answer}. ${correctExpl} ${falseText}`.trim();

  if (!stem || !options.A) return null;

  return { questionType: "multiple_choice", category, skill, difficulty, passage, stem, options, answer, gridAnswer: null, explanation, domain: "math" };
}

function parseGridIn(block: string, category: string, skill: MathSkill, difficulty: Difficulty): MathBankQuestion | null {
  const promptM = block.match(/Prompt:\s*([\s\S]*?)\n[ \t]*\n[ \t]*Correct Answer:/);
  if (!promptM) return null;
  const { passage, stem } = splitTable(promptM[1]);

  const answerM = block.match(/Correct Answer:\s*(.+)/);
  if (!answerM) return null;
  const gridAnswer = answerM[1].trim();

  const explM = block.match(/Explanation:\s*([\s\S]*)$/);
  const explanation = explM ? stripTrailingSeparator(explM[1]) : "";

  if (!stem || !gridAnswer) return null;

  return { questionType: "grid_in", category, skill, difficulty, passage, stem, options: null, answer: null, gridAnswer, explanation, domain: "math" };
}

function buildBank(): MathBank {
  const filePath = join(process.cwd(), "lib/questions/dsat_math_question_bank.txt");
  const content = readFileSync(filePath, "utf-8");

  const bank: MathBank = {};

  const catRegex = /CATEGORY:\s*([A-Za-z ]+?)\s*\|\s*DIFFICULTY:\s*([A-Z-]+)/g;
  const catMatches: { category: string; difficulty: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = catRegex.exec(content)) !== null) {
    catMatches.push({ category: titleCase(m[1]), difficulty: m[2], index: m.index });
  }

  for (let ci = 0; ci < catMatches.length; ci++) {
    const { category, difficulty: diffKey, index: start } = catMatches[ci];
    const end = ci + 1 < catMatches.length ? catMatches[ci + 1].index : content.length;
    const block = content.slice(start, end);
    const difficulty = DIFFICULTY_MAP[diffKey];
    const skill = CATEGORY_TO_SKILL[category];
    if (!difficulty || !skill) continue;

    const qRegex = /QUESTION\s+\d+\s*\|\s*[^|]+\|\s*[A-Z-]+\s*\|\s*(Multiple Choice|Grid-In)/g;
    const qPositions: { index: number; type: "multiple_choice" | "grid_in" }[] = [];
    let qm: RegExpExecArray | null;
    while ((qm = qRegex.exec(block)) !== null) {
      qPositions.push({ index: qm.index, type: qm[1] === "Grid-In" ? "grid_in" : "multiple_choice" });
    }

    const questions: MathBankQuestion[] = [];
    for (let qi = 0; qi < qPositions.length; qi++) {
      const qStart = qPositions[qi].index;
      const qEnd = qi + 1 < qPositions.length ? qPositions[qi + 1].index : block.length;
      const qBlock = block.slice(qStart, qEnd);
      const q = qPositions[qi].type === "grid_in"
        ? parseGridIn(qBlock, category, skill, difficulty)
        : parseMultipleChoice(qBlock, category, skill, difficulty);
      if (q) questions.push(q);
    }

    if (!bank[category]) bank[category] = {};
    bank[category][difficulty] = questions;
  }

  return bank;
}

let _bank: MathBank | null = null;

export function getMathQuestionBank(): MathBank {
  if (!_bank) _bank = buildBank();
  return _bank;
}

export function getMathBankQuestions(category: string, difficulty: Difficulty): MathBankQuestion[] {
  const bank = getMathQuestionBank();
  return bank[category]?.[difficulty] ?? [];
}
