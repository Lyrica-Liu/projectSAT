import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadSkillMapData } from "@/lib/server/mastery";
import { serveNextCard } from "@/lib/server/lite-stream";
import { buildStreamPlan, PICK_GROUPS, STREAM_MODES, type StreamMode } from "@/lib/lite/stream";

/**
 * Starts a Lite card stream and returns its first card.
 * Body: { mode: "adaptive" | "clinic" | "pick", pick?: "english" | "math" | <category> }.
 * The mode (and pick) are remembered so Lite's Start button can reuse them.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { mode, pick } = await req.json() as { mode: StreamMode; pick?: string };
  if (!STREAM_MODES.includes(mode)) return NextResponse.json({ error: "Unknown mode." }, { status: 400 });
  if (mode === "pick" && !pick) return NextResponse.json({ error: "Choose what to practice." }, { status: 400 });
  const picked = !pick ? [] : pick === "english" || pick === "math" ? PICK_GROUPS[pick] : [pick];

  const { mastery, tiers } = await loadSkillMapData(supabase);
  const plan = buildStreamPlan(mode, mastery, tiers, picked);
  if (!plan) return NextResponse.json({ error: "No questions are available for that yet." }, { status: 400 });

  const { data: session, error } = await supabase.from("sessions")
    .insert({ user_id: user.id, kind: "stream", stream_plan: plan, question_count: 0, domain_filter: "both" })
    .select("id").single();
  if (error || !session) return NextResponse.json({ error: "Could not start practice." }, { status: 500 });

  await supabase.auth.updateUser({ data: { lite_last_mode: mode, lite_last_pick: mode === "pick" ? pick : null } });

  const card = await serveNextCard(supabase, user.id, session.id);
  if ("error" in card) return NextResponse.json({ error: card.error }, { status: card.status });
  return NextResponse.json({ sessionId: session.id, card });
}
