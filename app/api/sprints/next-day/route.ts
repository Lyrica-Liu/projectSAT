import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startNextSprintDay } from "@/lib/server/sprints";

/** Starts (or resumes) the active short sprint's next day. */
export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const result = await startNextSprintDay(supabase, user.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ sessionId: result.sessionId });
}
