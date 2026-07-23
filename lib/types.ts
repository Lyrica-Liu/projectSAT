export type QuestionDomain = "reading" | "writing";

export type QuestionSkill =
  | "central_idea"
  | "command_of_evidence"
  | "inferences"
  | "words_in_context"
  | "cross_text_connections"
  | "text_structure"
  | "boundaries"
  | "form_structure_sense"
  | "transitions"
  | "rhetorical_synthesis";

export type Difficulty = "easy" | "medium-low" | "medium-high" | "hard";

export type QuestionStatus = "unanswered" | "answered" | "skipped";

export interface Question {
  id: string;
  domain: QuestionDomain;
  skill: QuestionSkill;
  difficulty: Difficulty;
  passage?: string;
  stem: string;
  options: { A: string; B: string; C: string; D: string };
  answer: "A" | "B" | "C" | "D";
  explanation: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  question_count: number;
  score: number | null;
  domain_filter: QuestionDomain | "both";
  feedback_text: string | null;
}

export interface Answer {
  id: string;
  session_id: string;
  question_id: string;
  user_answer: "A" | "B" | "C" | "D" | null;
  is_correct: boolean | null;
  time_spent_seconds: number | null;
  position: number;
  question?: Question;
}

export interface SessionWithAnswers extends Session {
  answers: (Answer & { question: Question })[];
}

export interface SkillStat {
  skill: QuestionSkill;
  total: number;
  correct: number;
  accuracy: number;
}

export interface PlanDayRow {
  id: string;
  user_id: string;
  day_number: number;
  session_id: string | null;
  score: number | null;
  completed_at: string | null;
  started_at: string;
  subcategory: string | null;
  difficulty: Difficulty | null;
}

export interface CategoryProgressRow {
  id: string;
  user_id: string;
  subcategory: string;
  difficulty: Difficulty;
  updated_at: string;
}
