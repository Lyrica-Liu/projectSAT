import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Clears completion state on every plan_days row — completed_at, score, session_id — so the
 * whole 30-day calendar reopens at Day 1. Deliberately leaves subcategory/difficulty and
 * category_progress untouched: this is a progress reset, not a re-personalization (that's what
 * "Redo onboarding" is for, retaking the diagnostic). A user's actual skill level shouldn't be
 * thrown away just because they want another pass through the plan.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { error: pdErr } = await supabase
    .from("plan_days")
    .update({ completed_at: null, score: null, session_id: null })
    .eq("user_id", user.id);
  if (pdErr) {
    return NextResponse.json({ error: `Could not restart the plan: ${pdErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
