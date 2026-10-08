import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPracticeSet } from "@/lib/server/practice-set";
import type { Difficulty } from "@/lib/types";

/** Starts a bank practice set (see lib/server/practice-set.ts). */
export async function POST(req: NextRequest) {
  const { subcategories, difficulty, count } = await req.json() as {
    subcategories: string[];
    difficulty: Difficulty;
    count: number;
  };
  if (!subcategories?.length || !difficulty || !count) {
    return NextResponse.json({ error: "Missing subcategories, difficulty, or count." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const result = await createPracticeSet(supabase, user.id, { subcategories, difficulty, count });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ sessionId: result.sessionId });
}
