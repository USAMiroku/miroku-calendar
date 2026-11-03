import { describe, expect, it } from "vitest";
import { newOrgSettings, slugify } from "./newOrg";

describe("new organization", () => {
  it("makes a web name from the organization name", () => {
    expect(slugify("Miroku Association USA")).toBe("miroku-association-usa");
    expect(slugify("  Église du Québec! ")).toBe("eglise-du-quebec");
  });
  it("starts the calendar in the chosen languages only", () => {
    const s = newOrgSettings("Miroku Association USA", ["en", "es"]);
    expect(s.languages).toEqual(["en", "es"]);
    expect(s.titleLines).toEqual([{ en: "Miroku Association USA" }, { en: "ACTIVITIES CALENDAR", es: "CALENDARIO DE ACTIVIDADES" }]);
    expect(Object.keys(s.legend[0].label)).toEqual(["en", "es"]);
    expect(s.openHours).toEqual({});
  });
});
