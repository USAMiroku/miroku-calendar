// Builds the calendar feed (an .ics file) that phones and calendar apps subscribe to.
// Times are written in UTC so every app places them correctly, whatever the group's time zone.

import { eventsForCalendar, joinDistinct, LABELS, pick, typography } from "./format";
import { holidaysBetween } from "./holidays";
import { ianaZone, timeZoneId } from "./timeZones";
import type { Activity, Calendar, CalendarEvent, Group } from "./types";

export interface FeedInput {
  calendar: Calendar;
  groups: Group[];
  activities: Activity[];
  events: CalendarEvent[];
  /** Absolute address of the calendar page, e.g. https://miroku-calendar.vercel.app/miroku-canada/canada */
  pageUrl: string;
  /** Dates to include holidays for: from (included) to (not included), YYYY-MM-DD. No range = no holidays. */
  holidayRange?: { from: string; to: string };
  now?: Date;
}

/** Reminder before each activity, in minutes. */
export const REMINDER_MINUTES = 60;

/** How far a time zone is ahead of UTC at a given instant, in minutes. */
function offsetMinutes(instant: number, zone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(instant));
  const n = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const wall = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second"));
  return Math.round((wall - instant) / 60000);
}

/** "2026-12-06" at "14:30" on the clock in `zone` → the UTC instant. */
export function zonedToUtc(date: string, time: string, zone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, h, min || 0);
  let t = wall - offsetMinutes(wall, zone) * 60000;
  t = wall - offsetMinutes(t, zone) * 60000; // second pass settles the hour around daylight-saving changes
  return new Date(t);
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Escapes text for an .ics value. */
export function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Splits a line into pieces of at most 75 bytes, as the .ics format requires. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + b > limit) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export function buildIcs({ calendar, groups, activities, events, pageUrl, holidayRange, now = new Date() }: FeedInput): string {
  const home = calendar.settings.timeZone;
  const groupById = new Map(groups.map((g) => [g.id, g]));
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Miroku Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendar.name)}`,
    `X-WR-TIMEZONE:${ianaZone(home)}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ];

  for (const row of eventsForCalendar({ calendar, groups, activities, events })) {
    const e = row.event;
    const group = groupById.get(e.groupId)!;
    const zone = ianaZone(timeZoneId(group.timeZoneLabel ?? {}), home);
    const start = zonedToUtc(e.date, e.start, zone);
    let end = e.end ? zonedToUtc(e.date, e.end, zone) : null;
    if (!end || end <= start) end = new Date(start.getTime() + 60 * 60000);

    const [first, ...others] = row.lines;
    const cancelled = e.cancelled ? `${LABELS.cancelled[first.lang]}: ` : "";
    const description: string[] = [];
    if (first.note) description.push(first.note);
    for (const l of others) {
      if (l.activity && l.activity !== first.activity) description.push(l.activity);
      if (l.note && l.note !== first.note) description.push(l.note);
    }
    description.push(`${pageUrl}/${e.date.slice(0, 4)}/${Number(e.date.slice(5, 7))}`);

    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@miroku-calendar`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${escapeText(cancelled + first.activity)}`,
    );
    if (first.location) lines.push(`LOCATION:${escapeText(first.location)}`);
    lines.push(`DESCRIPTION:${escapeText(description.join("\n"))}`);
    if (e.cancelled) lines.push("STATUS:CANCELLED");
    else {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeText(first.activity)}`,
        `TRIGGER:-PT${REMINDER_MINUTES}M`,
        "END:VALARM",
      );
    }
    lines.push("END:VEVENT");
  }
  // Public holidays as all-day entries that don't mark the person as busy and have no reminder.
  const hs = calendar.settings.holidays;
  if (holidayRange && hs && hs.onPhones !== false) {
    const langs = calendar.settings.languages;
    for (const h of holidaysBetween(hs, holidayRange.from, holidayRange.to)) {
      const [y, m, d] = h.date.split("-").map(Number);
      const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
      lines.push(
        "BEGIN:VEVENT",
        `UID:holiday-${hs.country}-${h.key}-${h.date}@miroku-calendar`,
        `DTSTAMP:${stamp(now)}`,
        `DTSTART;VALUE=DATE:${h.date.replace(/-/g, "")}`,
        `DTEND;VALUE=DATE:${next.replace(/-/g, "")}`,
        `SUMMARY:${escapeText(joinDistinct(langs.map((l) => typography(pick(h.name, l, langs[0]))), " / "))}`,
        `DESCRIPTION:${escapeText(joinDistinct(langs.map((l) => LABELS.holiday[l]), " / "))}`,
        "TRANSP:TRANSPARENT",
        "END:VEVENT",
      );
    }
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
