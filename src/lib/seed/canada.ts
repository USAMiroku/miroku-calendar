// Starting lists for Miroku Association Canada, taken from the original Excel workbook.
// Used to seed the database and to run the app in demo mode without a database.

import type { Activity, Calendar, CalendarEvent, Group, Organization } from "../types";

const ORG = "org-canada";

export const canadaOrg: Organization = { id: ORG, slug: "miroku-canada", name: "Miroku Association Canada" };

const MT = { en: "Mountain Time", fr: "heure des Rocheuses" };

export const canadaGroups: Group[] = [
  {
    id: "g-hq", orgId: ORG, key: "Headquarters – New York", venueType: "centre", sortOrder: 0,
    name: { en: "Headquarters", fr: "Siège social" },
    location: { en: "Headquarters – New York, USA", fr: "Siège social – New York, É.-U." },
    timeZoneLabel: {},
  },
  {
    id: "g-toronto", orgId: ORG, key: "Toronto Centre", venueType: "centre", sortOrder: 1,
    name: { en: "Toronto Group", fr: "Groupe de Toronto" },
    location: {
      en: "Toronto Centre, 3416 Dundas St W, Ste 209, Toronto ON M6S 2S1",
      fr: "Centre de Toronto, 3416, rue Dundas Ouest, bureau 209, Toronto (Ontario) M6S 2S1",
    },
    timeZoneLabel: {},
  },
  {
    id: "g-montreal", orgId: ORG, key: "Montréal", venueType: "public", sortOrder: 2,
    name: { en: "Montréal Group", fr: "Groupe de Montréal" },
    location: {
      en: "Centre St-Pierre, 1212 Rue Panet, Montréal, QC H2L 2Y7",
      fr: "Centre St-Pierre, 1212, rue Panet, Montréal (Québec) H2L 2Y7",
    },
    timeZoneLabel: {},
  },
  {
    id: "g-pei", orgId: ORG, key: "Prince Edward Island", venueType: "home", sortOrder: 3,
    name: { en: "Prince Edward Island Group", fr: "Groupe de l’Île-du-Prince-Édouard" },
    location: { en: "Member Home", fr: "Domicile d’un membre" },
    timeZoneLabel: {},
  },
  {
    id: "g-edmonton", orgId: ORG, key: "Edmonton", venueType: "home", sortOrder: 4,
    name: { en: "Edmonton Group", fr: "Groupe d’Edmonton" },
    location: { en: "Member Home", fr: "Domicile d’un membre" },
    timeZoneLabel: MT,
  },
  {
    id: "g-vancouver", orgId: ORG, key: "Vancouver", venueType: "public", sortOrder: 5,
    name: { en: "Vancouver Group", fr: "Groupe de Vancouver" },
    location: {
      en: "Vancouver Central Library, 350 West Georgia St, Vancouver BC V6B 6B1",
      fr: "Bibliothèque centrale de Vancouver, 350, rue West Georgia, Vancouver (Colombie-Britannique) V6B 6B1",
    },
    timeZoneLabel: {},
  },
  {
    id: "g-calgary", orgId: ORG, key: "Calgary", venueType: "public", sortOrder: 6,
    name: { en: "Calgary Group", fr: "Groupe de Calgary" },
    location: {
      en: "Calgary Central Library, 800 3 St SE, Calgary AB T2G 2E7",
      fr: "Bibliothèque centrale de Calgary, 800, 3e Rue Sud-Est, Calgary (Alberta) T2G 2E7",
    },
    timeZoneLabel: MT,
  },
];

