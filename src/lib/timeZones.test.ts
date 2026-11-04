import { describe, expect, it } from "vitest";
import { timeZoneId, timeZoneLabel } from "./timeZones";
import { formatTime } from "./format";

describe("time zones", () => {
  it("recognizes a stored label", () => {
    expect(timeZoneId({ en: "Mountain Time", fr: "heure des Rocheuses" })).toBe("mountain");
    expect(timeZoneId({})).toBe("");
    expect(timeZoneId({ en: "eastern time" })).toBe("eastern");
    expect(timeZoneId({ en: "Yukon Time" })).toBe("custom");
  });
  it("fills every language and shows after the time", () => {
    const l = timeZoneLabel("pacific");
    expect(formatTime("en", "18:00", "20:00", l.en)).toBe("6 – 8 PM (Pacific Time)");
    expect(formatTime("fr", "18:00", "20:00", l.fr)).toBe("18 h à 20 h (heure du Pacifique)");
  });
});
