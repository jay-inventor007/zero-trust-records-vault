import { createServiceClient } from "../_shared/db.ts";
import { handlePreflight } from "../_shared/cors.ts";
import { json, getClientIp } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/enforceRateLimit.ts";
import { requireVerifiedUser } from "../_shared/requireVerifiedUser.ts";
import { generateSlug } from "../_shared/slug.ts";
import { createRecordSchema } from "../../../shared/validation.ts";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  const db = createServiceClient();

  const gate = await requireVerifiedUser(req, db);
  if (gate.error) return gate.error;
  const { user } = gate;

  const limited = await enforceRateLimit(db, req, "create-record", user.id);
  if (limited) return limited;

  const parsed = createRecordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json(req, { error: "Invalid input", issues: parsed.error.flatten() }, 400);
  }

  // One query: insert and immediately return the row, slug included, so the
  // caller has everything needed to navigate to the new record with no
  // follow-up read. A retry on a slug collision, not because it's likely (72
  // bits of randomness), but because "extremely unlikely" is not the same
  // guarantee as the database's own unique constraint, and the fix is cheap.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: record, error } = await db
      .from("records")
      .insert({ user_id: user.id, title: parsed.data.title, body: parsed.data.body, slug: generateSlug() })
      .select("slug, title, body, created_at")
      .single();

    if (!error) return json(req, { record }, 201);
    if (error.code !== "23505") throw error;
  }

  return json(req, { error: "Could not create the record. Try again." }, 500);
});
