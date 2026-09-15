import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { readSessionToken } from "./cookies.ts";
import { sha256Hex } from "./tokens.ts";

// Factored out so every route can require a signed-in user without
// duplicating the session lookup. One round trip: the sessions-to-users
// foreign key is embedded in the select rather than fetched with a second
// query - see DOCUMENTATION.md Section 5 for why that matters for query count.
export async function requireSession(
  req: Request,
  db: SupabaseClient,
): Promise<{ id: string; email: string; emailVerified: boolean } | null> {
  const token = readSessionToken(req);
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const { data: session, error } = await db
    .from("sessions")
    .select("expires_at, revoked_at, users(id, email, email_verified_at)")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error) throw error;

  const isValid = session && !session.revoked_at && new Date(session.expires_at) > new Date();
  if (!isValid) return null;

  const user = session.users as unknown as { id: string; email: string; email_verified_at: string | null };
  return { id: user.id, email: user.email, emailVerified: user.email_verified_at !== null };
}
