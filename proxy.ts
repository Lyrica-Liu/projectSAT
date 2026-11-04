import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { BROWSER_SESSION_COOKIE } from "@/lib/auth";

// /onboarding is deliberately public: it's the landing page's entry point and signs the
// visitor in anonymously itself.
const PROTECTED_PREFIXES = ["/dashboard", "/practice", "/results", "/plan", "/for-you", "/account", "/notebook", "/sprints"];

const LITE_ENTRY_PATHS = ["/", "/dashboard"];
/** Phones only: iPads and Android tablets (no "Mobile" in their user agent) keep the website. */
const PHONE_UA = /iPhone|iPod|Android.+Mobile|Windows Phone/i;
/** Set to "1" by Lite's "Full site" link. */
const FULL_SITE_COOKIE = "pw_full_site";

function getSupabaseEnv(name: string) {
  return process.env[name]?.trim();
}

function isHttpUrl(value: string | undefined) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = getSupabaseEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = getSupabaseEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!isHttpUrl(supabaseUrl) || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // A signed-in account without this browser session's marker means the browser was restarted
  // since they signed in: sign them out (see BROWSER_SESSION_COOKIE in lib/auth.ts). Guests
  // keep their session, as does Lite, and the auth pages are left alone mid-sign-in.
  if (
    user && !user.is_anonymous && !request.cookies.get(BROWSER_SESSION_COOKIE) &&
    !pathname.startsWith("/lite") && !pathname.startsWith("/auth")
  ) {
    await supabase.auth.signOut({ scope: "local" }); // clears the auth cookies on supabaseResponse
    user = null;
    if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      const redirect = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c));
      return redirect;
    }
    return supabaseResponse;
  }
  // Guests get the marker too (it never signs them out), so a guest who turns into a real account
  // mid-session (saving progress by email) isn't signed out on their next page.
  if (user?.is_anonymous && !request.cookies.get(BROWSER_SESSION_COOKIE)) {
    supabaseResponse.cookies.set(BROWSER_SESSION_COOKIE, "1", { path: "/", sameSite: "lax" });
  }

  // 800Path Lite: phones opening the home pages land in Lite, unless they chose "Full site"
  // there (which sets FULL_SITE_COOKIE). Off until Lite's screens ship: LITE_REDIRECT=on.
  if (
    process.env.LITE_REDIRECT === "on" && LITE_ENTRY_PATHS.includes(pathname) &&
    PHONE_UA.test(request.headers.get("user-agent") ?? "") && request.cookies.get(FULL_SITE_COOKIE)?.value !== "1"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/lite";
    return NextResponse.redirect(url);
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from /auth. Guests stay: it's where they sign in to an
  // existing account or save their progress (and where a failed Google link lands).
  if (pathname === "/auth" && user && !user.is_anonymous) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Not API routes: each one checks the user itself (and refreshes the session cookie if it
    // must), so checking here too would cost every call a second round trip to Supabase.
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
