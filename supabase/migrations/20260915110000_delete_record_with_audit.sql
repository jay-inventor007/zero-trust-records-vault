-- Finds, logs, and deletes a record in one round trip and one transaction.
--
-- This replaces a version that did the same three steps as three separate
-- queries from the Edge Function. Besides cutting the round trip count from
-- three to one, being a single function body makes it atomic for free: a
-- plpgsql function either completes entirely or rolls back entirely, so
-- there is no window where the audit log says something was deleted but the
-- delete itself never happened (or the reverse).
--
-- Returns the deleted row's title if it found and deleted a record owned by
-- p_user_id, or no rows at all if nothing matched - which the caller reads
-- as "not found or not yours," never distinguishing between the two.
create or replace function delete_record_with_audit(p_slug text, p_user_id uuid)
returns table (title text)
language plpgsql
as $$
declare
  v_id uuid;
  v_title text;
begin
  -- The ownership check is this select's where clause, not a step that
  -- happens after it.
  select id, records.title into v_id, v_title
  from records
  where slug = p_slug and user_id = p_user_id;

  if v_id is null then
    return;
  end if;

  insert into deletion_log (user_id, record_id, record_title)
  values (p_user_id, v_id, v_title);

  delete from records where id = v_id;

  return query select v_title;
end;
$$;
