import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { SWITCH_COOKIE } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // A guest who was moved into the Google account they already had: let them check it's
      // the right account first.
      const cookieStore = await cookies();
      const guestSets = cookieStore.get(SWITCH_COOKIE)?.value;
      if (guestSets != null) {
        cookieStore.delete(SWITCH_COOKIE);
        return NextResponse.redirect(`${origin}/auth/confirm?guest_sets=${encodeURIComponent(guestSets)}`);
      }
      // No forced onboarding: signing in goes straight in. Setting a goal and the diagnostic
      // are optional and reachable from home.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // A guest linking a Google account that already belongs to another user comes back with
  // this code instead of a `code` — the auth page then signs in to that account instead.
  const reason = searchParams.get("error_code") === "identity_already_exists" ? "google_taken" : "oauth_failed";
  return NextResponse.redirect(`${origin}/auth?error=${reason}`);
}
