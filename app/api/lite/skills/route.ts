import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadSkillMapData } from "@/lib/server/mastery";

/** Just the skill levels (Lite's Pick sheet and Me tab), without the rest of /api/skill-map's work. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { mastery } = await loadSkillMapData(supabase);
  return NextResponse.json({ mastery });
}
