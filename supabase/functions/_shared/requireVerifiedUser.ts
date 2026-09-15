import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { requireSession } from "./requireSession.ts";
import { json } from "./http.ts";

// The shared gate every records route opens with. Two distinct rejections,
// on purpose:
//   401 - no valid session at all. The caller isn't anyone as far as this
//         app is concerned.
//   403 - a real, valid session, but this account hasn't verified its email
//         yet, so it isn't allowed to use records at all, regardless of
//         which one. This is the one place in the app 403 is used, and it's
//         deliberately never used for "this record isn't yours" - see
//         DOCUMENTATION.md Section 5 for why that's a 404 instead.
export async function requireVerifiedUser(
  req: Request,
  db: SupabaseClient,
): Promise<{ user: { id: string; email: string }; error: null } | { user: null; error: Response }> {
  const user = await requireSession(req, db);
  if (!user) {
    return { user: null, error: json(req, { error: "Not signed in" }, 401) };
  }
  if (!user.emailVerified) {
    return { user: null, error: json(req, { error: "Verify your email before managing records." }, 403) };
  }
  return { user: { id: user.id, email: user.email }, error: null };
}
