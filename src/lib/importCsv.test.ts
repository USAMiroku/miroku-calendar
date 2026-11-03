import { describe, expect, it } from "vitest";
import { parseDate, parseEntriesCsv, parseTime } from "./importCsv";
import { canadaSeed } from "./seed/canada";

describe("CSV import", () => {
  it("dates", () => {
    expect(parseDate("2026-12-06")).toBe("2026-12-06");
    expect(parseDate("12/6/2026")).toBe("2026-12-06");
    expect(parseDate("46362")).toBe("2026-12-06");
  });
  it("times", () => {
    expect(parseTime("11:00")).toBe("11:00");
    expect(parseTime("4:00:00 PM")).toBe("16:00");
    expect(parseTime("6:30 p.m.")).toBe("18:30");
    expect(parseTime("12:00 PM")).toBe("12:00");
    expect(parseTime("16 h 30")).toBe("16:30");
    expect(parseTime("0.75")).toBe("18:00");
  });
  it("matches groups and activities by key or name, ignoring accents", () => {
    const csv = "Date,Start,End,Group,Activity\n12/6/2026,11:00 AM,,Toronto Centre,Monthly Appreciation Service\n12/10/2026,6:00 PM,8:00 PM,Calgary Group,johrei gathering\n12/11/2026,7 PM,,Montreal,Unknown thing\n";
    const rows = parseEntriesCsv(csv, canadaSeed.groups, canadaSeed.activities);
    expect(rows[0]).toMatchObject({ date: "2026-12-06", start: "11:00", end: null, groupId: "g-toronto", activityId: "a-monthly", problems: [] });
    expect(rows[1]).toMatchObject({ groupId: "g-calgary", activityId: "a-johrei", end: "20:00" });
    expect(rows[2].groupId).toBe("g-montreal");
    expect(rows[2].problems).toEqual(["unknown activity “Unknown thing”"]);
  });
});
