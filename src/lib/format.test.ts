import { describe, expect, it } from "vitest";
import { formatActivity, formatDay, formatEvent, formatMonthTitle, formatTime, label, colourCategory, sortEvents } from "./format";
import { canadaSeed } from "./seed/canada";

const g = (key: string) => canadaSeed.groups.find((x) => x.key === key)!;
const a = (key: string) => canadaSeed.activities.find((x) => x.key === key)!;

describe("English times (12-hour)", () => {
  it.each([
    ["11:00", null, "11 AM"],
    ["16:00", "19:00", "4 – 7 PM"],
    ["09:00", "11:00", "9 – 11 AM"],
    ["11:30", "13:00", "11:30 AM – 1 PM"],
    ["18:30", null, "6:30 PM"],
    ["12:00", null, "12 PM"],
  ])("%s–%s → %s", (s, e, want) => expect(formatTime("en", s, e)).toBe(want));

  it("adds the time zone", () => expect(formatTime("en", "18:00", "20:00", "Mountain Time")).toBe("6 – 8 PM (Mountain Time)"));
});

describe("Québec French times (24-hour)", () => {
  it.each([
    ["11:00", null, "11 h"],
    ["16:00", "19:00", "16 h à 19 h"],
    ["18:30", null, "18 h 30"],
    ["12:00", null, "12 h (midi)"],
    ["11:30", "13:00", "11 h 30 à 13 h"],
  ])("%s–%s → %s", (s, e, want) => expect(formatTime("fr", s, e)).toBe(want));

  it("adds the time zone", () =>
    expect(formatTime("fr", "18:00", "20:00", "heure des Rocheuses")).toBe("18 h à 20 h (heure des Rocheuses)"));
});

describe("Portuguese and Spanish times", () => {
  it("pt", () => {
    expect(formatTime("pt", "16:00", "19:00")).toBe("16h às 19h");
    expect(formatTime("pt", "18:30")).toBe("18h30");
  });
  it("es", () => {
    expect(formatTime("es", "16:00", "19:00")).toBe("4 – 7 p. m.");
    expect(formatTime("es", "11:30", "13:00")).toBe("11:30 a. m. – 1 p. m.");
  });
});

describe("days and month title", () => {
  it("day names", () => {
    expect(formatDay("en", "2026-12-06")).toBe("Sunday");
    expect(formatDay("fr", "2026-12-06")).toBe("Dimanche");
  });
  it("month title", () => {
    expect(formatMonthTitle(["en", "fr"], 2026, 12)).toBe("DECEMBER 2026 | DÉCEMBRE 2026");
    expect(formatMonthTitle(["en"], 2026, 12)).toBe("DECEMBER 2026");
    expect(formatMonthTitle(["en", "pt"], 2026, 3)).toBe("MARCH 2026 | MARÇO 2026");
  });
  it("column labels drop repeats", () => {
    expect(label("date", ["en", "fr"])).toBe("DATE");
    expect(label("day", ["en", "fr"])).toBe("DAY / JOUR");
  });
});

describe("activity titles and colours", () => {
  it("adds the group name", () => {
    expect(formatActivity("en", a("Johrei Gathering"), g("Calgary"))).toBe("Johrei Gathering – Calgary Group");
    expect(formatActivity("fr", a("Johrei Gathering"), g("Calgary"))).toBe("Rencontre de Johrei – Groupe de Calgary");
    expect(formatActivity("fr", a("Johrei Gathering"), g("Edmonton"))).toBe("Rencontre de Johrei – Groupe d’Edmonton");
  });
  it("does not add the group name to national services", () => {
    expect(formatActivity("en", a("Monthly Appreciation Service"), g("Toronto Centre"))).toBe(
      "MONTHLY APPRECIATION SERVICE – Canada National Service",
    );
  });
  it("colours", () => {
    expect(colourCategory(a("Monthly Appreciation Service"), g("Montréal"))).toBe("national");
    expect(colourCategory(a("Johrei Gathering"), g("Montréal"))).toBe("public");
    expect(colourCategory(a("Johrei Gathering"), g("Edmonton"))).toBe("default");
  });
  it("full event in both languages", () => {
    const ev = formatEvent(
      { id: "1", orgId: "o", date: "2026-12-10", start: "18:00", end: "20:00", groupId: g("Calgary").id, activityId: a("Johrei Gathering").id },
      g("Calgary"),
      a("Johrei Gathering"),
      ["en", "fr"],
    );
    expect(ev.lines[0]).toMatchObject({ day: "Thursday", time: "6 – 8 PM (Mountain Time)" });
    expect(ev.lines[1]).toMatchObject({ day: "Jeudi", time: "18 h à 20 h (heure des Rocheuses)" });
    expect(ev.colour).toBe("public");
  });
  it("sorts by date then start", () => {
    const s = sortEvents([
      { date: "2026-12-02", start: "18:00" },
      { date: "2026-12-01", start: "19:00" },
      { date: "2026-12-01", start: "09:30" },
    ]);
    expect(s.map((e) => e.date + " " + e.start)).toEqual(["2026-12-01 09:30", "2026-12-01 19:00", "2026-12-02 18:00"]);
  });
});
