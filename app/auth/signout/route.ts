import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { SIGNED_OUT_COOKIE } from "@/lib/auth";

/**
 * Signing out on purpose. The form may send `next=/lite` (Lite's Me tab) to land back in Lite;
 * anything else goes to the website's welcome screen. Both then show the welcome choices
 * (sign in, or start fresh) rather than quietly making a new guest.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const form = await request.formData().catch(() => null);
  const next = form?.get("next") === "/lite" ? "/lite" : "/welcome";
  // NextResponse.redirect() defaults to a 307, which preserves the original POST — the browser
  // would then try to POST to the next page instead of loading it. 303 forces the follow-up to be
  // a GET, the standard Post/Redirect/Get pattern for a form-submitted action like this one.
  const res = NextResponse.redirect(new URL(next, request.url), 303);
  res.cookies.set(SIGNED_OUT_COOKIE, "1", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
