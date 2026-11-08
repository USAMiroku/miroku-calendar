// Turns stored data into the exact text printed on the calendar, in each language.
// Every rule from the original spec has a test in format.test.ts.

import type { Activity, CalendarEvent, Group, Lang, Localized, MonthData, VenueType } from "./types";

export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  fr: "Français (Québec)",
  pt: "Português",
  es: "Español",
};

const DAY_NAMES: Record<Lang, string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  fr: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
  pt: ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"],
  es: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
};

const MONTH_NAMES: Record<Lang, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  pt: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
};

/** Fixed labels used on the calendar page. */
export const LABELS: Record<string, Record<Lang, string>> = {
  date: { en: "DATE", fr: "DATE", pt: "DATA", es: "FECHA" },
  day: { en: "DAY", fr: "JOUR", pt: "DIA", es: "DÍA" },
  time: { en: "TIME", fr: "HEURE", pt: "HORÁRIO", es: "HORA" },
  activity: { en: "ACTIVITY", fr: "ACTIVITÉ", pt: "ATIVIDADE", es: "ACTIVIDAD" },
  location: { en: "LOCATION", fr: "LIEU", pt: "LOCAL", es: "LUGAR" },
  calendar: { en: "ACTIVITIES CALENDAR", fr: "CALENDRIER DES ACTIVITÉS", pt: "CALENDÁRIO DE ATIVIDADES", es: "CALENDARIO DE ACTIVIDADES" },
  noEvents: { en: "No activities scheduled", fr: "Aucune activité prévue", pt: "Nenhuma atividade programada", es: "No hay actividades programadas" },
  cancelled: { en: "CANCELLED", fr: "ANNULÉ", pt: "CANCELADO", es: "CANCELADO" },
};

/** Curly apostrophes and en dashes, as the printed calendar uses. */
export function typography(text: string): string {
  return text
    .replace(/'/g, "’")
    .replace(/ - /g, " – ")
    .replace(/(\d)-(\d)/g, "$1–$2");
}

/** Text in a language, falling back to the first language that has a value. */
export function pick(value: Localized | undefined, lang: Lang, fallback?: Lang): string {
  if (!value) return "";
  return value[lang] ?? (fallback ? value[fallback] : undefined) ?? Object.values(value).find(Boolean) ?? "";
}

function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(":").map(Number);
  return { h, m: m || 0 };
}

// ---------- English and Spanish: 12-hour clock ----------

function twelve(t: string, lang: "en" | "es"): { body: string; mer: string } {
  const { h, m } = parseTime(t);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mer = lang === "en" ? (h < 12 ? "AM" : "PM") : h < 12 ? "a. m." : "p. m.";
  return { body: m ? `${h12}:${String(m).padStart(2, "0")}` : String(h12), mer };
}

function twelveRange(start: string, end: string | null | undefined, lang: "en" | "es"): string {
  const s = twelve(start, lang);
  if (!end) return `${s.body} ${s.mer}`;
  const e = twelve(end, lang);
  if (s.mer === e.mer) return `${s.body} – ${e.body} ${e.mer}`;
  return `${s.body} ${s.mer} – ${e.body} ${e.mer}`;
}

// ---------- French (Québec) and Portuguese: 24-hour clock ----------

