import { describe, expect, it } from "vitest";
import { buildIcs, escapeText, foldLine, zonedToUtc } from "./ics";
import { canadaSeed } from "./seed/canada";
import type { CalendarEvent } from "./types";

describe("calendar feed", () => {
  it("turns local times into UTC, with daylight saving", () => {
    expect(zonedToUtc("2026-12-06", "14:00", "America/Toronto").toISOString()).toBe("2026-12-06T19:00:00.000Z");
    expect(zonedToUtc("2026-07-06", "14:00", "America/Toronto").toISOString()).toBe("2026-07-06T18:00:00.000Z");
    expect(zonedToUtc("2026-12-06", "18:30", "America/Halifax").toISOString()).toBe("2026-12-06T22:30:00.000Z");
    // The morning daylight saving starts (2 AM on 8 March 2026 in Toronto)
    expect(zonedToUtc("2026-03-08", "10:00", "America/Toronto").toISOString()).toBe("2026-03-08T14:00:00.000Z");
    expect(zonedToUtc("2026-03-07", "10:00", "America/Toronto").toISOString()).toBe("2026-03-07T15:00:00.000Z");
  });

  it("escapes and folds text", () => {
    expect(escapeText("A, B; C\\D\nE")).toBe("A\\, B\; C\\\\D\\nE");
    const long = "SUMMARY:" + "é".repeat(60);
    const folded = foldLine(long);
    for (const piece of folded.split("\r\n")) expect(new TextEncoder().encode(piece).length).toBeLessThanOrEqual(75);
    expect(folded.split("\r\n").map((p, i) => (i ? p.slice(1) : p)).join("")).toBe(long);
  });

  it("writes each event with its group's time zone and a reminder", () => {
    const calendar = canadaSeed.calendars.find((c) => c.slug === "canada")!;
    const halifax = { ...canadaSeed.groups[1], id: "g-halifax", timeZoneLabel: { en: "Atlantic Time" } };
    const activity = canadaSeed.activities[0];
    const events: CalendarEvent[] = [
      { id: "e1", orgId: calendar.orgId, date: "2026-12-06", start: "18:00", end: "20:00", groupId: halifax.id, activityId: activity.id },
      { id: "e2", orgId: calendar.orgId, date: "2026-12-07", start: "10:00", groupId: "g-toronto", activityId: activity.id, cancelled: true },
    ];
    const ics = buildIcs({ ...canadaSeed, groups: [...canadaSeed.groups, halifax], calendar, events, pageUrl: "https://x.test/miroku-canada/canada", now: new Date("2026-11-01T00:00:00Z") });
    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("UID:e1@miroku-calendar");
    expect(ics).toContain("DTSTART:20261206T220000Z"); // 6 PM Atlantic
    expect(ics).toContain("DTEND:20261207T000000Z");
    expect(ics).toContain("TRIGGER:-PT60M");
    expect(ics).toContain("DTSTART:20261207T150000Z"); // 10 AM Eastern
    expect(ics).toContain("DTEND:20261207T160000Z"); // one hour when no end time
    expect(ics).toContain("STATUS:CANCELLED");
    expect(ics).toMatch(/SUMMARY:CANCELLED: /);
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(1);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });
});
