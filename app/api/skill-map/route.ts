import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadSkillMapData, daysUntil, practicableCategories } from "@/lib/server/mastery";
import { suggestNext } from "@/lib/suggestions";

/** Unfinished extra-practice sets older than this aren't suggested — the student has moved on. */
const RESUME_MAX_AGE_DAYS = 14;

/**
 * Everything the skill map home and the results page's "Next up" need.
 * `?after=<sessionId>` (results page) adds that set's before/after level and lets the
 * just-finished rules apply.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const after = req.nextUrl.searchParams.get("after") ?? undefined;

  const since = new Date(Date.now() - RESUME_MAX_AGE_DAYS * 86_400_000).toISOString();
  const [data, unfinishedRes, planRes, recentRes] = await Promise.all([
    loadSkillMapData(supabase, { compareSession: after }),
    supabase.from("sessions").select("id")
      .eq("user_id", user.id).is("completed_at", null).gte("started_at", since)
      .order("started_at", { ascending: false }).limit(10),
    supabase.from("plan_days").select("session_id").eq("user_id", user.id).not("session_id", "is", null),
    supabase.from("sessions").select("id, completed_at, score")
      .eq("user_id", user.id).not("completed_at", "is", null)
      .order("completed_at", { ascending: false }).limit(5),
  ]);

  // Plan days and the diagnostic resume through their own pages, not "Next up".
  const excluded = new Set<string>((planRes.data ?? []).map((r) => r.session_id as string));
  const diagnosticId = user.user_metadata?.diagnostic_session_id as string | undefined;
  if (diagnosticId) excluded.add(diagnosticId);
  const unfinished = (unfinishedRes.data ?? []).find((s) => !excluded.has(s.id) && s.id !== after);

  // The diagnostic doubles as the map's optional "quick start" (2 questions per category).
  let quickStart: { status: "none" | "in_progress" | "done"; sessionId: string | null; questions: number } =
    { status: "none", sessionId: null, questions: practicableCategories().length * 2 };
  if (diagnosticId) {
    const { data: diag } = await supabase.from("sessions").select("completed_at").eq("id", diagnosticId).maybeSingle();
    if (diag) quickStart = { ...quickStart, status: diag.completed_at ? "done" : "in_progress", sessionId: diagnosticId };
  }

  const testDate = (user.user_metadata?.test_date as string | null | undefined) ?? null;
  const daysToTest = daysUntil(testDate);
  const suggestion = suggestNext({
    mastery: data.mastery,
    tiers: data.tiers,
    daysToTest,
    recentSets: data.recentSets,
    unfinishedSessionId: unfinished?.id ?? null,
    justFinished: data.compareIsLatest,
  });

  return NextResponse.json({
    mastery: data.mastery,
    tiers: data.tiers,
    testDate,
    daysToTest,
    suggestion,
    change: data.change,
    recentSessions: recentRes.data ?? [],
    isAnonymous: user.is_anonymous ?? false,
    quickStart,
  });
}
