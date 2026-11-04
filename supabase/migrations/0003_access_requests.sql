-- Sign-up: a person signs in with Google, then asks to join an organization.
-- An admin of that organization approves (as editor or admin) or declines.

create table if not exists access_requests (
  org_id uuid not null references organizations on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  email text not null,
  name text not null default '',
  message text not null default '',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

alter table access_requests enable row level security;

drop policy if exists "ask to join" on access_requests;
create policy "ask to join" on access_requests for insert
  with check (user_id = auth.uid() and not is_member(org_id));
drop policy if exists "see own or as admin" on access_requests;
create policy "see own or as admin" on access_requests for select
  using (user_id = auth.uid() or is_member(org_id, 'admin'));
drop policy if exists "withdraw or decide" on access_requests;
create policy "withdraw or decide" on access_requests for delete
  using (user_id = auth.uid() or is_member(org_id, 'admin'));
