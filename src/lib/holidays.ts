// Public holidays shown on calendars: Canada (nationwide, plus a province's own days) and the USA (federal).
// Worked out from rules (e.g. "third Monday of February"), so every year is covered without updating a list.

import type { HolidaySettings, Localized } from "./types";

export interface Holiday {
  date: string; // YYYY-MM-DD
  key: string; // stable id, e.g. "canada-day"
  name: Localized;
}

export const HOLIDAY_COUNTRIES: { id: HolidaySettings["country"]; label: string }[] = [
  { id: "CA", label: "Canada" },
  { id: "US", label: "United States" },
];

/** Provinces with their own holidays. Leave empty for the nationwide list only. */
export const HOLIDAY_REGIONS: Record<HolidaySettings["country"], { id: string; label: string }[]> = {
  CA: [
    { id: "AB", label: "Alberta" },
    { id: "BC", label: "British Columbia" },
    { id: "MB", label: "Manitoba" },
    { id: "NS", label: "Nova Scotia" },
    { id: "ON", label: "Ontario" },
    { id: "QC", label: "Québec" },
    { id: "SK", label: "Saskatchewan" },
  ],
  US: [],
};

export const DEFAULT_HOLIDAY_COLOUR = "#FFF2CC";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** The n-th given weekday (0 = Sunday) of a month; n = -1 for the last one. */
function nthWeekday(y: number, m: number, weekday: number, n: number): string {
  if (n > 0) {
    const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    return iso(y, m, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7);
  }
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const last = new Date(Date.UTC(y, m - 1, lastDay)).getUTCDay();
  return iso(y, m, lastDay - ((last - weekday + 7) % 7));
}

