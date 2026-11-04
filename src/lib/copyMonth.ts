// Plans copying one month's events into another month, keeping the pattern:
// the 2nd Sunday stays on the 2nd Sunday, and an activity held every week stays every week
// (so it also fills a 5th week when the new month has one).

export interface CopySource {
  date: string; // YYYY-MM-DD
  start: string;
  end?: string | null;
  groupId: string;
  activityId: string;
}

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Every date in the month that falls on this weekday (0 = Sunday). */
export function weekdayDates(year: number, month: number, weekday: number): string[] {
  const first = utc(year, month, 1).getUTCDay();
  const out: string[] = [];
  for (let day = 1 + ((weekday - first + 7) % 7); ; day += 7) {
    const d = utc(year, month, day);
    if (d.getUTCMonth() !== month - 1) break;
    out.push(iso(d));
  }
  return out;
}

export function planCopy<T extends CopySource>(events: T[], toYear: number, toMonth: number): (T & { date: string })[] {
  const out: (T & { date: string })[] = [];
  const series = new Map<string, T[]>();
  for (const e of events) {
    const weekday = new Date(e.date + "T00:00:00Z").getUTCDay();
    const key = [weekday, e.start, e.end ?? "", e.groupId, e.activityId].join("|");
    series.set(key, [...(series.get(key) ?? []), e]);
  }
  for (const list of series.values()) {
    const d0 = new Date(list[0].date + "T00:00:00Z");
    const weekday = d0.getUTCDay();
    const sourceDates = weekdayDates(d0.getUTCFullYear(), d0.getUTCMonth() + 1, weekday);
    const targetDates = weekdayDates(toYear, toMonth, weekday);
    const weekly = list.length >= 4 && sourceDates.every((d) => list.some((e) => e.date === d));
    if (weekly) {
      for (const date of targetDates) out.push({ ...list[0], date });
      continue;
    }
    for (const e of list) {
      const nth = sourceDates.indexOf(e.date);
      if (nth >= 0 && nth < targetDates.length) out.push({ ...e, date: targetDates[nth] });
    }
  }
  return out.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}
