import type { SupabaseClient, User } from "@supabase/supabase-js";
import { sprintDef, planSprintDays, type SprintKey } from "@/lib/sprints";
import { loadSkillMapData } from "@/lib/server/mastery";
import { generatePlan } from "@/lib/server/generate-plan";
import { createPracticeSet } from "@/lib/server/practice-set";
import { getCurrentPlanDay } from "@/lib/plan";
import type { Difficulty } from "@/lib/types";

export interface SprintDayState {
  day: number;
  subcategory: string | null;
  completed: boolean;
  score: number | null;
}

export interface ActiveSprint {
  id: string;
  key: SprintKey;
  title: string;
  startedAt: string;
  days: SprintDayState[];
  completedCount: number;
  /** 1-based day to do next, or null when every day is done. */
  nextDay: number | null;
  /** Where "Continue" goes: the next sprint day, or /plan/N for 30-Day Full Prep. */
  continueHref: string;
}

export interface SprintHistoryItem {
  key: SprintKey;
  title: string;
  status: "completed" | "quit";
  endedAt: string | null;
}

/** Makes 30-Day Full Prep the active sprint when nothing else is (onboarding's plan path). */
export async function ensureFullPrepSprint(supabase: SupabaseClient, userId: string) {
  const { data: active } = await supabase.from("user_sprints").select("id").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (!active) await supabase.from("user_sprints").insert({ user_id: userId, sprint_key: "full-30", status: "active" });
}

export async function getSprintState(supabase: SupabaseClient, userId: string): Promise<{ active: ActiveSprint | null; history: SprintHistoryItem[] }> {
  const { data: rows } = await supabase.from("user_sprints")
    .select("id, sprint_key, status, started_at, ended_at")
    .eq("user_id", userId).order("started_at", { ascending: false });

  const history: SprintHistoryItem[] = (rows ?? [])
    .filter((r) => r.status !== "active")
    .map((r) => ({ key: r.sprint_key as SprintKey, title: sprintDef(r.sprint_key)?.title ?? r.sprint_key, status: r.status as "completed" | "quit", endedAt: r.ended_at }));

  const row = (rows ?? []).find((r) => r.status === "active");
  if (!row) return { active: null, history };
  const def = sprintDef(row.sprint_key);
  if (!def) return { active: null, history };

  let days: SprintDayState[];
  if (def.key === "full-30") {
    const { data: planDays } = await supabase.from("plan_days").select("day_number, subcategory, completed_at, score").eq("user_id", userId);
    const byDay = new Map((planDays ?? []).map((p) => [p.day_number as number, p]));
    days = Array.from({ length: 30 }, (_, i) => {
      const p = byDay.get(i + 1);
      return { day: i + 1, subcategory: p?.subcategory ?? null, completed: !!p?.completed_at, score: p?.score ?? null };
    });
  } else {
    const { data: sprintDays } = await supabase.from("sprint_days")
      .select("day_number, subcategory, completed_at, score").eq("user_sprint_id", row.id).order("day_number");
    days = (sprintDays ?? []).map((d) => ({ day: d.day_number, subcategory: d.subcategory, completed: !!d.completed_at, score: d.score }));
  }

  const completedCount = days.filter((d) => d.completed).length;
  const nextDay = def.key === "full-30"
    ? (() => { const n = getCurrentPlanDay(days.filter((d) => d.completed).map((d) => d.day)); return n > 30 ? null : n; })()
    : (days.find((d) => !d.completed)?.day ?? null);

  return {
    history,
    active: {
      id: row.id, key: def.key, title: def.title, startedAt: row.started_at, days, completedCount, nextDay,
      continueHref: def.key === "full-30" ? `/plan/${nextDay ?? 30}` : "/sprints/next",
    },
  };
}

export type StartResult = { ok: true } | { ok: false; error: string; status: number };

