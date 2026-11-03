// Writes supabase/seed.sql from the Canada lists in src/lib/seed/canada.ts.
// Run with: npx tsx scripts/make-seed-sql.ts
import { writeFileSync } from "node:fs";
import { canadaSeed } from "../src/lib/seed/canada";

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const j = (o: unknown) => `${q(JSON.stringify(o))}::jsonb`;
const { org, groups, activities, calendars } = canadaSeed;

const out: string[] = [
  "-- Starting data for Miroku Association Canada. Run once, after the schema.",
  "-- Last line: replace the email with the first admin's email address.",
  "begin;",
  `insert into organizations (slug, name) values (${q(org.slug)}, ${q(org.name)});`,
  "create temp table _org as select id from organizations where slug = " + q(org.slug) + ";",
];
for (const g of groups)
  out.push(
    `insert into groups (org_id, key, name, location, time_zone_label, venue_type, sort_order) select id, ${q(g.key)}, ${j(g.name)}, ${j(g.location)}, ${j(g.timeZoneLabel)}, ${q(g.venueType)}, ${g.sortOrder ?? 0} from _org;`,
  );
for (const a of activities)
  out.push(
    `insert into activities (org_id, key, name, add_group_name, is_national_service) select id, ${q(a.key)}, ${j(a.name)}, ${a.addGroupName}, ${a.isNationalService} from _org;`,
  );
for (const c of calendars) {
  const groupKeys = c.groupIds.map((id) => groups.find((g) => g.id === id)!.key);
  const groupSql = groupKeys.length
    ? `(select array_agg(g.id) from groups g where g.org_id = _org.id and g.key in (${groupKeys.map(q).join(", ")}))`
    : "'{}'::uuid[]";
  out.push(
    `insert into calendars (org_id, slug, name, group_ids, include_national, settings) select id, ${q(c.slug)}, ${q(c.name)}, ${groupSql}, ${c.includeNational}, ${j(c.settings)} from _org;`,
  );
}
out.push("insert into invitations (org_id, email, role) select id, 'CHANGE-ME@example.org', 'admin' from _org;");
out.push("commit;");
writeFileSync("supabase/seed.sql", out.join("\n") + "\n");
console.log("wrote supabase/seed.sql");
