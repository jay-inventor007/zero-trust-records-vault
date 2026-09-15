import { createServiceClient } from "../_shared/db.ts";
import { handlePreflight } from "../_shared/cors.ts";
import { json } from "../_shared/http.ts";
import { requireVerifiedUser } from "../_shared/requireVerifiedUser.ts";
import { slugSchema } from "../../../shared/validation.ts";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "GET") return json(req, { error: "Method not allowed" }, 405);

  const db = createServiceClient();

  const gate = await requireVerifiedUser(req, db);
  if (gate.error) return gate.error;
  const { user } = gate;

  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return json(req, { error: "Invalid record reference" }, 400);

  // The ownership check IS the query, not a step after it: matching on
  // user_id in the same .eq() chain means a record that exists but belongs
  // to someone else and a record that doesn't exist at all produce the exact
  // same result here - no row - which is what makes returning 404 for both
  // cases honest rather than a workaround. A version that fetched by slug
  // alone and compared record.user_id === user.id afterward would still be
  // secure if written correctly, but it is one accidental refactor away from
  // an attacker-readable record - this version has no such step to forget.
  const { data: record, error } = await db
    .from("records")
    .select("slug, title, body, created_at, updated_at")
    .eq("slug", parsed.data)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;

  // Deliberately 404, never 403: telling an attacker "that one exists but
  // isn't yours" (403) confirms the slug is real, which is exactly the
  // information an ownership check should never leak. From this user's
  // point of view, a record that isn't theirs simply doesn't exist.
  if (!record) return json(req, { error: "Not found" }, 404);

  return json(req, { record }, 200);
});
