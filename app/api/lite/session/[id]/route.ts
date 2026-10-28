import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadSessionCards } from "@/lib/server/lite-stream";

/** A session's cards for Lite (answer keys only on answered cards): resuming a stream or playing a sprint day. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const loaded = await loadSessionCards(supabase, id);
  if (!loaded) return NextResponse.json({ error: "Session not found." }, { status: 404 });
  return NextResponse.json({
    kind: loaded.session.kind,
    completed: loaded.session.kind === "set" && !!loaded.session.completed_at,
    cards: loaded.cards,
  });
}
