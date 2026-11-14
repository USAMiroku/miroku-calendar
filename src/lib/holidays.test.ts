import { describe, expect, it } from "vitest";
import { easter, holidaysBetween, holidaysForYear, holidaysInMonth } from "./holidays";
import { buildIcs } from "./ics";
import { canadaSeed } from "./seed/canada";

const dates = (list: { date: string; key: string }[]) => Object.fromEntries(list.map((h) => [h.key, h.date]));

describe("public holidays", () => {
  it("finds Easter", () => {
    expect(easter(2026)).toEqual({ m: 4, d: 5 });
    expect(easter(2027)).toEqual({ m: 3, d: 28 });
    expect(easter(2025)).toEqual({ m: 4, d: 20 });
  });

  it("lists Canada's nationwide holidays for 2027", () => {
    expect(dates(holidaysForYear({ country: "CA" }, 2027))).toEqual({
      "new-year": "2027-01-01",
      "good-friday": "2027-03-26",
      "victoria-day": "2027-05-24",
      "canada-day": "2027-07-01",
      "labour-day": "2027-09-06",
      "truth-reconciliation": "2027-09-30",
      thanksgiving: "2027-10-11",
      "remembrance-day": "2027-11-11",
      christmas: "2027-12-25",
      "boxing-day": "2027-12-26",
    });
  });

  it("adds a province's own days", () => {
    const on = dates(holidaysForYear({ country: "CA", region: "ON" }, 2027));
    expect(on["family-day"]).toBe("2027-02-15");
    expect(on["civic-holiday"]).toBe("2027-08-02");
    const qc = dates(holidaysForYear({ country: "CA", region: "QC" }, 2026));
    expect(qc["fete-nationale"]).toBe("2026-06-24");
    expect(qc["patriots-day"]).toBe("2026-05-18");
    expect(qc["victoria-day"]).toBeUndefined();
  });

  it("Victoria Day is the Monday before 25 May, even when the 25th is a Monday", () => {
    expect(dates(holidaysForYear({ country: "CA" }, 2026))["victoria-day"]).toBe("2026-05-18");
    expect(dates(holidaysForYear({ country: "CA" }, 2020))["victoria-day"]).toBe("2020-05-18"); // 25 May 2020 was a Monday
  });

  it("lists the US federal holidays for 2026", () => {
    expect(dates(holidaysForYear({ country: "US" }, 2026))).toEqual({
      "new-year": "2026-01-01",
      "mlk-day": "2026-01-19",
      "presidents-day": "2026-02-16",
      "memorial-day": "2026-05-25",
      juneteenth: "2026-06-19",
      "independence-day": "2026-07-04",
      "labor-day": "2026-09-07",
      "columbus-day": "2026-10-12",
      "veterans-day": "2026-11-11",
      thanksgiving: "2026-11-26",
      christmas: "2026-12-25",
    });
  });

  it("is empty when holidays are off, and spans years", () => {
    expect(holidaysInMonth(null, 2026, 12)).toEqual([]);
    expect(holidaysInMonth({ country: "CA" }, 2026, 12).map((h) => h.date)).toEqual(["2026-12-25", "2026-12-26"]);
    expect(holidaysBetween({ country: "US" }, "2026-12-01", "2027-02-01").map((h) => h.key)).toEqual(["christmas", "new-year", "mlk-day"]);
  });

  it("names holidays in every language", () => {
    for (const h of [...holidaysForYear({ country: "CA", region: "QC" }, 2026), ...holidaysForYear({ country: "US" }, 2026)]) {
      for (const l of ["en", "fr", "pt", "es"] as const) expect(h.name[l]).toBeTruthy();
    }
  });

  it("sends holidays to phones as all-day entries, unless turned off", () => {
    const base = canadaSeed.calendars.find((c) => c.slug === "canada")!;
    const calendar = { ...base, settings: { ...base.settings, holidays: { country: "CA" as const } } };
    const input = { ...canadaSeed, calendar, events: [], pageUrl: "https://x.test/c", holidayRange: { from: "2026-12-01", to: "2027-01-01" }, now: new Date("2026-11-01T00:00:00Z") };
    const ics = buildIcs(input);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261225");
    expect(ics).toContain("DTEND;VALUE=DATE:20261226");
    expect(ics).toContain("SUMMARY:Christmas Day / Noël");
    expect(ics).toContain("TRANSP:TRANSPARENT");
    const off = buildIcs({ ...input, calendar: { ...calendar, settings: { ...calendar.settings, holidays: { country: "CA" as const, onPhones: false } } } });
    expect(off).not.toContain("VALUE=DATE");
  });
});
