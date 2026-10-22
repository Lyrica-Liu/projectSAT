import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Set while a guest is being moved into the Google account they already had; holds how many
 * sets they finished as a guest. The auth callback sends them to /auth/confirm when it's there.
 */
export const SWITCH_COOKIE = "pw_switched_account";

export type SaveGuestResult = { kind: "confirm_email" } | { kind: "signed_in" } | { kind: "error"; message: string };

/**
 * Turns the current guest into a real account with this email and password. If the email
 * already belongs to an account, signs in to that account instead (the guest's own progress
 * stays behind on the guest user: merging two users needs admin access the client doesn't have).
 */
export async function saveGuestWithEmail(
  supabase: SupabaseClient,
  email: string,
  password: string,
  data?: Record<string, unknown>,
): Promise<SaveGuestResult> {
  const { error } = await supabase.auth.updateUser({ email, password, data });
  if (!error) return { kind: "confirm_email" };
  if (error.code !== "email_exists") return { kind: "error", message: error.message };

  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (!signInErr) return { kind: "signed_in" };
  return {
    kind: "error",
    message: "That email already has an account, but the password doesn't match. Use that account's password, or Google if that's how you signed up.",
  };
}