function frTime(t: string): string {
  const { h, m } = parseTime(t);
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

function ptTime(t: string): string {
  const { h, m } = parseTime(t);
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

/** The time cell for one event in one language, with the group's time zone if it has one. */
export function formatTime(lang: Lang, start: string, end?: string | null, timeZone?: string): string {
  let text: string;
  switch (lang) {
    case "en":
    case "es":
      text = twelveRange(start, end, lang);
      break;
    case "fr":
      if (!end) text = start === "12:00" ? "12 h (midi)" : frTime(start);
      else text = `${frTime(start)} à ${frTime(end)}`;
      break;
    case "pt":
      text = end ? `${ptTime(start)} às ${ptTime(end)}` : ptTime(start);
      break;
  }
  return timeZone ? `${text} (${timeZone})` : text;
}

/** Day of week for a YYYY-MM-DD date, capitalised. */
export function formatDay(lang: Lang, date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return DAY_NAMES[lang][dow];
}

export function monthName(lang: Lang, month: number): string {
  return MONTH_NAMES[lang][month - 1];
}

/** "DECEMBER 2026 | DÉCEMBRE 2026" */
export function formatMonthTitle(langs: Lang[], year: number, month: number): string {
  return joinDistinct(langs.map((l) => `${monthName(l, month)} ${year}`.toLocaleUpperCase(l === "fr" ? "fr-CA" : l)), " | ");
}

/** "Johrei Gathering – Calgary Group" when the activity adds the group name. */
export function formatActivity(lang: Lang, activity: Activity, group: Group, fallback?: Lang): string {
  const name = pick(activity.name, lang, fallback);
  const text = activity.addGroupName ? `${name} – ${pick(group.name, lang, fallback)}` : name;
  return typography(text);
}

export type ColourCategory = "national" | "public" | "default";

export function colourCategory(activity: Activity, group: Group): ColourCategory {
  if (activity.isNationalService) return "national";
  if (group.venueType === ("public" satisfies VenueType)) return "public";
  return "default";
}

/** The activity's own row colour, if it has one. Services keep the calendar's Service colour. */
export function activityFill(activity: Activity): string | undefined {
  if (activity.isNationalService) return undefined;
  return activity.colour || undefined;
}

/** Legend entries for the coloured activities that appear this month, in order of first appearance. */
export function activityLegend(rows: FormattedEvent[], activities: Activity[]): { colour: string; label: Localized }[] {
  const byId = new Map(activities.map((a) => [a.id, a]));
  const out: { colour: string; label: Localized }[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const a = byId.get(r.event.activityId);
    if (!a || !r.fill || seen.has(a.id)) continue;
    seen.add(a.id);
    out.push({ colour: r.fill, label: a.name });
  }
  return out;
}

/** Join the values for each language, dropping repeats: "DATE", "DAY / JOUR". */
export function joinDistinct(values: string[], sep: string): string {
  const out: string[] = [];
  for (const v of values) if (v && !out.includes(v)) out.push(v);
  return out.join(sep);
}

export function label(key: keyof typeof LABELS, langs: Lang[], sep = " / "): string {
  return joinDistinct(langs.map((l) => LABELS[key][l]), sep);
}

export function localizedLine(value: Localized, langs: Lang[], sep = " | "): string {
  const vals = langs.map((l) => value[l]).filter(Boolean) as string[];
  if (vals.length === 0) return typography(Object.values(value).find(Boolean) ?? "");
  return typography(joinDistinct(vals, sep));
}

export interface FormattedLine {
  lang: Lang;
  day: string;
  time: string;
  activity: string;
  location: string;
  note: string;
}

export interface FormattedEvent {
  event: CalendarEvent;
  dayNumber: number;
  colour: ColourCategory;
  /** The activity's own colour, when it has one and isn't a Service. Overrides the category colour. */
  fill?: string;
  lines: FormattedLine[]; // one per calendar language
}

export function formatEvent(event: CalendarEvent, group: Group, activity: Activity, langs: Lang[]): FormattedEvent {
  const fallback = langs[0];
  return {
    event,
    dayNumber: Number(event.date.slice(8, 10)),
    colour: colourCategory(activity, group),
    fill: activityFill(activity),
    lines: langs.map((lang) => ({
      lang,
      day: formatDay(lang, event.date),
      time: formatTime(lang, event.start, event.end, pick(group.timeZoneLabel, lang) || undefined),
      activity: formatActivity(lang, activity, group, fallback),
      location: typography(pick(group.location, lang, fallback)),
      note: typography(pick(event.note, lang, fallback)),
    })),
  };
}

/** Sort by date, then start time. */
export function sortEvents<T extends Pick<CalendarEvent, "date" | "start">>(events: T[]): T[] {
  return [...events].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}

/** The events a calendar shows (its groups, plus services if asked), sorted and formatted. */
export function eventsForCalendar(data: Pick<MonthData, "calendar" | "groups" | "activities" | "events">): FormattedEvent[] {
  const { calendar, groups, activities, events } = data;
  const langs = calendar.settings.languages;
  const groupById = new Map(groups.map((g) => [g.id, g]));
  const actById = new Map(activities.map((a) => [a.id, a]));
  const out: FormattedEvent[] = [];
  for (const e of sortEvents(events)) {
    const g = groupById.get(e.groupId);
    const a = actById.get(e.activityId);
    if (!g || !a) continue;
    const inScope = calendar.groupIds.length === 0 || calendar.groupIds.includes(g.id) || (calendar.includeNational && a.isNationalService);
    if (inScope) out.push(formatEvent(e, g, a, langs));
  }
  return out;
}
