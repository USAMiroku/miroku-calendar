// Core data types shared by the database layer, the formatter and the UI.

/** Languages a calendar can be shown in. Add a code here and in i18n.ts to support a new one. */
export type Lang = "en" | "fr" | "pt" | "es";

/** A text stored once per language, e.g. { en: "Toronto Group", fr: "Groupe de Toronto" }. */
export type Localized = Partial<Record<Lang, string>>;

export type VenueType = "centre" | "public" | "home";

export interface Organization {
  id: string;
  slug: string; // used in URLs, e.g. "miroku-canada"
  name: string;
}

export interface Group {
  id: string;
  orgId: string;
  key: string; // short name used in lists and CSV import, e.g. "Toronto Centre"
  name: Localized;
  location: Localized;
  timeZoneLabel: Localized; // empty when the group is in the calendar's home time zone
  venueType: VenueType;
  sortOrder?: number;
  archived?: boolean;
}

export interface Activity {
  id: string;
  orgId: string;
  key: string;
  name: Localized;
  addGroupName: boolean;
  /** A Service: shown in the calendar's Service colour, and on centre calendars that include services. */
  isNationalService: boolean;
  /** Optional row colour for this activity, e.g. "#FCE4D6". Empty = the usual venue colour. Services always use the Service colour. */
  colour?: string | null;
  lastUsedAt?: string | null;
  archived?: boolean;
}

export interface CalendarEvent {
  id: string;
  orgId: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM, 24-hour
  end?: string | null; // HH:MM, 24-hour
  groupId: string;
  activityId: string;
  note?: Localized;
  cancelled?: boolean;
}

export type BannerStyle = "side-bands" | "top-band" | "plain";

export interface LegendEntry {
  colour: "national" | "public" | "default";
  label: Localized;
}

export interface HolidaySettings {
  /** Which country's public holidays to show. */
  country: "CA" | "US";
  /** Optional province (e.g. "ON", "QC") to add its own holidays. Empty = nationwide holidays only. */
  region?: string;
  /** Row colour for holidays, e.g. "#FFF2CC". */
  colour?: string;
  /** Also send holidays to phones that subscribed to the calendar. Default yes. */
  onPhones?: boolean;
}

export interface CalendarSettings {
  /** One or two languages. The first is the bold line, the second the grey italic line. */
  languages: [Lang] | [Lang, Lang];
  /** Banner lines under the logo, top to bottom. The month title is added automatically. */
  titleLines: Localized[];
  bannerStyle: BannerStyle;
  bannerColour: string; // e.g. "#C00000"
  titleColour: string;
  headerColour: string; // table header row background
  logoUrl?: string | null;
  /** Free text shown in the open hours box; empty hides the box. */
  openHours?: Localized;
  legend: LegendEntry[];
  colours: { national: string; public: string; default: string };
  /** Where the calendar's times are, as a time zone id from timeZones.ts (e.g. "eastern"). Used by phone calendars. */
  timeZone?: string;
  /** Public holidays to show. Missing or null = no holidays. */
  holidays?: HolidaySettings | null;
}

export interface Calendar {
  id: string;
  orgId: string;
  slug: string; // e.g. "canada" or "toronto"
  name: string;
  /** Limit the calendar to these groups (a centre calendar). Empty = every group in the organization. */
  groupIds: string[];
  /** For a centre calendar: also show services from other groups. */
  includeNational: boolean;
  settings: CalendarSettings;
}

export interface MonthData {
  org: Organization;
  calendar: Calendar;
  groups: Group[];
  activities: Activity[];
  events: CalendarEvent[];
  year: number;
  month: number; // 1-12
  published: boolean;
}
