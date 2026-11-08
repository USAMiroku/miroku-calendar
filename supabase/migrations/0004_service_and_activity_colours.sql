-- 1. Activities can have their own colour on the calendar (empty = the usual venue colour).
alter table activities add column if not exists colour text;

-- 2. Rename the "National Service / Culto nacional" legend entry to just "Service" / "Culto"
--    on every calendar, keeping only the languages each calendar already had.
update calendars c
set settings = jsonb_set(
  c.settings,
  '{legend}',
  (
    select jsonb_agg(
      case when item->>'colour' = 'national' then
        jsonb_set(item, '{label}', (
          select coalesce(jsonb_object_agg(lang,
            case lang when 'pt' then 'Culto' when 'es' then 'Culto' else 'Service' end), '{}'::jsonb)
          from jsonb_object_keys(item->'label') as lang
        ))
      else item end
      order by ord
    )
    from jsonb_array_elements(c.settings->'legend') with ordinality as e(item, ord)
  )
)
where jsonb_typeof(c.settings->'legend') = 'array'
  and exists (select 1 from jsonb_array_elements(c.settings->'legend') x where x->>'colour' = 'national');

-- Check: each calendar's legend after the change.
select slug, settings->'legend' as legend from calendars order by slug;
