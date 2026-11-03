"use server";

// Everything that changes data. Each action checks the person's role; the database's
// row-level security checks again, so a bug here cannot let a stranger edit.

import { revalidatePath } from "next/cache";
import { DEMO_MODE, supabaseServer } from "./supabase/server";
import { roleIn, type Role } from "./auth";
import type { CalendarSettings, Localized, VenueType } from "./types";

export type Result = { ok: true; message?: string } | { ok: false; error: string };

const DEMO: Result = { ok: false, error: "Demo mode: changes are not saved until a database is connected." };

async function orgFor(orgSlug: string, need: Role) {
  const sb = await supabaseServer();
  const { data: org } = await sb.from("organizations").select("id").eq("slug", orgSlug).maybeSingle();
  if (!org) throw new Error("Organization not found");
  const role = await roleIn(org.id);
  if (!role || (need === "admin" && role !== "admin")) throw new Error("You don't have permission to do that.");
  return { sb, orgId: org.id as string };
}

async function run(fn: () => Promise<Result | void>): Promise<Result> {
  if (DEMO_MODE) return DEMO;
  try {
    const r = await fn();
    revalidatePath("/", "layout");
    return r ?? { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const clean = (l: Localized | undefined): Localized =>
  Object.fromEntries(Object.entries(l ?? {}).map(([k, v]) => [k, (v ?? "").trim()]).filter(([, v]) => v));

// ---------- events ----------

export interface EventInput {
  id?: string;
  date: string;
  start: string;
  end?: string | null;
  groupId: string;
  activityId: string;
  note?: Localized;
  cancelled?: boolean;
  /** Also create the same event on the same weekday for the rest of the month. */
  repeatWeekly?: boolean;
}

function weeklyDates(date: string): string[] {
  const [y, m, d] = date.split("-").map(Number);
  const out = [date];
  for (let day = d + 7; ; day += 7) {
    const dt = new Date(Date.UTC(y, m - 1, day));
    if (dt.getUTCMonth() !== m - 1) break;
    out.push(dt.toISOString().slice(0, 10));
  }
  return out;
}

export async function saveEvent(orgSlug: string, input: EventInput): Promise<Result> {
  return run(async () => {
    const { sb, orgId } = await orgFor(orgSlug, "editor");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(input.start)) throw new Error("Please give a date and a start time.");
    if (input.end && input.end <= input.start) throw new Error("The end time must be after the start time.");
    const { data: u } = await sb.auth.getUser();
    const row = {
      org_id: orgId,
      start_time: input.start,
      end_time: input.end || null,
      group_id: input.groupId,
      activity_id: input.activityId,
      note: clean(input.note),
      cancelled: !!input.cancelled,
      updated_at: new Date().toISOString(),
    };
    if (input.id) {
      const { error } = await sb.from("events").update({ ...row, date: input.date }).eq("id", input.id).eq("org_id", orgId);
      if (error) throw error;
    } else {
      const dates = input.repeatWeekly ? weeklyDates(input.date) : [input.date];
      const { error } = await sb.from("events").insert(dates.map((date) => ({ ...row, date, created_by: u.user?.id })));
      if (error) throw error;
    }
    await sb.from("activities").update({ last_used_at: new Date().toISOString() }).eq("id", input.activityId);
    return { ok: true, message: "Saved." };
  });
}

export async function deleteEvent(orgSlug: string, id: string): Promise<Result> {
  return run(async () => {
    const { sb, orgId } = await orgFor(orgSlug, "editor");
    const { error } = await sb.from("events").delete().eq("id", id).eq("org_id", orgId);
    if (error) throw error;
  });
}

export async function copyMonth(orgSlug: string, fromYear: number, fromMonth: number, toYear: number, toMonth: number): Promise<Result> {
  // Copies each event to the same weekday of the same week number (1st Sunday → 1st Sunday).
  return run(async () => {
    const { sb, orgId } = await orgFor(orgSlug, "editor");
    const pad = (n: number) => String(n).padStart(2, "0");
    const from = `${fromYear}-${pad(fromMonth)}-01`;
    const to = fromMonth === 12 ? `${fromYear + 1}-01-01` : `${fromYear}-${pad(fromMonth + 1)}-01`;
    const { data, error } = await sb.from("events").select("*").eq("org_id", orgId).gte("date", from).lt("date", to);
    if (error) throw error;
    const rows = [];
    for (const e of data ?? []) {
      const d = new Date(e.date + "T00:00:00Z");
      const weekday = d.getUTCDay();
      const nth = Math.floor((d.getUTCDate() - 1) / 7); // 0 = first
      const first = new Date(Date.UTC(toYear, toMonth - 1, 1));
      const offset = (weekday - first.getUTCDay() + 7) % 7;
      const target = new Date(Date.UTC(toYear, toMonth - 1, 1 + offset + nth * 7));
      if (target.getUTCMonth() !== toMonth - 1) continue; // no 5th Sunday this month
      rows.push({
        org_id: orgId, date: target.toISOString().slice(0, 10), start_time: e.start_time, end_time: e.end_time,
        group_id: e.group_id, activity_id: e.activity_id, note: e.note, cancelled: false,
      });
    }
    if (rows.length) {
      const { error: insErr } = await sb.from("events").insert(rows);
      if (insErr) throw insErr;
    }
    return { ok: true, message: `Copied ${rows.length} events.` };
  });
}

export async function setPublished(orgSlug: string, calendarId: string, year: number, month: number, published: boolean): Promise<Result> {
  return run(async () => {
    const { sb } = await orgFor(orgSlug, "editor");
    const q = published
      ? sb.from("published_months").upsert({ calendar_id: calendarId, year, month })
      : sb.from("published_months").delete().eq("calendar_id", calendarId).eq("year", year).eq("month", month);
    const { error } = await q;
    if (error) throw error;
  });
}

// ---------- lists (admins) ----------

export interface GroupInput {
  id?: string;
  key: string;
  name: Localized;
  location: Localized;
  timeZoneLabel: Localized;
  venueType: VenueType;
  sortOrder?: number;
}

export async function saveGroup(orgSlug: string, g: GroupInput): Promise<Result> {
  return run(async () => {
    const { sb, orgId } = await orgFor(orgSlug, "admin");
    if (!g.key.trim()) throw new Error("Please give the group a short name.");
    const row = {
      org_id: orgId, key: g.key.trim(), name: clean(g.name), location: clean(g.location),
      time_zone_label: clean(g.timeZoneLabel), venue_type: g.venueType, sort_order: g.sortOrder ?? 0,
    };
    const { error } = g.id ? await sb.from("groups").update(row).eq("id", g.id) : await sb.from("groups").insert(row);
    if (error) throw error;
  });
}

export interface ActivityInput {
  id?: string;
  key: string;
  name: Localized;
  addGroupName: boolean;
  isNationalService: boolean;
}

export async function saveActivity(orgSlug: string, a: ActivityInput): Promise<Result> {
  return run(async () => {
    const { sb, orgId } = await orgFor(orgSlug, "admin");
    if (!a.key.trim()) throw new Error("Please give the activity a short name.");
    const row = { org_id: orgId, key: a.key.trim(), name: clean(a.name), add_group_name: a.addGroupName, is_national_service: a.isNationalService };
    const { error } = a.id ? await sb.from("activities").update(row).eq("id", a.id) : await sb.from("activities").insert(row);
    if (error) throw error;
  });
}

/** Lists are archived rather than deleted, so past months keep printing correctly. */
export async function archiveItem(orgSlug: string, table: "groups" | "activities", id: string): Promise<Result> {
  return run(async () => {
    const { sb, orgId } = await orgFor(orgSlug, "admin");
    const { error } = await sb.from(table).update({ archived: true }).eq("id", id).eq("org_id", orgId);
    if (error) throw error;
  });
}

// ---------- calendars and people (admins) ----------

export interface CalendarInput {
  id?: string;
  slug: string;
  name: string;
  groupIds: string[];
  includeNational: boolean;
  settings: CalendarSettings;
}

export async function saveCalendar(orgSlug: string, c: CalendarInput): Promise<Result> {
  return run(async () => {
    const { sb, orgId } = await orgFor(orgSlug, "admin");
    const slug = c.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(slug) || ["edit", "admin"].includes(slug)) throw new Error("The web name may use only a–z, 0–9 and dashes.");
    const row = { org_id: orgId, slug, name: c.name.trim(), group_ids: c.groupIds, include_national: c.includeNational, settings: c.settings };
    const { error } = c.id ? await sb.from("calendars").update(row).eq("id", c.id) : await sb.from("calendars").insert(row);
    if (error) throw error;
  });
}

export async function invitePerson(orgSlug: string, email: string, role: Role): Promise<Result> {
  return run(async () => {
    const { sb, orgId } = await orgFor(orgSlug, "admin");
    const clean = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(clean)) throw new Error("Please enter a valid email address.");
    // Already has an account? Add them directly; otherwise they get the role on first sign-in.
    const { data: existing } = await sb.rpc("user_id_by_email", { e: clean });
    if (existing) {
      const { error } = await sb.from("memberships").upsert({ org_id: orgId, user_id: existing, role });
      if (error) throw error;
    } else {
      const { error } = await sb.from("invitations").upsert({ org_id: orgId, email: clean, role });
      if (error) throw error;
    }
    return { ok: true, message: `Invited ${clean}. They can now sign in with an email link.` };
  });
}

export async function removePerson(orgSlug: string, kind: "member" | "invite", idOrEmail: string): Promise<Result> {
  return run(async () => {
    const { sb, orgId } = await orgFor(orgSlug, "admin");
    const { error } =
      kind === "member"
        ? await sb.from("memberships").delete().eq("org_id", orgId).eq("user_id", idOrEmail)
        : await sb.from("invitations").delete().eq("org_id", orgId).eq("email", idOrEmail);
    if (error) throw error;
  });
}

// ---------- CSV import (admins) ----------

export interface ImportRow {
  date: string;
  start: string;
  end: string | null;
  groupId: string;
  activityId: string;
}

export async function importEvents(orgSlug: string, rows: ImportRow[]): Promise<Result> {
  return run(async () => {
    const { sb, orgId } = await orgFor(orgSlug, "admin");
    const chunk = 500;
    for (let i = 0; i < rows.length; i += chunk) {
      const { error } = await sb.from("events").insert(
        rows.slice(i, i + chunk).map((r) => ({
          org_id: orgId, date: r.date, start_time: r.start, end_time: r.end, group_id: r.groupId, activity_id: r.activityId,
        })),
      );
      if (error) throw error;
    }
    return { ok: true, message: `Imported ${rows.length} events.` };
  });
}
