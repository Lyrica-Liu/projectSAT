import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // NextResponse.redirect() defaults to a 307, which preserves the original POST — the browser
  // would then try to POST to "/" instead of loading it. 303 forces the follow-up to be a GET,
  // the standard Post/Redirect/Get pattern for a form-submitted action like this one.
  return NextResponse.redirect(new URL("/", request.url), 303);
}
