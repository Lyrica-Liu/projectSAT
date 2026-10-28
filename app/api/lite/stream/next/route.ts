import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { serveNextCard } from "@/lib/server/lite-stream";

/** The stream's next card. Body: { sessionId }. Returns the current card again if it's unanswered. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { sessionId } = await req.json() as { sessionId: string };
  const card = await serveNextCard(supabase, user.id, sessionId);
  if ("error" in card) return NextResponse.json({ error: card.error }, { status: card.status });
  return NextResponse.json({ card });
}
