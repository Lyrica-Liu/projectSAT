import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { quitSprint } from "@/lib/server/sprints";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  await quitSprint(supabase, user.id);
  return NextResponse.json({ ok: true });
}