export const canadaActivities: Activity[] = [
  {
    id: "a-johrei", orgId: ORG, key: "Johrei Gathering", addGroupName: true, isNationalService: false,
    name: { en: "Johrei Gathering", fr: "Rencontre de Johrei" },
  },
  {
    id: "a-monthly", orgId: ORG, key: "Monthly Appreciation Service", addGroupName: false, isNationalService: true,
    name: {
      en: "MONTHLY APPRECIATION SERVICE – Canada National Service",
      fr: "SERVICE MENSUEL DE GRATITUDE – Service national du Canada",
    },
  },
  {
    id: "a-na", orgId: ORG, key: "North American Appreciation Service", addGroupName: false, isNationalService: true,
    name: { en: "North American Appreciation Service", fr: "Service de gratitude nord-américain" },
  },
  {
    id: "a-cleanup", orgId: ORG, key: "Centre Clean-up & Service Set-up", addGroupName: false, isNationalService: false,
    name: { en: "Centre Clean-up & Service Set-up", fr: "Nettoyage du Centre et préparation du service" },
  },
];

export const canadaCalendar: Calendar = {
  id: "cal-canada",
  orgId: ORG,
  slug: "canada",
  name: "Canada – national calendar",
  groupIds: [],
  includeNational: true,
  settings: {
    languages: ["en", "fr"],
    titleLines: [
      { en: "Miroku Association Canada" },
      { en: "World Messianic Church of Canada", fr: "Église messianique mondiale du Canada" },
      { en: "ACTIVITIES CALENDAR", fr: "CALENDRIER DES ACTIVITÉS" },
    ],
    bannerStyle: "side-bands",
    bannerColour: "#C00000",
    titleColour: "#C00000",
    headerColour: "#C00000",
    logoUrl: "/izunome-logo.png",
    openHours: {
      en: "Toronto Centre – Regular Open Hours / Heures d’ouverture régulières: Mon 3–5 pm · Tue 6–7:30 pm · Thu 6–7 pm · Sat 10–11:30 am",
    },
    legend: [
      { colour: "national", label: { en: "Service", fr: "Service" } },
      { colour: "public", label: { en: "Regional group gathering", fr: "Rencontre de groupe régionale" } },
      { colour: "default", label: { en: "Member home or centre activity", fr: "Activité au centre ou à domicile" } },
    ],
    colours: { national: "#D9E1F2", public: "#E2EFDA", default: "#FFFFFF" },
    holidays: { country: "CA", region: "ON" },
  },
};

/** A Toronto-only calendar, to show the per-centre option. */
export const torontoCalendar: Calendar = {
  ...canadaCalendar,
  id: "cal-toronto",
  slug: "toronto",
  name: "Toronto Centre",
  groupIds: ["g-toronto"],
  includeNational: true,
  settings: {
    ...canadaCalendar.settings,
    titleLines: [
      { en: "Miroku Association Canada – Toronto Centre", fr: "Miroku Association Canada – Centre de Toronto" },
      { en: "ACTIVITIES CALENDAR", fr: "CALENDRIER DES ACTIVITÉS" },
    ],
  },
};

let n = 0;
const ev = (date: string, start: string, end: string | null, groupId: string, activityId: string): CalendarEvent => ({
  id: `demo-${++n}`, orgId: ORG, date, start, end, groupId, activityId,
});

/** Sample December 2026 events for demo mode. Not real data. */
export const canadaDemoEvents: CalendarEvent[] = [
  ev("2026-12-05", "10:00", "11:30", "g-toronto", "a-cleanup"),
  ev("2026-12-06", "11:00", null, "g-toronto", "a-monthly"),
  ev("2026-12-06", "16:00", "19:00", "g-montreal", "a-johrei"),
  ev("2026-12-10", "18:00", "20:00", "g-calgary", "a-johrei"),
  ev("2026-12-12", "11:30", "13:00", "g-vancouver", "a-johrei"),
  ev("2026-12-13", "12:00", null, "g-hq", "a-na"),
  ev("2026-12-15", "18:30", null, "g-edmonton", "a-johrei"),
  ev("2026-12-19", "09:00", "11:00", "g-pei", "a-johrei"),
  ev("2026-12-20", "14:00", "16:00", "g-toronto", "a-johrei"),
];

export const canadaSeed = {
  org: canadaOrg,
  groups: canadaGroups,
  activities: canadaActivities,
  calendars: [canadaCalendar, torontoCalendar],
  events: canadaDemoEvents,
};
