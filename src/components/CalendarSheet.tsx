// The printed calendar page: banner, open hours, events table and legend.
// Pure presentation: give it a month's data and it renders the same thing on screen and on paper.

import type { MonthData } from "@/lib/types";
import { activityLegend, eventsForCalendar, formatMonthTitle, joinDistinct, label, localizedLine } from "@/lib/format";
import styles from "./CalendarSheet.module.css";

export default function CalendarSheet({ data }: { data: MonthData }) {
  const s = data.calendar.settings;
  const langs = s.languages;
  const rows = eventsForCalendar(data);
  const extraLegend = activityLegend(rows, data.activities);
  const fillStyle = (fill?: string) => (fill ? ({ "--c-fill": fill } as React.CSSProperties) : undefined);
  const openHours = s.openHours ? localizedLine(s.openHours, langs, " / ") : "";

  // How many rows each day spans, so the big date number shows once per day.
  const daySpan = new Map<string, number>();
  for (const r of rows) daySpan.set(r.event.date, (daySpan.get(r.event.date) ?? 0) + 1);
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
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className={styles.empty}>
                {label("noEvents", langs)}
              </td>
            </tr>
          )}
          {rows.map((r) => {
            const first = !seen.has(r.event.date);
            seen.add(r.event.date);
            return (
              <tr
                key={r.event.id}
                className={`${r.fill ? styles.filled : styles[r.colour]} ${r.event.cancelled ? styles.cancelled : ""}`}
                style={fillStyle(r.fill)}
              >
                {first && (
                  <td className={styles.dateCell} rowSpan={daySpan.get(r.event.date)}>
                    {r.dayNumber}
                  </td>
                )}
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
        {rows.map((r) => (
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
        ))}
        {rows.length === 0 && <li className={styles.empty}>{label("noEvents", langs)}</li>}
      </ol>

      <footer className={styles.legend}>
        {s.legend.map((l) => (
          <span key={l.colour} className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: s.colours[l.colour] }} />
            {localizedLine(l.label, langs, " / ")}
          </span>
        ))}
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
function Cell({ lines, extra, prefix }: { lines: string[]; extra?: string[]; prefix?: string }) {
  const show = lines.length === 2 && lines[0] === lines[1] ? [lines[0]] : lines;
  return (
    <td>
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

