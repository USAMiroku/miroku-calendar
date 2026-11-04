// Reads organizations, lists and events, from Supabase or (demo mode) the built-in Canada sample.

import type { Activity, Calendar, CalendarEvent, Group, MonthData, Organization } from "./types";
import { DEMO_MODE, supabaseServer } from "./supabase/server";
import { canadaSeed } from "./seed/canada";

export interface OrgWithCalendars extends Organization {
  calendars: Calendar[];
}

const pad = (n: number) => String(n).padStart(2, "0");
export const monthRange = (y: number, m: number) => {
  const next = m === 12 ? [y + 1, 1] : [y, m + 1];
  return { from: `${y}-${pad(m)}-01`, to: `${next[0]}-${pad(next[1])}-01` };
};

// ---------- row mappers (database snake_case → app types) ----------

/* eslint-disable @typescript-eslint/no-explicit-any */
export const toGroup = (r: any): Group => ({
  id: r.id, orgId: r.org_id, key: r.key, name: r.name, location: r.location,
  timeZoneLabel: r.time_zone_label, venueType: r.venue_type, sortOrder: r.sort_order, archived: r.archived,
});
export const toActivity = (r: any): Activity => ({
  id: r.id, orgId: r.org_id, key: r.key, name: r.name, addGroupName: r.add_group_name,
  isNationalService: r.is_national_service, lastUsedAt: r.last_used_at, archived: r.archived,
});
export const toCalendar = (r: any): Calendar => ({
  id: r.id, orgId: r.org_id, slug: r.slug, name: r.name, groupIds: r.group_ids ?? [],
  includeNational: r.include_national, settings: r.settings,
});
export const toEvent = (r: any): CalendarEvent => ({
  id: r.id, orgId: r.org_id, date: r.date, start: String(r.start_time).slice(0, 5),
  end: r.end_time ? String(r.end_time).slice(0, 5) : null, groupId: r.group_id, activityId: r.activity_id,
  note: r.note ?? {}, cancelled: r.cancelled,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------- queries ----------

export async function listOrganizations(): Promise<OrgWithCalendars[]> {
  if (DEMO_MODE) return [{ ...canadaSeed.org, calendars: canadaSeed.calendars }];
  const sb = await supabaseServer();
  const { data, error } = await sb.from("organizations").select("*, calendars(*)").order("name");
  if (error) throw error;
  return (data ?? []).map((o) => ({ id: o.id, slug: o.slug, name: o.name, calendars: (o.calendars ?? []).map(toCalendar) }));
}

/** Lists include archived groups and activities so past months still print; editors' dropdowns hide them. */
export async function getOrgLists(orgSlug: string) {
  if (DEMO_MODE) {
    if (orgSlug !== canadaSeed.org.slug) return null;
    return { org: canadaSeed.org, groups: canadaSeed.groups, activities: canadaSeed.activities, calendars: canadaSeed.calendars };
  }
  const sb = await supabaseServer();
  const { data: org } = await sb.from("organizations").select("*").eq("slug", orgSlug).maybeSingle();
  if (!org) return null;
  const [g, a, c] = await Promise.all([
    sb.from("groups").select("*").eq("org_id", org.id).order("sort_order"),
    sb.from("activities").select("*").eq("org_id", org.id).order("key"),
    sb.from("calendars").select("*").eq("org_id", org.id).order("name"),
  ]);
  return {
    org: { id: org.id, slug: org.slug, name: org.name } as Organization,
    groups: (g.data ?? []).map(toGroup),
    activities: (a.data ?? []).map(toActivity),
    calendars: (c.data ?? []).map(toCalendar),
  };
}

export async function getMonthData(orgSlug: string, calSlug: string, year: number, month: number): Promise<MonthData | null> {
  const lists = await getOrgLists(orgSlug);
  const calendar = lists?.calendars.find((c) => c.slug === calSlug);
  if (!lists || !calendar) return null;
  const { from, to } = monthRange(year, month);

  if (DEMO_MODE) {
    const events = canadaSeed.events.filter((e) => e.date >= from && e.date < to);
    return { ...lists, calendar, events, year, month, published: true };
  }

  const sb = await supabaseServer();
  const [ev, pub] = await Promise.all([
    sb.from("events").select("*").eq("org_id", lists.org.id).gte("date", from).lt("date", to),
    sb.from("published_months").select("calendar_id").eq("calendar_id", calendar.id).eq("year", year).eq("month", month).maybeSingle(),
  ]);
  if (ev.error) throw ev.error;
  return { ...lists, calendar, events: (ev.data ?? []).map(toEvent), year, month, published: !!pub.data };
}

/** All of an organization's events in a month, for the editor, plus which calendars have published it. */
export async function getOrgMonth(orgId: string, year: number, month: number) {
  const { from, to } = monthRange(year, month);
  if (DEMO_MODE) {
    return {
      events: canadaSeed.events.filter((e) => e.date >= from && e.date < to),
      publishedCalendarIds: canadaSeed.calendars.map((c) => c.id),
    };
  }
  const sb = await supabaseServer();
  const [ev, pub] = await Promise.all([
    sb.from("events").select("*").eq("org_id", orgId).gte("date", from).lt("date", to).order("date").order("start_time"),
    sb.from("published_months").select("calendar_id").eq("year", year).eq("month", month),
  ]);
  if (ev.error) throw ev.error;
  return { events: (ev.data ?? []).map(toEvent), publishedCalendarIds: (pub.data ?? []).map((p) => p.calendar_id as string) };
}

/** Every language used by any of the organization's calendars, primary languages first. */
export function orgLanguages(calendars: Calendar[]) {
  const out: import("./types").Lang[] = [];
  for (const c of calendars) for (const l of c.settings.languages) if (!out.includes(l)) out.push(l);
  return out.length ? out : (["en"] as import("./types").Lang[]);
}

/** A calendar's published events from three months back to a year ahead, for the phone calendar feed. */
export async function getFeedData(orgSlug: string, calSlug: string, today = new Date()) {
  const lists = await getOrgLists(orgSlug);
  const calendar = lists?.calendars.find((c) => c.slug === calSlug);
  if (!lists || !calendar) return null;
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth() + 1;
  const back = m - 3 < 1 ? [y - 1, m + 9] : [y, m - 3];
  const from = monthRange(back[0], back[1]).from;
  const to = monthRange(y + 1, m).to;

  if (DEMO_MODE) {
    return { ...lists, calendar, events: canadaSeed.events.filter((e) => e.date >= from && e.date < to) };
  }
  const sb = await supabaseServer();
  const [ev, pub] = await Promise.all([
    sb.from("events").select("*").eq("org_id", lists.org.id).gte("date", from).lt("date", to),
    sb.from("published_months").select("year, month").eq("calendar_id", calendar.id),
  ]);
  if (ev.error) throw ev.error;
  // Only months this calendar has published, so drafts never reach anyone's phone.
  const published = new Set((pub.data ?? []).map((p) => `${p.year}-${pad(p.month)}`));
  const events = (ev.data ?? []).map(toEvent).filter((e) => published.has(e.date.slice(0, 7)));
  return { ...lists, calendar, events };
}
