-- One row per record a user created. `slug` is the only identifier ever
-- exposed outside this database - `id` (the real primary key, used for every
-- internal join) never appears in a URL or a response body. Random and
-- unrelated to `id`, so guessing or incrementing it gets nowhere. Generated
-- in the Edge Function on insert (see _shared/slug.ts), not as a column
-- default here - 'base64url' as an encode() format needs Postgres 18+, and
-- generating it in application code sidesteps that entirely.
create table records (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  user_id uuid not null references users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The column every "list my records" and "find this one record" query
-- filters and sorts on - the exact case the brief asks to have an index for.
create index records_user_id_created_at_idx on records (user_id, created_at desc);
create unique index records_slug_idx on records (slug);

-- Append-only, and deliberately not foreign-keyed to `records`. The whole
-- point of this table is to survive the row it describes being deleted, so a
-- constraint that would cascade-delete this log along with it would defeat
-- the purpose. `record_title` is a snapshot, not a live reference, so the
-- audit entry stays meaningful after the record itself is gone.
create table deletion_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references users(id) on delete cascade,
  record_id uuid not null,
  record_title text not null,
  deleted_at timestamptz not null default now()
);

create index deletion_log_user_id_idx on deletion_log (user_id, deleted_at desc);

-- Same pattern as every other slice: only the service-role key (used
-- exclusively by Edge Functions) touches these tables, so RLS with zero
-- policies switches off the anon-key REST API's default exposure entirely.
alter table records enable row level security;
alter table deletion_log enable row level security;