export async function startSprint(supabase: SupabaseClient, user: User, key: string): Promise<StartResult> {
  const def = sprintDef(key);
  if (!def) return { ok: false, error: "Unknown sprint.", status: 400 };

  const { data: active } = await supabase.from("user_sprints").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (active) return { ok: false, error: "Finish or quit your current sprint first.", status: 409 };

  if (def.key === "full-30") {
    // Reuse an existing plan (progress included) or build one, keeping skill-map tiers.
    const { count } = await supabase.from("plan_days").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if (!count) {
      const built = await generatePlan(supabase, user, { keepTiers: true });
      if (!built.ok) return built;
    }
    const { error } = await supabase.from("user_sprints").insert({ user_id: user.id, sprint_key: "full-30", status: "active" });
    return error ? { ok: false, error: "Could not start the sprint.", status: 500 } : { ok: true };
  }

  const { mastery, tiers } = await loadSkillMapData(supabase);
  const plan = planSprintDays(def, mastery);
  if (plan.length === 0) return { ok: false, error: "No questions are available for this sprint yet.", status: 400 };

  const { data: sprint, error: sErr } = await supabase.from("user_sprints")
    .insert({ user_id: user.id, sprint_key: def.key, status: "active" }).select("id").single();
  if (sErr || !sprint) return { ok: false, error: "Could not start the sprint.", status: sErr?.code === "23505" ? 409 : 500 };

  const { error: dErr } = await supabase.from("sprint_days").insert(plan.map((subcategory, i) => ({
    user_sprint_id: sprint.id, user_id: user.id, day_number: i + 1, subcategory,
    difficulty: tiers[subcategory] ?? "medium-low", question_count: def.questionsPerDay,
  })));
  if (dErr) {
    await supabase.from("user_sprints").update({ status: "quit", ended_at: new Date().toISOString() }).eq("id", sprint.id);
    return { ok: false, error: "Could not plan the sprint.", status: 500 };
  }
  return { ok: true };
}

/** Quitting is free: the sprint just ends. Practice already done still counts on the map. */
export async function quitSprint(supabase: SupabaseClient, userId: string) {
  await supabase.from("user_sprints").update({ status: "quit", ended_at: new Date().toISOString() })
    .eq("user_id", userId).eq("status", "active");
}

/** Starts (or resumes) the active short sprint's next day; returns its session id. */
export async function startNextSprintDay(supabase: SupabaseClient, userId: string): Promise<{ ok: true; sessionId: string } | { ok: false; error: string; status: number }> {
  const { data: sprint } = await supabase.from("user_sprints").select("id, sprint_key").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (!sprint || sprint.sprint_key === "full-30") return { ok: false, error: "No active short sprint.", status: 404 };

  const { data: day } = await supabase.from("sprint_days")
    .select("id, subcategory, difficulty, question_count, session_id")
    .eq("user_sprint_id", sprint.id).is("completed_at", null).order("day_number").limit(1).maybeSingle();
  if (!day) return { ok: false, error: "This sprint is already finished.", status: 400 };

  if (day.session_id) {
    const { data: s } = await supabase.from("sessions").select("completed_at").eq("id", day.session_id).maybeSingle();
    if (s && !s.completed_at) return { ok: true, sessionId: day.session_id };
  }

  // The day's difficulty follows the student's current tier, so a sprint adapts as they improve.
  const { data: progress } = await supabase.from("category_progress").select("difficulty")
    .eq("user_id", userId).eq("subcategory", day.subcategory).maybeSingle();
  const difficulty = (progress?.difficulty as Difficulty | undefined) ?? (day.difficulty as Difficulty);
  const set = await createPracticeSet(supabase, userId, { subcategories: [day.subcategory], difficulty, count: day.question_count });
  if (!set.ok) return set;
  await supabase.from("sprint_days").update({ session_id: set.sessionId, difficulty }).eq("id", day.id);
  return { ok: true, sessionId: set.sessionId };
}

/**
 * After a set is graded: if it was a short sprint's day, mark the day done, and the sprint
 * complete when it was the last day. Returns the finished sprint for the reward, if any.
 */
export async function recordSprintProgress(supabase: SupabaseClient, sessionId: string, score: number): Promise<{ key: SprintKey; title: string; subcategories: string[] } | null> {
  const { data: day } = await supabase.from("sprint_days").select("id, user_sprint_id").eq("session_id", sessionId).maybeSingle();
  if (!day) return null;
  const now = new Date().toISOString();
  await supabase.from("sprint_days").update({ completed_at: now, score }).eq("id", day.id);

  const { data: days } = await supabase.from("sprint_days").select("subcategory, completed_at").eq("user_sprint_id", day.user_sprint_id);
  if (!days || days.some((d) => !d.completed_at)) return null;
  const { data: sprint } = await supabase.from("user_sprints")
    .update({ status: "completed", ended_at: now }).eq("id", day.user_sprint_id).eq("status", "active")
    .select("sprint_key").maybeSingle();
  if (!sprint) return null;
  return {
    key: sprint.sprint_key as SprintKey,
    title: sprintDef(sprint.sprint_key)?.title ?? sprint.sprint_key,
    subcategories: [...new Set(days.map((d) => d.subcategory as string))],
  };
}

/** 30-Day Full Prep is complete once all 30 plan days are. */
export async function recordFullPrepProgress(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase.from("plan_days").select("id", { count: "exact", head: true })
    .eq("user_id", userId).not("completed_at", "is", null);
  if ((count ?? 0) >= 30) {
    await supabase.from("user_sprints").update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("user_id", userId).eq("sprint_key", "full-30").eq("status", "active");
  }
}