/** Easter Sunday (Gregorian calendar). */
export function easter(y: number): { m: number; d: number } {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  return { m: month, d: ((h + l - 7 * m + 114) % 31) + 1 };
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** Victoria Day: the Monday before 25 May. */
function victoriaDay(y: number): string {
  const may24 = new Date(Date.UTC(y, 4, 24)).getUTCDay();
  return iso(y, 5, 24 - ((may24 + 6) % 7));
}

const N = (en: string, fr: string, pt: string, es: string): Localized => ({ en, fr, pt, es });

const NEW_YEAR = N("New Year's Day", "Jour de l'An", "Dia de Ano Novo", "Año Nuevo");
const CHRISTMAS = N("Christmas Day", "Noël", "Natal", "Navidad");
const FAMILY_DAY = N("Family Day", "Fête de la famille", "Dia da Família", "Día de la Familia");

function canada(y: number, region?: string): Holiday[] {
  const e = easter(y);
  const out: Holiday[] = [
    { key: "new-year", date: iso(y, 1, 1), name: NEW_YEAR },
    { key: "good-friday", date: addDays(iso(y, e.m, e.d), -2), name: N("Good Friday", "Vendredi saint", "Sexta-feira Santa", "Viernes Santo") },
    region === "QC"
      ? { key: "patriots-day", date: victoriaDay(y), name: N("National Patriots' Day", "Journée nationale des patriotes", "Dia Nacional dos Patriotas", "Día Nacional de los Patriotas") }
      : { key: "victoria-day", date: victoriaDay(y), name: N("Victoria Day", "Fête de la Reine", "Dia da Rainha Vitória", "Día de la Reina Victoria") },
    { key: "canada-day", date: iso(y, 7, 1), name: N("Canada Day", "Fête du Canada", "Dia do Canadá", "Día de Canadá") },
    { key: "labour-day", date: nthWeekday(y, 9, 1, 1), name: N("Labour Day", "Fête du Travail", "Dia do Trabalho", "Día del Trabajo") },
    { key: "thanksgiving", date: nthWeekday(y, 10, 1, 2), name: N("Thanksgiving", "Action de grâce", "Dia de Ação de Graças", "Día de Acción de Gracias") },
    { key: "remembrance-day", date: iso(y, 11, 11), name: N("Remembrance Day", "Jour du Souvenir", "Dia da Lembrança", "Día del Recuerdo") },
    { key: "christmas", date: iso(y, 12, 25), name: CHRISTMAS },
    { key: "boxing-day", date: iso(y, 12, 26), name: N("Boxing Day", "Lendemain de Noël", "Dia seguinte ao Natal", "Día después de Navidad") },
  ];
  if (y >= 2021) {
    out.push({
      key: "truth-reconciliation", date: iso(y, 9, 30),
      name: N("National Day for Truth and Reconciliation", "Journée nationale de la vérité et de la réconciliation", "Dia Nacional da Verdade e Reconciliação", "Día Nacional de la Verdad y la Reconciliación"),
    });
  }

  const feb3 = nthWeekday(y, 2, 1, 3);
  const aug1 = nthWeekday(y, 8, 1, 1);
  switch (region) {
    case "AB":
      out.push({ key: "family-day", date: feb3, name: FAMILY_DAY });
      out.push({ key: "heritage-day", date: aug1, name: N("Heritage Day", "Fête du patrimoine", "Dia do Patrimônio", "Día del Patrimonio") });
      break;
    case "BC":
      out.push({ key: "family-day", date: feb3, name: FAMILY_DAY });
      out.push({ key: "bc-day", date: aug1, name: N("British Columbia Day", "Jour de la Colombie-Britannique", "Dia da Colúmbia Britânica", "Día de la Columbia Británica") });
      break;
    case "MB":
      out.push({ key: "louis-riel-day", date: feb3, name: N("Louis Riel Day", "Journée Louis-Riel", "Dia de Louis Riel", "Día de Louis Riel") });
      out.push(y >= 2025
        ? { key: "terry-fox-day", date: aug1, name: N("Terry Fox Day", "Journée Terry Fox", "Dia de Terry Fox", "Día de Terry Fox") }
        : { key: "civic-holiday", date: aug1, name: N("Civic Holiday", "Congé civique", "Feriado Cívico", "Día Cívico") });
      break;
    case "NS":
      out.push({ key: "heritage-day", date: feb3, name: N("Nova Scotia Heritage Day", "Jour du patrimoine de la Nouvelle-Écosse", "Dia do Patrimônio da Nova Escócia", "Día del Patrimonio de Nueva Escocia") });
      out.push({ key: "natal-day", date: aug1, name: N("Natal Day", "Fête de la fondation", "Dia da Fundação", "Día de la Fundación") });
      break;
    case "ON":
      out.push({ key: "family-day", date: feb3, name: FAMILY_DAY });
      out.push({ key: "civic-holiday", date: aug1, name: N("Civic Holiday", "Congé civique", "Feriado Cívico", "Día Cívico") });
      break;
    case "QC":
      out.push({ key: "fete-nationale", date: iso(y, 6, 24), name: N("Québec's National Holiday", "Fête nationale du Québec", "Festa Nacional do Quebec", "Fiesta Nacional de Quebec") });
      break;
    case "SK":
      out.push({ key: "family-day", date: feb3, name: FAMILY_DAY });
      out.push({ key: "saskatchewan-day", date: aug1, name: N("Saskatchewan Day", "Fête de la Saskatchewan", "Dia de Saskatchewan", "Día de Saskatchewan") });
      break;
  }
  return out;
}

function usa(y: number): Holiday[] {
  const out: Holiday[] = [
    { key: "new-year", date: iso(y, 1, 1), name: NEW_YEAR },
    { key: "mlk-day", date: nthWeekday(y, 1, 1, 3), name: N("Martin Luther King Jr. Day", "Journée Martin Luther King Jr.", "Dia de Martin Luther King Jr.", "Día de Martin Luther King Jr.") },
    { key: "presidents-day", date: nthWeekday(y, 2, 1, 3), name: N("Presidents' Day", "Jour des Présidents", "Dia dos Presidentes", "Día de los Presidentes") },
    { key: "memorial-day", date: nthWeekday(y, 5, 1, -1), name: N("Memorial Day", "Jour du Souvenir (Memorial Day)", "Dia da Memória (Memorial Day)", "Día de los Caídos") },
    { key: "independence-day", date: iso(y, 7, 4), name: N("Independence Day", "Fête de l'Indépendance", "Dia da Independência", "Día de la Independencia") },
    { key: "labor-day", date: nthWeekday(y, 9, 1, 1), name: N("Labor Day", "Fête du Travail", "Dia do Trabalho", "Día del Trabajo") },
    { key: "columbus-day", date: nthWeekday(y, 10, 1, 2), name: N("Columbus Day / Indigenous Peoples' Day", "Jour de Christophe Colomb / des Peuples autochtones", "Dia de Colombo / dos Povos Indígenas", "Día de Colón / de los Pueblos Indígenas") },
    { key: "veterans-day", date: iso(y, 11, 11), name: N("Veterans Day", "Jour des anciens combattants", "Dia dos Veteranos", "Día de los Veteranos") },
    { key: "thanksgiving", date: nthWeekday(y, 11, 4, 4), name: N("Thanksgiving Day", "Action de grâce", "Dia de Ação de Graças", "Día de Acción de Gracias") },
    { key: "christmas", date: iso(y, 12, 25), name: CHRISTMAS },
  ];
  if (y >= 2021) out.push({ key: "juneteenth", date: iso(y, 6, 19), name: N("Juneteenth", "Juneteenth", "Juneteenth", "Juneteenth") });
  return out;
}

/** The holidays of one year, in date order. */
export function holidaysForYear(settings: HolidaySettings, year: number): Holiday[] {
  const list = settings.country === "US" ? usa(year) : settings.country === "CA" ? canada(year, settings.region || undefined) : [];
  return list.sort((a, b) => a.date.localeCompare(b.date));
}

/** A calendar's holidays from `from` (included) to `to` (not included), both YYYY-MM-DD. Empty when holidays are off. */
export function holidaysBetween(settings: HolidaySettings | null | undefined, from: string, to: string): Holiday[] {
  if (!settings?.country) return [];
  const out: Holiday[] = [];
  for (let y = Number(from.slice(0, 4)); y <= Number(to.slice(0, 4)); y++) {
    for (const h of holidaysForYear(settings, y)) if (h.date >= from && h.date < to) out.push(h);
  }
  return out;
}

/** A calendar's holidays in one month (1-12). */
export function holidaysInMonth(settings: HolidaySettings | null | undefined, year: number, month: number): Holiday[] {
  const next = month === 12 ? iso(year + 1, 1, 1) : iso(year, month + 1, 1);
  return holidaysBetween(settings, iso(year, month, 1), next);
}
