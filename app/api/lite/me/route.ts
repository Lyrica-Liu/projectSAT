import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calcStreak } from "@/lib/plan";
import { getSprintState } from "@/lib/server/sprints";

const DEFAULT_DAILY_GOAL = 10;

/**
 * Lite's header and Me tab: streak, today's questions against the daily goal, the remembered
 * Start mode and the active sprint (one request for the whole Practice home). `?tz=` is the browser's getTimezoneOffset(), so "today" is the
 * student's day, not the server's. The goal is changed with updateUser({ data: { lite_daily_goal } }).
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const tz = Number(req.nextUrl.searchParams.get("tz")) || 0;
  const local = new Date(Date.now() - tz * 60_000);
  const startOfToday = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) + tz * 60_000).toISOString();
  const since = new Date(Date.now() - 60 * 86_400_000).toISOString();

  const [sessionsRes, liteTodayRes, setsTodayRes, sprints] = await Promise.all([
    supabase.from("sessions").select("completed_at").eq("user_id", user.id).gte("completed_at", since),
    // Cards graded one at a time (Lite) carry answered_at.
    supabase.from("answers").select("id", { count: "exact", head: true }).gte("answered_at", startOfToday),
    // Website sets don't, so count the answers of sets finished today.
    supabase.from("sessions").select("id").eq("user_id", user.id).eq("kind", "set").gte("completed_at", startOfToday),
    getSprintState(supabase, user.id),
  ]);
  const setIds = (setsTodayRes.data ?? []).map((s) => s.id as string);
  let fromSets = 0;
  if (setIds.length > 0) {
    const { count } = await supabase.from("answers").select("id", { count: "exact", head: true })
      .in("session_id", setIds).is("answered_at", null).not("is_correct", "is", null);
    fromSets = count ?? 0;
  }

  const meta = user.user_metadata ?? {};
  return NextResponse.json({
    streak: calcStreak(sessionsRes.data ?? []),
    today: (liteTodayRes.count ?? 0) + fromSets,
    dailyGoal: Number(meta.lite_daily_goal) || DEFAULT_DAILY_GOAL,
    lastMode: meta.lite_last_mode ?? "adaptive",
    lastPick: meta.lite_last_pick ?? null,
    name: meta.display_name ?? meta.full_name ?? null,
    isAnonymous: user.is_anonymous ?? false,
    email: user.email ?? null,
    activeSprint: sprints.active,
  });
}
