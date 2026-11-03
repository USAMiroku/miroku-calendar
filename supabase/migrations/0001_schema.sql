-- Miroku activities calendar: database schema for Supabase (Postgres).
-- Run this once in the Supabase SQL editor (or with `supabase db push`).


-- One row per organization (Miroku Association Canada, Miroku Association USA, ...)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  created_at timestamptz not null default now()
);

-- Who can edit which organization. Admins manage lists, settings and people; editors manage events.
create table memberships (
  org_id uuid not null references organizations on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('admin', 'editor')),
  primary key (org_id, user_id)
);

-- Pending invitations by email; turned into memberships the first time that person signs in.
create table invitations (
  org_id uuid not null references organizations on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'editor')),
  primary key (org_id, email)
);

-- Names, locations and time zone labels are stored per language: {"en": "...", "fr": "..."}
create table groups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations on delete cascade,
  key text not null,
  name jsonb not null default '{}',
  location jsonb not null default '{}',
  time_zone_label jsonb not null default '{}',
  venue_type text not null check (venue_type in ('centre', 'public', 'home')),
  sort_order int not null default 0,
  archived boolean not null default false,
  unique (org_id, key)
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations on delete cascade,
  key text not null,
  name jsonb not null default '{}',
  add_group_name boolean not null default false,
  is_national_service boolean not null default false,
  last_used_at timestamptz,
  archived boolean not null default false,
  unique (org_id, key)
);

-- A printable calendar: the whole organization, or one centre (group_ids not empty).
-- settings holds languages, banner, colours, open hours and legend (see CalendarSettings in src/lib/types.ts).
create table calendars (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  group_ids uuid[] not null default '{}',
  include_national boolean not null default true,
  settings jsonb not null,
  unique (org_id, slug)
);

create table events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations on delete cascade,
  date date not null,
  start_time time not null,
  end_time time,
  group_id uuid not null references groups,
  activity_id uuid not null references activities,
  note jsonb not null default '{}',
  cancelled boolean not null default false,
  created_by uuid references auth.users,
  updated_at timestamptz not null default now()
);
create index events_org_date on events (org_id, date);

-- A month is visible to the public once it is published for that calendar.
create table published_months (
  calendar_id uuid not null references calendars on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  published_at timestamptz not null default now(),
  primary key (calendar_id, year, month)
);

-- ---------- Row level security ----------

create or replace function is_member(o uuid, min_role text default 'editor')
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.org_id = o and m.user_id = auth.uid()
      and (min_role = 'editor' or m.role = 'admin')
  );
$$;

alter table organizations enable row level security;
alter table memberships enable row level security;
alter table invitations enable row level security;
alter table groups enable row level security;
alter table activities enable row level security;
alter table calendars enable row level security;
alter table events enable row level security;
alter table published_months enable row level security;

-- Public (members of the church, not signed in) can read lists and calendar settings.
create policy "public read" on organizations for select using (true);
create policy "public read" on groups for select using (true);
create policy "public read" on activities for select using (true);
create policy "public read" on calendars for select using (true);
create policy "public read" on published_months for select using (true);

-- Events: editors see everything in their organization; the public only sees published months.
create policy "members read" on events for select using (is_member(org_id));
create policy "public read published" on events for select using (
  exists (
    select 1 from published_months p join calendars c on c.id = p.calendar_id
    where c.org_id = events.org_id
      and p.year = extract(year from events.date) and p.month = extract(month from events.date)
  )
);
create policy "editors write" on events for all using (is_member(org_id)) with check (is_member(org_id));
create policy "editors touch activity" on activities for update using (is_member(org_id)) with check (is_member(org_id));

-- Admins manage lists, calendars, publishing and people.
create policy "admins write" on groups for all using (is_member(org_id, 'admin')) with check (is_member(org_id, 'admin'));
create policy "admins write" on activities for all using (is_member(org_id, 'admin')) with check (is_member(org_id, 'admin'));
create policy "admins write" on calendars for all using (is_member(org_id, 'admin')) with check (is_member(org_id, 'admin'));
create policy "editors publish" on published_months for all
  using (exists (select 1 from calendars c where c.id = calendar_id and is_member(c.org_id)))
  with check (exists (select 1 from calendars c where c.id = calendar_id and is_member(c.org_id)));
create policy "see own memberships" on memberships for select using (user_id = auth.uid() or is_member(org_id, 'admin'));
create policy "admins manage people" on memberships for all using (is_member(org_id, 'admin')) with check (is_member(org_id, 'admin'));
create policy "admins manage invites" on invitations for all using (is_member(org_id, 'admin')) with check (is_member(org_id, 'admin'));

-- When an invited person signs in for the first time, give them their role.
create or replace function accept_invitations()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into memberships (org_id, user_id, role)
  select org_id, new.id, role from invitations where lower(email) = lower(new.email)
  on conflict do nothing;
  delete from invitations where lower(email) = lower(new.email);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function accept_invitations();

-- Lets an admin add someone who already has an account. Returns null for anyone else.
create or replace function user_id_by_email(e text)
returns uuid language sql stable security definer set search_path = public, auth as $$
  select u.id from auth.users u
  where lower(u.email) = lower(e)
    and exists (select 1 from memberships m where m.user_id = auth.uid() and m.role = 'admin')
  limit 1;
$$;

-- People with access to an organization, with their email, for the admin People page.
create or replace function org_people(o uuid)
returns table (user_id uuid, email text, role text) language sql stable security definer set search_path = public, auth as $$
  select m.user_id, u.email::text, m.role from memberships m join auth.users u on u.id = m.user_id
  where m.org_id = o and is_member(o, 'admin')
  order by u.email;
$$;
