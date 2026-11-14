// The printed calendar page: banner, open hours, events table and legend.
// Pure presentation: give it a month's data and it renders the same thing on screen and on paper.

import type { MonthData } from "@/lib/types";
import { activityLegend, eventsForCalendar, formatDay, formatMonthTitle, joinDistinct, label, localizedLine, pick, typography, type FormattedEvent } from "@/lib/format";
import { DEFAULT_HOLIDAY_COLOUR, holidaysInMonth, type Holiday } from "@/lib/holidays";
import styles from "./CalendarSheet.module.css";

export default function CalendarSheet({ data }: { data: MonthData }) {
  const s = data.calendar.settings;
  const langs = s.languages;
  const rows = eventsForCalendar(data);
  const extraLegend = activityLegend(rows, data.activities);
  const fillStyle = (fill?: string) => (fill ? ({ "--c-fill": fill } as React.CSSProperties) : undefined);
  const openHours = s.openHours ? localizedLine(s.openHours, langs, " / ") : "";
  const holidays = holidaysInMonth(s.holidays, data.year, data.month);

  // Holidays and events in date order; a holiday comes first on its day.
  type Item = { kind: "holiday"; date: string; holiday: Holiday } | { kind: "event"; date: string; row: FormattedEvent };
  const items: Item[] = [
    ...holidays.map((h) => ({ kind: "holiday" as const, date: h.date, holiday: h })),
    ...rows.map((r) => ({ kind: "event" as const, date: r.event.date, row: r })),
  ].sort((a, b) => a.date.localeCompare(b.date) || (a.kind === b.kind ? 0 : a.kind === "holiday" ? -1 : 1));
  const holidayName = (h: Holiday) => langs.map((l) => typography(pick(h.name, l, langs[0])));

  // How many rows each day spans, so the big date number shows once per day.
  const daySpan = new Map<string, number>();
  for (const it of items) daySpan.set(it.date, (daySpan.get(it.date) ?? 0) + 1);
  const seen = new Set<string>();

  const bannerClass =
    s.bannerStyle === "side-bands" ? styles.sideBands : s.bannerStyle === "top-band" ? styles.topBand : styles.plainBanner;

  return (
    <article
      className={styles.sheet}
      style={
        {
          "--band": s.bannerColour,
          "--title": s.titleColour,
          "--header": s.headerColour,
          "--c-national": s.colours.national,
          "--c-public": s.colours.public,
          "--c-default": s.colours.default,
          "--c-holiday": s.holidays?.colour || DEFAULT_HOLIDAY_COLOUR,
        } as React.CSSProperties
      }
    >
      <header className={`${styles.banner} ${bannerClass}`}>
        <div className={styles.bannerInner}>
          {s.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.logo} src={s.logoUrl} alt="" />
          )}
          {s.titleLines.map((line, i) => (
            <div key={i} className={i === 0 ? styles.titleMain : styles.titleLine}>
              {localizedLine(line, langs)}
            </div>
          ))}
          <div className={styles.monthTitle}>{formatMonthTitle(langs, data.year, data.month)}</div>
        </div>
      </header>

      {openHours && <div className={styles.openHours}>{openHours}</div>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.colDate}>{label("date", langs)}</th>
            <th className={styles.colDay}>{label("day", langs)}</th>
            <th className={styles.colTime}>{label("time", langs)}</th>
            <th>{label("activity", langs)}</th>
            <th className={styles.colLoc}>{label("location", langs)}</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className={styles.empty}>
                {label("noEvents", langs)}
              </td>
            </tr>
          )}
          {items.map((it) => {
            const first = !seen.has(it.date);
            seen.add(it.date);
            const dateCell = first && (
              <td className={styles.dateCell} rowSpan={daySpan.get(it.date)}>
                {Number(it.date.slice(8, 10))}
              </td>
            );
            if (it.kind === "holiday") {
              return (
                <tr key={`h-${it.holiday.key}`} className={styles.holiday}>
                  {dateCell}
                  <Cell lines={langs.map((l) => formatDay(l, it.date))} />
                  <Cell lines={holidayName(it.holiday)} colSpan={3} />
                </tr>
              );
            }
            const r = it.row;
            return (
              <tr
                key={r.event.id}
                className={`${r.fill ? styles.filled : styles[r.colour]} ${r.event.cancelled ? styles.cancelled : ""}`}
                style={fillStyle(r.fill)}
              >
                {dateCell}
                <Cell lines={r.lines.map((l) => l.day)} />
                <Cell lines={r.lines.map((l) => l.time)} />
                <Cell
                  lines={r.lines.map((l) => l.activity)}
                  extra={r.lines.map((l) => l.note)}
                  prefix={r.event.cancelled ? label("cancelled", langs) : undefined}
                />
                <Cell lines={r.lines.map((l) => l.location)} />
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Phone layout: one card per event instead of the wide table. Hidden on larger screens and on paper. */}
      <ol className={styles.cards}>
        {items.map((it) => {
          if (it.kind === "holiday") {
            return (
              <li key={`h-${it.holiday.key}`} className={`${styles.card} ${styles.holiday}`}>
                <div className={styles.cardDate}>{Number(it.date.slice(8, 10))}</div>
                <div className={styles.cardBody}>
                  {joinDistinct(langs.map((l, i) => `${formatDay(l, it.date)} · ${holidayName(it.holiday)[i]}`), "\n")
                    .split("\n")
                    .map((text, i) => (
                      <div key={i} className={i === 0 ? styles.primary : styles.secondary}>{text}</div>
                    ))}
                  <div className={styles.cardLoc}>{label("holiday", langs)}</div>
                </div>
              </li>
            );
          }
          const r = it.row;
          return (
          <li key={r.event.id} className={`${styles.card} ${r.fill ? styles.filled : styles[r.colour]}`} style={fillStyle(r.fill)}>
            <div className={styles.cardDate}>{r.dayNumber}</div>
            <div className={styles.cardBody}>
              {r.event.cancelled && <div className={styles.cancelTag}>{label("cancelled", langs)}</div>}
              {r.lines.map((l, i) => (
                <div key={l.lang} className={`${i === 0 ? styles.primary : styles.secondary} ${r.event.cancelled ? styles.struck : ""}`}>
                  {l.day} · {l.time}
                  <br />
                  {l.activity}
                  {l.note ? ` · ${l.note}` : ""}
                </div>
              ))}
              <div className={styles.cardLoc}>{joinDistinct(r.lines.map((l) => l.location), " / ")}</div>
            </div>
          </li>
          );
        })}
        {items.length === 0 && <li className={styles.empty}>{label("noEvents", langs)}</li>}
      </ol>

      <footer className={styles.legend}>
        {s.legend.map((l) => (
          <span key={l.colour} className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: s.colours[l.colour] }} />
            {localizedLine(l.label, langs, " / ")}
          </span>
        ))}
        {holidays.length > 0 && (
          <span className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: "var(--c-holiday)" }} />
            {label("holiday", langs)}
          </span>
        )}
        {extraLegend.map((l) => (
          <span key={l.colour + localizedLine(l.label, langs)} className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: l.colour }} />
            {localizedLine(l.label, langs, " / ")}
          </span>
        ))}
      </footer>
    </article>
  );
}

/** One cell: first language bold, second italic grey. Identical lines are shown once. */
function Cell({ lines, extra, prefix, colSpan }: { lines: string[]; extra?: string[]; prefix?: string; colSpan?: number }) {
  const show = lines.length === 2 && lines[0] === lines[1] ? [lines[0]] : lines;
  return (
    <td colSpan={colSpan}>
      {prefix && <div className={styles.cancelTag}>{prefix}</div>}
      {show.map((t, i) => (
        <div key={i} className={i === 0 ? styles.primary : styles.secondary}>
          {t}
          {extra?.[i] ? <span className={styles.note}> · {extra[i]}</span> : null}
        </div>
      ))}
    </td>
  );
}

