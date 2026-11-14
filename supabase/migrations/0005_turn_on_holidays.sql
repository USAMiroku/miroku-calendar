-- Turn on public holidays for the calendars that already exist.
-- Canada calendars get Canada's nationwide holidays; USA calendars get the US federal holidays.
-- Calendars that already have a holiday choice are left alone. Safe to run more than once.
-- After this, each calendar's holidays (country, province, colour) can be changed on the Calendars page.

update calendars c
set settings = c.settings || jsonb_build_object('holidays', jsonb_build_object('country', 'US', 'colour', '#FFF2CC'))
from organizations o
where o.id = c.org_id
  and (o.slug ilike '%usa%' or o.name ilike '%USA%')
  and (c.settings->'holidays') is null;

update calendars c
set settings = c.settings || jsonb_build_object('holidays', jsonb_build_object('country', 'CA', 'colour', '#FFF2CC'))
from organizations o
where o.id = c.org_id
  and (o.slug ilike '%canada%' or o.name ilike '%Canada%')
  and (c.settings->'holidays') is null;

-- Shows what each calendar now has.
select o.name as organization, c.name as calendar, c.settings->'holidays' as holidays
from calendars c join organizations o on o.id = c.org_id
order by o.name, c.name;
