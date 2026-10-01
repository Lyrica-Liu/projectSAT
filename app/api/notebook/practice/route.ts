import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_QUESTIONS = 20;

/**
 * Starts a review session from the student's mistake notebook. It reuses the original question
 * rows (not copies), so answering one correctly here is what clears it from the notebook — see
 * the notebook cleanup in /api/grade-session.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { questionIds?: string[] };

  let query = supabase
    .from("notebook_entries")
    .select("question_id, question:questions(domain)")
    .eq("user_id", user.id)
    .order("added_at", { ascending: true });
  if (Array.isArray(body.questionIds) && body.questionIds.length > 0) {
    query = query.in("question_id", body.questionIds.slice(0, 200));
  }
  const { data: entries, error: loadErr } = await query;

  if (loadErr) {
    console.error("Supabase notebook load error:", loadErr);
    return NextResponse.json({ error: "Could not load your notebook." }, { status: 500 });
  }
  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: "No notebook questions to practice." }, { status: 400 });
  }

  // Oldest mistakes first when there are more than fit in one session, then shuffle the chosen
  // set so the order isn't just "the order you got them wrong in".
  const picked = entries.slice(0, MAX_QUESTIONS);
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }

  const domains = new Set(
    picked.map((e) => {
      const q = Array.isArray(e.question) ? e.question[0] : e.question;
      return (q as { domain?: string } | null)?.domain ?? "reading";
    })
  );
  // sessions.domain_filter only allows reading | writing | both (math sessions use "both").
  const domainFilter = domains.size === 1 && (domains.has("reading") || domains.has("writing"))
    ? [...domains][0]
    : "both";

  const { data: session, error: sErr } = await supabase
    .from("sessions")
    .insert({ user_id: user.id, question_count: picked.length, domain_filter: domainFilter })
    .select("id")
    .single();
  if (sErr || !session) {
    console.error("Supabase notebook session error:", sErr);
    return NextResponse.json({ error: "Could not start the review session." }, { status: 500 });
  }

  const { error: aErr } = await supabase
    .from("answers")
    .insert(picked.map((e, i) => ({ session_id: session.id, question_id: e.question_id, position: i })));
  if (aErr) {
    console.error("Supabase notebook answers error:", aErr);
    return NextResponse.json({ error: "Could not start the review session." }, { status: 500 });
  }

  return NextResponse.json({ sessionId: session.id, count: picked.length, remaining: entries.length - picked.length });
}
