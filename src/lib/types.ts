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
}

export interface Activity {
  id: string;
  orgId: string;
  key: string;
  name: Localized;
  addGroupName: boolean;
  isNationalService: boolean;
  lastUsedAt?: string | null;
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
}

export interface Calendar {
  id: string;
  orgId: string;
  slug: string; // e.g. "canada" or "toronto"
  name: string;
  /** Limit the calendar to these groups (a centre calendar). Empty = every group in the organization. */
  groupIds: string[];
  /** For a centre calendar: also show national services from other groups. */
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
