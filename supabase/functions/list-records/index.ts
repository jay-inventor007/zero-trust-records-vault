import { createServiceClient } from "../_shared/db.ts";
import { handlePreflight } from "../_shared/cors.ts";
import { json } from "../_shared/http.ts";
import { requireVerifiedUser } from "../_shared/requireVerifiedUser.ts";

// Originally two round trips - one for the rows, a second purely for the
// total count. PostgREST's count option returns both from the same query,
// so the second round trip was never actually necessary. See
// DOCUMENTATION.md Section 5/6 for the real before/after measurement this
// replaced.
Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return json(req, { error: "Method not allowed" }, 405);

  const db = createServiceClient();

  const gate = await requireVerifiedUser(req, db);
  if (gate.error) return gate.error;
  const { user } = gate;

  // One query: the rows, scoped to this user, and the exact total count of
  // matching rows, in the same round trip.
  const { data: records, error, count } = await db
    .from("records")
    .select("slug, title, body, created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return json(req, { records, total: count ?? 0 }, 200);
});
