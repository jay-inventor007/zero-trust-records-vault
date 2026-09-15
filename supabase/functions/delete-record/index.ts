import { createServiceClient } from "../_shared/db.ts";
import { handlePreflight } from "../_shared/cors.ts";
import { json } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/enforceRateLimit.ts";
import { requireVerifiedUser } from "../_shared/requireVerifiedUser.ts";
import { slugSchema } from "../../../shared/validation.ts";

// Originally three separate round trips - find it, log it, delete it - and
// not atomic; a crash between the second and third query would log a
// deletion that never actually happened. Now one round trip to a single
// Postgres function that does all three steps in one transaction. See
// DOCUMENTATION.md Section 5/6 for the real before/after measurement.
Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  const db = createServiceClient();

  const gate = await requireVerifiedUser(req, db);
  if (gate.error) return gate.error;
  const { user } = gate;

  const limited = await enforceRateLimit(db, req, "delete-record", user.id);
  if (limited) return limited;

  const parsed = slugSchema.safeParse((await req.json().catch(() => ({})))?.slug);
  if (!parsed.success) return json(req, { error: "Invalid record reference" }, 400);

  const { data, error } = await db.rpc("delete_record_with_audit", {
    p_slug: parsed.data,
    p_user_id: user.id,
  });
  if (error) throw error;

  // No row back means the function's ownership-scoped select found nothing -
  // not found and not yours produce the identical, indistinguishable result.
  if (!data || data.length === 0) return json(req, { error: "Not found" }, 404);

  return json(req, { message: "Record deleted" }, 200);
});
