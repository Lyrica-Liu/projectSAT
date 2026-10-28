import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VOCAB } from "@/lib/vocab/words";
import { buildDeck, review, vocabStats, type ReviewResult, type VocabState } from "@/lib/vocab/srs";

const WORDS = VOCAB.map((w) => w.word);
const BY_WORD = new Map(VOCAB.map((w) => [w.word, w]));

async function loadProgress(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.from("vocab_progress").select("word, box, due_at, reviews, lapses");
  return (data ?? []) as VocabState[];
}

/** Today's flashcard deck (due words, then new ones) and overall progress. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const progress = await loadProgress(supabase);
  const now = new Date();
  const boxes = new Map(progress.map((p) => [p.word, p.box]));
  const deck = buildDeck(WORDS, progress, now).map(({ word, isNew }) => ({ ...BY_WORD.get(word)!, isNew, box: boxes.get(word) ?? 0 }));
  return NextResponse.json({ deck, stats: vocabStats(WORDS, progress, now) });
}

/** Records one flashcard: { word, result: "got_it" | "still_learning" }. Returns the word's new state. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { word, result } = await req.json() as { word: string; result: ReviewResult };
  if (!BY_WORD.has(word)) return NextResponse.json({ error: "Unknown word." }, { status: 400 });
  if (result !== "got_it" && result !== "still_learning") return NextResponse.json({ error: "Unknown result." }, { status: 400 });

  const { data: existing } = await supabase.from("vocab_progress")
    .select("word, box, due_at, reviews, lapses").eq("word", word).maybeSingle();
  const now = new Date();
  const next = review((existing as VocabState | null) ?? undefined, word, result, now);
  const { error } = await supabase.from("vocab_progress").upsert(
    { user_id: user.id, ...next, last_reviewed_at: now.toISOString() },
    { onConflict: "user_id,word" },
  );
  if (error) return NextResponse.json({ error: "Could not save that card." }, { status: 500 });
  return NextResponse.json({ word: next });
}
