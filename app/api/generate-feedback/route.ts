import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

const SKILL_LABELS: Record<string, string> = {
  central_idea: "Central Ideas & Details",
  command_of_evidence: "Command of Evidence",
  inferences: "Inferences",
  words_in_context: "Words in Context",
  cross_text_connections: "Cross-Text Connections",
  text_structure: "Text Structure & Purpose",
  boundaries: "Boundaries",
  form_structure_sense: "Form, Structure & Sense",
  transitions: "Transitions",
  rhetorical_synthesis: "Rhetorical Synthesis",
};

const SYSTEM_PROMPT = `You are a warm, encouraging SAT tutor writing a short feedback note after a student finishes a practice session.

Write 2-4 sentences, second person ("you"). Name one specific thing they did well (reference an actual skill or question), name one specific pattern in what they missed, and give one concrete, actionable tip for next time. Warm and encouraging, never harsh or generic. No greeting, no sign-off, no markdown — plain prose only.`;

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json() as { sessionId: string };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id, score, feedback_text, completed_at")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!session || !session.completed_at) {
    return NextResponse.json({ error: "Session not found or not completed." }, { status: 400 });
  }

  if (session.feedback_text) {
    return NextResponse.json({ feedback_text: session.feedback_text });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set." }, { status: 500 });
  }

  const { data: answerRows } = await supabase
    .from("answers")
    .select("is_correct, user_answer, question:questions(skill, stem, answer, explanation)")
    .eq("session_id", sessionId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (answerRows ?? []) as any[];
  const skillTally: Record<string, { correct: number; total: number }> = {};
  const misses: { stem: string; skill: string; explanation: string }[] = [];

  rows.forEach((row) => {
    const q = Array.isArray(row.question) ? row.question[0] : row.question;
    if (!q) return;
    const label = SKILL_LABELS[q.skill] ?? q.skill;
    if (!skillTally[label]) skillTally[label] = { correct: 0, total: 0 };
    skillTally[label].total++;
    if (row.is_correct) skillTally[label].correct++;
    else misses.push({ stem: q.stem, skill: label, explanation: q.explanation });
  });

  const skillSummary = Object.entries(skillTally)
    .map(([label, { correct, total }]) => `${label}: ${correct}/${total}`)
    .join("; ");
  const missSummary = misses.slice(0, 4)
    .map((m) => `- [${m.skill}] "${m.stem}" — why the right answer is right: ${m.explanation}`)
    .join("\n");

  const userMessage = `Session score: ${session.score ?? "unknown"}%\n\nAccuracy by skill: ${skillSummary || "no breakdown available"}\n\nMissed questions:\n${missSummary || "none — a clean sweep"}`;

  let feedbackText: string;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    feedbackText = response.content[0].type === "text" ? response.content[0].text.trim() : "";
  } catch (err) {
    console.error("Anthropic API error:", err);
    return NextResponse.json({ error: "Failed to generate feedback." }, { status: 502 });
  }

  if (!feedbackText) {
    return NextResponse.json({ error: "Empty feedback returned." }, { status: 502 });
  }

  await supabase.from("sessions").update({ feedback_text: feedbackText }).eq("id", sessionId);

  return NextResponse.json({ feedback_text: feedbackText });
}
