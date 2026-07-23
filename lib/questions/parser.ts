import { readFileSync } from "fs";
import { join } from "path";
import type { QuestionSkill, Difficulty } from "@/lib/types";

export interface BankQuestion {
  passage: string | null;
  stem: string;
  options: { A: string; B: string; C: string; D: string };
  answer: "A" | "B" | "C" | "D";
  explanation: string;
  skill: QuestionSkill;
  difficulty: Difficulty;
  domain: "reading" | "writing";
}

// Keyed by subcategory display name (matches planDay.subcategory) → difficulty → questions
export type QuestionBank = Record<string, Record<string, BankQuestion[]>>;

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

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  "LOW":         "easy",
  "MEDIUM-LOW":  "medium-low",
  "MEDIUM-HIGH": "medium-high",
  "HIGH":        "hard",
};

function parseOptions(block: string): { A: string; B: string; C: string; D: string } {
  const opts: { A: string; B: string; C: string; D: string } = { A: "", B: "", C: "", D: "" };
  // Match each lettered option, capturing everything until the next option letter or end
  const pattern = /([A-D])\)\s*([\s\S]*?)(?=\n\s*[A-D]\)|$)/g;
  let m;
  while ((m = pattern.exec(block)) !== null) {
    const letter = m[1] as "A" | "B" | "C" | "D";
    opts[letter] = m[2].replace(/\s+/g, " ").trim();
  }
  return opts;
}

function parseQuestion(block: string, subcategory: string, difficulty: Difficulty): BankQuestion | null {
  const skill = SUBCATEGORY_TO_SKILL[subcategory];
  const domain = SUBCATEGORY_TO_DOMAIN[subcategory];
  if (!skill || !domain) return null;

  // Passage (optional — some questions have no passage)
  const passageM = block.match(/Passage:\s*\n([\s\S]*?)(?=\n\s*Prompt:)/);
  const passage = passageM ? passageM[1].replace(/\n\s*/g, "\n").trim() || null : null;

  // Prompt / stem
  const promptM = block.match(/Prompt:\s*\n([\s\S]*?)(?=\n\s*Options:)/);
  if (!promptM) return null;
  const stem = promptM[1].replace(/\s+/g, " ").trim();

  // Options
  const optionsM = block.match(/Options:\s*\n([\s\S]*?)(?=\n\s*Correct Answer:)/);
  if (!optionsM) return null;
  const options = parseOptions(optionsM[1]);

  // Correct answer
  const answerM = block.match(/Correct Answer:\s*([A-D])/);
  if (!answerM) return null;
  const answer = answerM[1] as "A" | "B" | "C" | "D";

  // False answer explanations → use as explanation field
  const explM = block.match(/False Answer Explanations:\s*\n([\s\S]*?)(?=\n\s*-{10,}|$)/);
  const rawExpl = explM ? explM[1].trim() : "";
  // Format: "Correct: B. [false answer notes]"
  const explanation = `Correct answer: ${answer}. ${rawExpl.replace(/^\s*\*\s*/gm, "").replace(/\n+/g, " ").trim()}`;

  if (!stem || !answer || !options.A) return null;

  return { passage, stem, options, answer, explanation, skill, difficulty, domain };
}

function buildBank(): QuestionBank {
  const filePath = join(process.cwd(), "lib/questions/english_question_bank.txt");
  const content = readFileSync(filePath, "utf-8");

  const bank: QuestionBank = {};

  // Find all skill section starts
  const skillRegex = /^\s*•\s+(.+)$/gm;
  const skillMatches: { name: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = skillRegex.exec(content)) !== null) {
    const name = m[1].trim();
    if (SUBCATEGORY_TO_SKILL[name]) {
      skillMatches.push({ name, index: m.index });
    }
  }

  for (let si = 0; si < skillMatches.length; si++) {
    const { name: subcategory, index: skillStart } = skillMatches[si];
    const skillEnd = si + 1 < skillMatches.length ? skillMatches[si + 1].index : content.length;
    const skillBlock = content.slice(skillStart, skillEnd);

    // Find difficulty sections within this skill block
    const diffRegex = /\[DIFFICULTY LEVEL:\s*([A-Z\-]+)\s*-\s*QUESTIONS\s*\d+-\d+\]/g;
    const diffMatches: { diff: string; index: number }[] = [];
    let dm: RegExpExecArray | null;
    while ((dm = diffRegex.exec(skillBlock)) !== null) {
      const d = DIFFICULTY_MAP[dm[1]];
      if (d) diffMatches.push({ diff: d, index: dm.index });
    }

    for (let di = 0; di < diffMatches.length; di++) {
      const { diff, index: dStart } = diffMatches[di];
      const dEnd = di + 1 < diffMatches.length ? diffMatches[di + 1].index : skillBlock.length;
      const diffBlock = skillBlock.slice(dStart, dEnd);

      // Split into individual question blocks on "QUESTION N" headers
      const qRegex = /QUESTION\s+\d+/g;
      const qPositions: number[] = [];
      let qm: RegExpExecArray | null;
      while ((qm = qRegex.exec(diffBlock)) !== null) {
        qPositions.push(qm.index);
      }

      const questions: BankQuestion[] = [];
      for (let qi = 0; qi < qPositions.length; qi++) {
        const qStart = qPositions[qi];
        const qEnd = qi + 1 < qPositions.length ? qPositions[qi + 1] : diffBlock.length;
        const qBlock = diffBlock.slice(qStart, qEnd);
        const q = parseQuestion(qBlock, subcategory, diff as Difficulty);
        if (q) questions.push(q);
      }

      if (!bank[subcategory]) bank[subcategory] = {};
      bank[subcategory][diff] = questions;
    }
  }

  return bank;
}

// Parse once at module load — this runs server-side only
let _bank: QuestionBank | null = null;

export function getQuestionBank(): QuestionBank {
  if (!_bank) _bank = buildBank();
  return _bank;
}

export function getBankQuestions(subcategory: string, difficulty: Difficulty): BankQuestion[] {
  const bank = getQuestionBank();
  return bank[subcategory]?.[difficulty] ?? [];
}
