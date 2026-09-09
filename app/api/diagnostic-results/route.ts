import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDiagnosticCategoryResults } from "@/lib/server/diagnostic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const outcome = await getDiagnosticCategoryResults(supabase, user);
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  }

  return NextResponse.json({ results: outcome.results });
}
