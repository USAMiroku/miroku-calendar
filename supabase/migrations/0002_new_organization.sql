-- Lets an admin of any organization create another organization (for example Miroku Association USA).
-- The person who creates it becomes its first admin, and it starts with one calendar.
-- Also closes access to helper functions that only the app itself should call.

create or replace function create_organization(p_slug text, p_name text, p_calendar_slug text, p_settings jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null or not exists (select 1 from memberships where user_id = auth.uid() and role = 'admin') then
    raise exception 'Only an admin can create an organization.';
  end if;
  if exists (select 1 from organizations where slug = p_slug) then
    raise exception 'That web name is already used by another organization.';
  end if;
  insert into organizations (slug, name) values (p_slug, p_name) returning id into new_id;
  insert into memberships (org_id, user_id, role) values (new_id, auth.uid(), 'admin');
  insert into calendars (org_id, slug, name, settings) values (new_id, p_calendar_slug, p_name, p_settings);
  return p_slug;
end;
$$;

revoke execute on function create_organization(text, text, text, jsonb) from anon, public;
grant execute on function create_organization(text, text, text, jsonb) to authenticated;

revoke execute on function accept_invitations() from anon, authenticated, public;
revoke execute on function org_people(uuid) from anon, public;
revoke execute on function user_id_by_email(text) from anon, public;
