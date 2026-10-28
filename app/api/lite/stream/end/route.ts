import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadSessionCards } from "@/lib/server/lite-stream";
import { tierAfterPracticeSet } from "@/lib/adaptive";
import { TIER_UPDATE_MIN_CARDS } from "@/lib/lite/stream";
import type { Difficulty } from "@/lib/types";

/**
 * The student stopped a stream: drops the unanswered card, moves the stored tier of every
 * category practiced enough (the same rule as a website set), and returns the recap.
 * Body: { sessionId }. Safe to call twice; tiers only move the first time.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { sessionId } = await req.json() as { sessionId: string };
  const loaded = await loadSessionCards(supabase, sessionId);
  if (!loaded || loaded.session.kind !== "stream" || !loaded.session.stream_plan) {
    return NextResponse.json({ error: "Stream not found." }, { status: 404 });
  }
  const { session, cards } = loaded;
  const plan = session.stream_plan!;

  const unanswered = cards.filter((c) => !c.result);
  if (unanswered.length > 0) {
    await supabase.from("answers").delete().in("id", unanswered.map((c) => c.answerId));
  }
  const answered = cards.filter((c) => c.result);
  if (answered.length === 0) {
    // Started and left without answering: nothing worth keeping.
    await supabase.from("sessions").delete().eq("id", sessionId);
    return NextResponse.json({ answered: 0, correct: 0, mistakesFixed: 0, bySkill: [] });
  }

  const bySkill = new Map<string, { answered: number; correct: number; tiers: Map<Difficulty, number> }>();
  for (const c of answered) {
    if (c.mistake) continue;
    const s = bySkill.get(c.subcategory) ?? { answered: 0, correct: 0, tiers: new Map() };
    s.answered++;
    if (c.result!.correct) s.correct++;
    s.tiers.set(c.difficulty, (s.tiers.get(c.difficulty) ?? 0) + 1);
    bySkill.set(c.subcategory, s);
  }

  const { data: progress } = await supabase.from("category_progress").select("subcategory, difficulty").eq("user_id", user.id);
  const stored = new Map((progress ?? []).map((p) => [p.subcategory as string, p.difficulty as Difficulty]));
  const firstEnd = !plan.endedAt;
  const skills = [];
  for (const [subcategory, s] of bySkill) {
    const before = stored.get(subcategory) ?? null;
    let after = before;
    if (firstEnd && s.answered >= TIER_UPDATE_MIN_CARDS) {
      const setTier = [...s.tiers.entries()].sort((a, b) => b[1] - a[1])[0][0];
      after = tierAfterPracticeSet(before, setTier, Math.round((s.correct / s.answered) * 100));
      if (after !== before) {
        const { error } = await supabase.from("category_progress").upsert(
          { user_id: user.id, subcategory, difficulty: after, updated_at: new Date().toISOString() },
          { onConflict: "user_id,subcategory" },
        );
        if (error) { console.error("Lite: tier update failed:", error); after = before; }
      }
    }
    skills.push({ subcategory, answered: s.answered, correct: s.correct, tierBefore: before, tierAfter: after });
  }
  if (firstEnd) {
    await supabase.from("sessions").update({ stream_plan: { ...plan, endedAt: new Date().toISOString() } }).eq("id", sessionId);
  }

  return NextResponse.json({
    answered: answered.length,
    correct: answered.filter((c) => c.result!.correct).length,
    mistakesFixed: answered.filter((c) => c.mistake && c.result!.correct).length,
    bySkill: skills.sort((a, b) => b.answered - a.answered),
  });
}
