import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gradeGridAnswer } from "@/lib/grading";
import { tierAfterPracticeSet } from "@/lib/adaptive";
import { subcategoryForSkill } from "@/lib/categories";
import { recordSprintProgress } from "@/lib/server/sprints";
import type { Difficulty } from "@/lib/types";

interface AnswerRow {
  id: string;
  question_id: string;
  user_answer: "A" | "B" | "C" | "D" | null;
  user_grid_answer: string | null;
  question: {
    question_type: string;
    answer: "A" | "B" | "C" | "D" | null;
    grid_answer: string | null;
    difficulty: Difficulty;
    skill: string;
    subcategory: string | null;
  } | null;
}

/**
 * Grades a session server-side, so the answer key never has to reach the browser while the
 * student is still working. Writes `is_correct` on every answer; with `complete: true` it also
 * marks the session completed with its score (plan sessions leave that to finish-plan-day).
 */
export async function POST(req: NextRequest) {
  const { sessionId, complete } = await req.json() as { sessionId: string; complete?: boolean };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id, completed_at")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  if (session.completed_at) {
    return NextResponse.json({ error: "Session already submitted." }, { status: 409 });
  }

  const { data: answerRows, error: loadErr } = await supabase
    .from("answers")
    .select("id, question_id, user_answer, user_grid_answer, question:questions(question_type, answer, grid_answer, difficulty, skill, subcategory)")
    .eq("session_id", sessionId);

  if (loadErr || !answerRows) {
    return NextResponse.json({ error: "Could not load answers." }, { status: 500 });
  }

  // Unwrap a joined relation that Supabase may return as a one-element array.
  const rows = (answerRows as unknown as (AnswerRow & { question: AnswerRow["question"] | AnswerRow["question"][] })[])
    .map((r) => ({ ...r, question: Array.isArray(r.question) ? r.question[0] : r.question }));

  const graded = rows.map((r) => ({
    id: r.id,
    questionId: r.question_id,
    correct: !r.question
      ? false
      : r.question.question_type === "grid_in"
        ? gradeGridAnswer(r.user_grid_answer ?? "", r.question.grid_answer ?? "")
        : r.user_answer !== null && r.user_answer === r.question.answer,
  }));

  const results = await Promise.all(
    graded.map((g) => supabase.from("answers").update({ is_correct: g.correct }).eq("id", g.id))
  );
  const gradeErr = results.find((r) => r.error)?.error;
  if (gradeErr) {
    console.error("Supabase grade update error:", gradeErr);
    return NextResponse.json({ error: "Could not save your answers. Please try again." }, { status: 500 });
  }

  // Mistake notebook: a question leaves it the first time it's answered correctly again.
  const nowCorrect = graded.filter((g) => g.correct).map((g) => g.questionId);
  if (nowCorrect.length > 0) {
    const { error: nbErr } = await supabase
      .from("notebook_entries")
      .delete()
      .eq("user_id", user.id)
      .in("question_id", nowCorrect);
    if (nbErr) console.error("Supabase notebook cleanup error:", nbErr);
  }

  const correctCount = graded.filter((g) => g.correct).length;
  const score = graded.length > 0 ? Math.round((correctCount / graded.length) * 100) : 0;

  if (complete) {
    const { error: completeErr } = await supabase
      .from("sessions")
      .update({ completed_at: new Date().toISOString(), score })
      .eq("id", sessionId);
    if (completeErr) {
      return NextResponse.json({ error: "Could not finish session." }, { status: 500 });
    }

    // The quick start (the diagnostic) seeds a starting tier for every category it covered that
    // doesn't have one yet: 2/2 right → medium-high, 1/2 → medium-low, 0/2 → easy.
    if (user.user_metadata?.diagnostic_session_id === sessionId) {
      const perCategory = new Map<string, { right: number; total: number }>();
      rows.forEach((r, i) => {
        const sub = r.question && (r.question.subcategory ?? subcategoryForSkill(r.question.skill));
        if (!sub) return;
        const t = perCategory.get(sub) ?? { right: 0, total: 0 };
        t.total++;
        if (graded[i].correct) t.right++;
        perCategory.set(sub, t);
      });
      const { data: existing } = await supabase.from("category_progress").select("subcategory").eq("user_id", user.id);
      const have = new Set((existing ?? []).map((e) => e.subcategory as string));
      const seeds = [...perCategory.entries()]
        .filter(([sub]) => !have.has(sub))
        .map(([subcategory, t]) => ({
          user_id: user.id, subcategory, updated_at: new Date().toISOString(),
          difficulty: (t.right / t.total >= 1 ? "medium-high" : t.right > 0 ? "medium-low" : "easy") as Difficulty,
        }));
      if (seeds.length > 0) {
        const { error: seedErr } = await supabase.from("category_progress").insert(seeds);
        if (seedErr) console.error("Supabase tier seeding error:", seedErr);
      }
    }

    // A finished single-category practice set moves that category's tier (plan days do this in
    // finish-plan-day; mixed sets like the diagnostic don't map to one category).
    const subs = new Set(rows.map((r) => r.question && (r.question.subcategory ?? subcategoryForSkill(r.question.skill))));
    const [subcategory] = [...subs];
    if (subs.size === 1 && subcategory) {
      const tierCounts = new Map<Difficulty, number>();
      rows.forEach((r) => r.question && tierCounts.set(r.question.difficulty, (tierCounts.get(r.question.difficulty) ?? 0) + 1));
      const setTier = [...tierCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const { data: progress } = await supabase
        .from("category_progress").select("difficulty").eq("user_id", user.id).eq("subcategory", subcategory).maybeSingle();
      const tier = tierAfterPracticeSet((progress?.difficulty as Difficulty | undefined) ?? null, setTier, score);
      const { error: tierErr } = await supabase.from("category_progress").upsert(
        { user_id: user.id, subcategory, difficulty: tier, updated_at: new Date().toISOString() },
        { onConflict: "user_id,subcategory" },
      );
      if (tierErr) console.error("Supabase category_progress update error:", tierErr);
    }
  }

  // A short sprint's day is done when its set is; the last day completes the sprint.
  const sprintCompleted = complete ? await recordSprintProgress(supabase, sessionId, score) : null;

  return NextResponse.json({ score, sprintCompleted });
}
