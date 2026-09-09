import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveCommandOfEvidenceSubcategory } from "@/lib/questions/parser";

/**
 * Traces already-saved "command_of_evidence"-skill questions back to which subcategory
 * (Textual or Quantitative) they actually came from — see resolveCommandOfEvidenceSubcategory
 * for why this can't just be read off the saved question row. Client-side pages (results,
 * dashboard) can't call the resolver directly since it reads the bank off disk (`fs`), which
 * only runs server-side.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { items } = await req.json() as { items?: { id: string; passage: string | null; stem: string }[] };

  const resolved: Record<string, string> = {};
  for (const item of items ?? []) {
    const subcategory = resolveCommandOfEvidenceSubcategory(item.passage, item.stem);
    if (subcategory) resolved[item.id] = subcategory;
  }

  return NextResponse.json({ resolved });
}
