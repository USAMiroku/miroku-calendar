// North American time zones, named the way they appear on the calendar, in every language.

import type { Lang, Localized } from "./types";

export const TIME_ZONES: { id: string; iana: string; label: Record<Lang, string> }[] = [
  { id: "newfoundland", iana: "America/St_Johns", label: { en: "Newfoundland Time", fr: "heure de Terre-Neuve", pt: "horário da Terra Nova", es: "hora de Terranova" } },
  { id: "atlantic", iana: "America/Halifax", label: { en: "Atlantic Time", fr: "heure de l’Atlantique", pt: "horário do Atlântico", es: "hora del Atlántico" } },
  { id: "eastern", iana: "America/Toronto", label: { en: "Eastern Time", fr: "heure de l’Est", pt: "horário do Leste", es: "hora del Este" } },
  { id: "central", iana: "America/Winnipeg", label: { en: "Central Time", fr: "heure du Centre", pt: "horário Central", es: "hora del Centro" } },
  { id: "mountain", iana: "America/Edmonton", label: { en: "Mountain Time", fr: "heure des Rocheuses", pt: "horário das Montanhas", es: "hora de la Montaña" } },
  { id: "pacific", iana: "America/Vancouver", label: { en: "Pacific Time", fr: "heure du Pacifique", pt: "horário do Pacífico", es: "hora del Pacífico" } },
  { id: "alaska", iana: "America/Anchorage", label: { en: "Alaska Time", fr: "heure de l’Alaska", pt: "horário do Alasca", es: "hora de Alaska" } },
  { id: "hawaii", iana: "Pacific/Honolulu", label: { en: "Hawaii Time", fr: "heure d’Hawaï", pt: "horário do Havaí", es: "hora de Hawái" } },
];

/** Which preset a stored label matches (by its English, or any language), or "" for none / "custom". */
export function timeZoneId(label: Localized): string {
  const norm = (v: string) => v.trim().toLowerCase().replace(/'/g, "’");
  const values = Object.values(label).filter((v) => v && v.trim()).map((v) => norm(v!));
  if (values.length === 0) return "";
  const hit = TIME_ZONES.find((z) => values.some((v) => Object.values(z.label).map(norm).includes(v)));
  return hit ? hit.id : "custom";
}

export function timeZoneLabel(id: string): Localized {
  const z = TIME_ZONES.find((t) => t.id === id);
  return z ? { ...z.label } : {};
}

/** Calendars that have not chosen a time zone are on Eastern Time, like the Toronto headquarters. */
export const DEFAULT_HOME_ZONE = "eastern";

/** The IANA zone (e.g. "America/Vancouver") for a preset id, or for the calendar's home zone when the id is unknown. */
export function ianaZone(id: string | undefined, home: string | undefined = DEFAULT_HOME_ZONE): string {
  const z = TIME_ZONES.find((t) => t.id === id) ?? TIME_ZONES.find((t) => t.id === home) ?? TIME_ZONES.find((t) => t.id === DEFAULT_HOME_ZONE)!;
  return z.iana;
}
