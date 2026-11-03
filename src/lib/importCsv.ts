// Reads the Excel "Entries" CSV (Date, Start, End, Group, Activity) and matches it to the lists.

import Papa from "papaparse";
import type { Activity, Group } from "./types";

export interface ParsedRow {
  line: number;
  raw: Record<string, string>;
  date?: string;
  start?: string;
  end?: string | null;
  groupId?: string;
  activityId?: string;
  problems: string[];
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Accepts 2026-12-06, 12/6/2026, 6-Dec-2026, December 6, 2026 and Excel serial numbers. */
export function parseDate(v: string): string | undefined {
  const s = v.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/); // month/day/year, as US Excel writes it
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return `${y}-${pad(+m[1])}-${pad(+m[2])}`;
  }
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(+s) * 86400000);
    return d.toISOString().slice(0, 10);
  }
  const t = Date.parse(s.replace(/-/g, " ") + " UTC");
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  return undefined;
}

/** Accepts 11:00, 11:00:00, 4 PM, 4:30 pm, 16h30, 16 h 30 and Excel day fractions (0.4583). */
export function parseTime(v: string): string | undefined {
  const s = v.trim().toLowerCase().replace(/\./g, "");
  if (!s) return undefined;
  if (/^0?\.\d+$/.test(s) || /^0\.\d+$/.test(v.trim())) {
    const mins = Math.round(parseFloat(v) * 24 * 60);
    return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
  }
  const m = s.match(/^(\d{1,2})(?:\s*[:h]\s*(\d{2}))?(?::\d{2})?\s*(am|pm|a m|p m)?$/);
  if (!m) return undefined;
  let h = +m[1];
  const min = m[2] ? +m[2] : 0;
  const mer = m[3]?.replace(" ", "");
  if (mer === "pm" && h < 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return undefined;
  return `${pad(h)}:${pad(min)}`;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'").replace(/[–—]/g, "-").trim().toLowerCase();

function matcher<T extends { id: string; key: string; name: Record<string, string | undefined> }>(items: T[]) {
  const map = new Map<string, string>();
  for (const it of items) {
    map.set(norm(it.key), it.id);
    for (const n of Object.values(it.name)) if (n) map.set(norm(n), it.id);
  }
  return (v: string) => map.get(norm(v));
}

const col = (row: Record<string, string>, ...names: string[]) => {
  for (const k of Object.keys(row)) if (names.includes(norm(k))) return row[k] ?? "";
  return "";
};

export function parseEntriesCsv(text: string, groups: Group[], activities: Activity[]): ParsedRow[] {
  const { data } = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), { header: true, skipEmptyLines: "greedy" });
  const findGroup = matcher(groups);
  const findActivity = matcher(activities);
  return data.map((raw, i) => {
    const problems: string[] = [];
    const dateS = col(raw, "date");
    const startS = col(raw, "start", "start time");
    const endS = col(raw, "end", "end time");
    const groupS = col(raw, "group");
    const actS = col(raw, "activity");
    const date = parseDate(dateS);
    const start = parseTime(startS);
    const end = endS.trim() ? parseTime(endS) : null;
    const groupId = findGroup(groupS);
    const activityId = findActivity(actS);
    if (!date) problems.push(`can’t read the date “${dateS}”`);
    if (!start) problems.push(`can’t read the start time “${startS}”`);
    if (end === undefined) problems.push(`can’t read the end time “${endS}”`);
    if (!groupId) problems.push(`unknown group “${groupS}”`);
    if (!activityId) problems.push(`unknown activity “${actS}”`);
    return { line: i + 2, raw, date, start, end, groupId, activityId, problems };
  });
}
