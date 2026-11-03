// Starting settings for a brand-new organization's first calendar. Everything can be changed later on the Calendars page.

import type { CalendarSettings, Lang, Localized } from "./types";
import { canadaCalendar } from "./seed/canada";

const pick = (all: Record<Lang, string>, langs: Lang[]): Localized =>
  Object.fromEntries(langs.map((l) => [l, all[l]]));

const TITLE: Record<Lang, string> = {
  en: "ACTIVITIES CALENDAR",
  fr: "CALENDRIER DES ACTIVITÉS",
  pt: "CALENDÁRIO DE ATIVIDADES",
  es: "CALENDARIO DE ACTIVIDADES",
};
const NATIONAL: Record<Lang, string> = { en: "National Service", fr: "Service national", pt: "Culto nacional", es: "Culto nacional" };
const REGIONAL: Record<Lang, string> = {
  en: "Regional group gathering",
  fr: "Rencontre de groupe régionale",
  pt: "Reunião regional de grupo",
  es: "Reunión regional de grupo",
};
const LOCAL: Record<Lang, string> = {
  en: "Member home or centre activity",
  fr: "Activité au centre ou à domicile",
  pt: "Atividade no centro ou em casa de membro",
  es: "Actividad en el centro o en casa de un miembro",
};

export function newOrgSettings(name: string, languages: [Lang] | [Lang, Lang]): CalendarSettings {
  const langs = [...languages];
  return {
    ...canadaCalendar.settings,
    languages,
    titleLines: [{ [langs[0]]: name }, pick(TITLE, langs)],
    openHours: {},
    legend: [
      { colour: "national", label: pick(NATIONAL, langs) },
      { colour: "public", label: pick(REGIONAL, langs) },
      { colour: "default", label: pick(LOCAL, langs) },
    ],
  };
}

/** Turns "Miroku Association USA" into "miroku-association-usa". */
export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Web names that would clash with the app's own pages. */
export const RESERVED_SLUGS = ["new", "login", "auth", "api", "admin", "edit", "_next"];
