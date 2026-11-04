import { describe, expect, it } from "vitest";
import { planCopy, weekdayDates } from "./copyMonth";

const ev = (date: string, start = "11:00", groupId = "g", activityId = "a") => ({ date, start, end: null, groupId, activityId });

describe("copy a month", () => {
  it("lists the Sundays of a month", () => {
    expect(weekdayDates(2026, 11, 0)).toEqual(["2026-11-01", "2026-11-08", "2026-11-15", "2026-11-22", "2026-11-29"]);
  });

  it("keeps 2nd Sunday on the 2nd Sunday", () => {
    // Nov 8 2026 is the 2nd Sunday; the 2nd Sunday of Dec 2026 is Dec 13.
    expect(planCopy([ev("2026-11-08")], 2026, 12).map((e) => e.date)).toEqual(["2026-12-13"]);
  });

  it("drops a 5th-week event when the new month has no 5th week", () => {
    // Nov 29 2026 is the 5th Sunday; Feb 2027 has only 4 Sundays.
    expect(planCopy([ev("2026-11-29", "15:00")], 2027, 2)).toEqual([]);
  });

  it("keeps a weekly activity weekly, filling a 5th week", () => {
    // Every Tuesday of Dec 2026 (1, 8, 15, 22, 29) → every Tuesday of Feb 2027 (2, 9, 16, 23) and of Mar 2027 (2…30).
    const tuesdays = ["2026-12-01", "2026-12-08", "2026-12-15", "2026-12-22", "2026-12-29"].map((d) => ev(d, "18:00"));
    expect(planCopy(tuesdays, 2027, 2).map((e) => e.date)).toEqual(["2027-02-02", "2027-02-09", "2027-02-16", "2027-02-23"]);
    // A 4-Thursday month copied into a 5-Thursday month fills all 5.
    const thursdays = ["2027-02-04", "2027-02-11", "2027-02-18", "2027-02-25"].map((d) => ev(d, "18:00"));
    expect(planCopy(thursdays, 2027, 4).map((e) => e.date)).toEqual(["2027-04-01", "2027-04-08", "2027-04-15", "2027-04-22", "2027-04-29"]);
  });

  it("keeps different activities on the same day apart", () => {
    const out = planCopy([ev("2026-11-08", "11:00", "g1", "a1"), ev("2026-11-08", "16:00", "g2", "a2")], 2026, 12);
    expect(out.map((e) => [e.date, e.start, e.groupId])).toEqual([["2026-12-13", "11:00", "g1"], ["2026-12-13", "16:00", "g2"]]);
  });
});
