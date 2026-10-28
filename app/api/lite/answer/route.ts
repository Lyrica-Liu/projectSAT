import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gradeCard } from "@/lib/server/lite-stream";

/**
 * Grades one card: { answerId, choice: "A" | "B" | "C" | "D" }. Returns the card with its
 * result (right answer and explanation). Works for stream cards and sprint-day sets; a set is
 * still finished with /api/grade-session { complete: true } after its last card.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { answerId, choice } = await req.json() as { answerId: string; choice: string };
  if (!["A", "B", "C", "D"].includes(choice)) return NextResponse.json({ error: "Pick A, B, C or D." }, { status: 400 });
  const card = await gradeCard(supabase, user.id, answerId, choice as "A" | "B" | "C" | "D");
  if ("error" in card) return NextResponse.json({ error: card.error }, { status: card.status });
  return NextResponse.json({ card });
}
