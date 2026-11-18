-- All-day events and events that run over several days (for example a holiday break).
-- Safe to run more than once. Existing events are not changed: they stay one-day, timed events.

-- 1. "All day": the event has no start or end time.
alter table events add column if not exists all_day boolean not null default false;
alter table events alter column start_time drop not null;

-- 2. "End date": the last day of an event that runs over several days. Empty = the same day.
alter table events add column if not exists end_date date;

-- 3. "Show as holiday/closed": the event is shaded in the holiday colour.
alter table events add column if not exists closed boolean not null default false;

-- 4. Checks: the end date can't be before the start date, and an event that isn't all day has a start time.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'events_end_date_after_start') then
    alter table events add constraint events_end_date_after_start check (end_date is null or end_date >= date);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'events_time_unless_all_day') then
    alter table events add constraint events_time_unless_all_day check (all_day or start_time is not null);
  end if;
end $$;

-- 5. Lets a month find the periods that started in an earlier month.
create index if not exists events_org_end_date on events (org_id, end_date) where end_date is not null;

-- Check: the new columns are there.
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'events' and column_name in ('all_day', 'end_date', 'closed', 'start_time')
order by column_name;
