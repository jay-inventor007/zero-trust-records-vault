# Assessment 4 Plan — The Records and Access Slice

Working plan, not the graded deliverable (that's `DOCUMENTATION.md`, written once the slice
works end to end). Update this file as decisions change.

## What this slice does

Create, list, view, and delete your own records (using plain notes as the domain - the
brief says the domain doesn't matter). Built so that no signed-in user can ever reach
another user's record, and proven by actually attacking the app as a second user rather
than just asserting it.

## Decisions made

- **Stack:** React + TypeScript + Supabase (Postgres + Edge Functions), same as
  Assessments 1-3.
- **Auth: reused from Assessment 1**, source copied into this folder so the repo stands
  alone. Disclosed in `DOCUMENTATION.md`.
- **Domain: notes** (title + body). Picked for speed - the brief is explicit that the
  domain is irrelevant to what's graded here.
- **Identifier exposed in URLs: a random `slug` column, not the database `id`.** Generated
  server-side (`encode(gen_random_bytes(9), 'base64url')`), unrelated to the row's real
  primary key. `id` never appears in a URL, a response body, or the frontend.
- **Ownership check: scoped in the query itself, always.** Every read/delete filters on
  `user_id = <caller>` in the same `.eq()` chain as the record lookup, never fetched first
  and compared in application code afterward.
- **401 vs 403 vs 404:**
  - `401` - no valid session at all.
  - `403` - a valid session, but the account hasn't verified its email (the one blanket
    permission gate every records route shares, unrelated to which record is being asked
    for).
  - `404` - used for *both* "doesn't exist" and "exists but isn't yours." Deliberately
    never `403` for an ownership mismatch - a `403` there would confirm the identifier is
    real, which is exactly the information an IDOR-safe design must not leak.
- **Audit log: a separate `deletion_log` table, not a `deleted_at` column on `records`.**
  A soft-delete flag is still a record that exists and could theoretically be un-deleted or
  read directly; a genuinely separate append-only table with a title *snapshot* survives
  even if the original row's real delete happens, and can't accidentally leak through the
  same query surface as live records. Not foreign-keyed to `records`, on purpose - it has
  to keep meaning something after the row it describes is gone.

## Query count: the naive version was built and measured first, on purpose

Per the brief's requirement for a genuine before/after, not an invented one:

- **`list-records`** shipped first as two round trips: one `select` for the rows, a second
  purely for a `count`. Optimized to one round trip using PostgREST's
  `{ count: 'exact' }` option on the same select.
- **`delete-record`** shipped first as three round trips: find the record (ownership
  check), insert the audit row, then delete. Not atomic - a crash between steps two and
  three would log a deletion that never happened. Optimized into a single Postgres
  function (`delete_record_with_audit`) doing all three inside one transaction: one round
  trip, and now atomic as a side effect of the fix.
- **`get-record`** stayed at one query both before and after - the naive version fetched by
  slug alone and would have needed a second check (or a risky post-fetch comparison) to be
  secure; the fixed version folds the ownership check into the same query for free. No
  count change, but this is where the "scoping vs post-fetch check" concept actually lives.

Both naive versions were actually deployed and tested before being replaced, specifically
to get real before/after numbers rather than a plausible-sounding guess - see
`DOCUMENTATION.md` Section 5 and 6.

## Data model (draft)

- `records`: `id` (real PK, never exposed), `slug` (exposed, random, unique), `user_id`,
  `title`, `body`, timestamps. Indexed on `(user_id, created_at desc)` for the list query.
- `deletion_log`: append-only, `user_id`, `record_id` (not FK'd), `record_title` (snapshot),
  `deleted_at`.

## Engineering requirements checklist (from the brief)

- [ ] Every query scoped to the authenticated user in the query itself
- [ ] No raw database identifiers in URLs or the interface
- [ ] Audit record for every deletion, written before or as part of the delete
- [ ] Conditional views with URL state (React Router routes, real addressable URLs)
- [ ] Correct 401 vs 403
- [ ] Measured query count per main action, with a real stated reduction
- [ ] Indexes on filtered/sorted columns
- [ ] Genuine empty states

## Evidence to capture (mandatory)

- [ ] Access control audit table: two real users, every route, attempted cross-access via
      UI, guessed/edited identifiers, and direct curl - every row must say pass
- [ ] Query count table, before and after, with the classification of each query
- [ ] Screenshot of the audit log after a real deletion
- [ ] Screenshot of a URL showing the slug, not the database id

## Concepts for Section 5

Authentication versus authorisation. Scoping the query versus checking after the fetch.
Insecure direct object references. Why raw database identifiers aren't exposed. Audit
logging and why deletions are recorded. Page architecture (conditional rendering with URL
state). Status codes, 401 against 403. Database indexing. Query count as a cost.

## Defence questions to be ready for

- Show me a query and tell me what happens if I remove the user condition from it.
- I change the identifier in this URL to a value I guessed. Walk me through every layer
  that stops me.
- Your query count went from a higher number to a lower one. Which single change did the
  most, and why?
- Why is this a 403 and not a 404, or the other way round?

## Next steps

1. Scaffold from Assessment 1's auth (done), prune AI/payment code (done)
2. `records` + `deletion_log` schema, naive `list-records`/`delete-record` first (done)
3. Deploy, test naive versions live, measure real query counts
4. Optimize `list-records` and `delete-record`, redeploy, measure again
5. Build the two-user attack table: two real accounts, attempt cross-access every way
6. Capture evidence
7. Write `DOCUMENTATION.md`
