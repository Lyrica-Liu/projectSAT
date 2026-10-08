import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SPRINTS, planSprintDays } from "@/lib/sprints";
import { getSprintState } from "@/lib/server/sprints";
import { loadSkillMapData } from "@/lib/server/mastery";

/** The sprint menu (with each short sprint's days previewed for this student) and their sprint state. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const [{ mastery }, state] = await Promise.all([loadSkillMapData(supabase), getSprintState(supabase, user.id)]);
  const menu = SPRINTS.map((def) => ({
    ...def,
    preview: def.key === "full-30" ? null : planSprintDays(def, mastery),
  })).filter((s) => s.preview === null || s.preview.length > 0);

  return NextResponse.json({ menu, ...state });
}
