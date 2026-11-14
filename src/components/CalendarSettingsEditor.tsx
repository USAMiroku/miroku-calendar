"use client";

import { DEFAULT_HOME_ZONE, TIME_ZONES } from "@/lib/timeZones";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BannerStyle, Calendar, Group, HolidaySettings, Lang, Localized } from "@/lib/types";
import { LANG_NAMES } from "@/lib/format";
import { saveCalendar, type CalendarInput, type Result } from "@/lib/actions";
import { canadaCalendar } from "@/lib/seed/canada";
import { DEFAULT_HOLIDAY_COLOUR, HOLIDAY_COUNTRIES, HOLIDAY_REGIONS } from "@/lib/holidays";
import styles from "./Editor.module.css";

const ALL_LANGS = Object.keys(LANG_NAMES) as Lang[];

function LangInputs({ value, langs, onChange, area }: { value: Localized; langs: Lang[]; onChange: (v: Localized) => void; area?: boolean }) {
  return (
    <div className={styles.grid2}>
      {langs.map((l) => (
        <label key={l} style={{ fontWeight: 400 }}>
          {LANG_NAMES[l]}
          {area ? (
            <textarea rows={2} value={value[l] ?? ""} onChange={(e) => onChange({ ...value, [l]: e.target.value })} />
          ) : (
            <input value={value[l] ?? ""} onChange={(e) => onChange({ ...value, [l]: e.target.value })} />
          )}
        </label>
      ))}
    </div>
  );
}

export default function CalendarSettingsEditor({ orgSlug, orgName, calendars, groups }: { orgSlug: string; orgName: string; calendars: Calendar[]; groups: Group[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<Result | null>(null);
  const [c, setC] = useState<CalendarInput | null>(null);

  const blank = (): CalendarInput => ({
    slug: "",
    name: "",
    groupIds: [],
    includeNational: true,
    settings: {
      ...canadaCalendar.settings,
      languages: ["en"],
      titleLines: [{ en: orgName }],
      openHours: {},
      // Same holidays as the organization's other calendars.
      holidays: calendars[0]?.settings.holidays ?? null,
    },
  });

  if (!c) {
    return (
      <section className={styles.panel}>
        <h2>Calendars</h2>
        <p>Each calendar has its own languages, banner and open hours. A centre calendar shows only that centre’s groups.</p>
        <table className={styles.table}>
          <thead><tr><th>Calendar</th><th>Languages</th><th>Shows</th><th>Holidays</th><th /></tr></thead>
          <tbody>
            {calendars.map((x) => (
              <tr key={x.id}>
                <td><strong>{x.name}</strong><br /><small>/{orgSlug}/{x.slug}</small></td>
                <td>{x.settings.languages.map((l) => LANG_NAMES[l]).join(" + ")}</td>
                <td>{x.groupIds.length === 0 ? "All groups" : groups.filter((g) => x.groupIds.includes(g.id)).map((g) => g.key).join(", ")}</td>
                <td>{holidaySummary(x.settings.holidays)}</td>
                <td><button className="btn" onClick={() => setC({ ...x, settings: structuredClone(x.settings) })}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p><button className="btn primary" onClick={() => setC(blank())}>Add a calendar</button></p>
        {msg && <p className={msg.ok ? styles.ok : styles.err}>{msg.ok ? "Saved." : msg.error}</p>}
      </section>
    );
  }

  const s = c.settings;
  const langs = s.languages as Lang[];
  const setS = (patch: Partial<typeof s>) => setC({ ...c, settings: { ...s, ...patch } });
  const setLang = (i: 0 | 1, v: string) => {
    if (i === 0) setS({ languages: langs[1] && langs[1] !== v ? [v as Lang, langs[1]] : [v as Lang] });
    else setS({ languages: v ? [langs[0], v as Lang] : [langs[0]] });
  };

  return (
    <section className={styles.panel}>
      <h2>{c.id ? `Edit ${c.name}` : "New calendar"}</h2>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await saveCalendar(orgSlug, c);
            setMsg(r);
            if (r.ok) { setC(null); router.refresh(); }
          });
        }}
      >
        <div className={styles.grid2}>
          <label>Name<input required value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} placeholder="Toronto Centre" /></label>
          <label>Web name<input required value={c.slug} onChange={(e) => setC({ ...c, slug: e.target.value })} placeholder="toronto" /></label>
        </div>

        <div className={styles.grid2}>
          <label>Main language (bold line)
            <select value={langs[0]} onChange={(e) => setLang(0, e.target.value)}>
              {ALL_LANGS.map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}
            </select>
          </label>
          <label>Second language (grey line)
            <select value={langs[1] ?? ""} onChange={(e) => setLang(1, e.target.value)}>
              <option value="">None</option>
              {ALL_LANGS.filter((l) => l !== langs[0]).map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}
            </select>
          </label>
        </div>

        <label>Time zone of this calendar
          <select value={s.timeZone ?? DEFAULT_HOME_ZONE} onChange={(e) => setS({ timeZone: e.target.value })}>
            {TIME_ZONES.map((z) => <option key={z.id} value={z.id}>{z.label.en}</option>)}
          </select>
          <small className="muted">Times without a group time zone are in this zone. Phones use it to place activities at the right hour.</small>
        </label>

        <fieldset className={styles.panel}>
          <legend>Groups shown</legend>
          <label className={styles.check}>
            <input type="checkbox" checked={c.groupIds.length === 0} onChange={(e) => setC({ ...c, groupIds: e.target.checked ? [] : groups.slice(0, 1).map((g) => g.id) })} />
            All groups (whole organization)
          </label>
          {c.groupIds.length > 0 && (
            <>
              {groups.map((g) => (
                <label key={g.id} className={styles.check}>
                  <input
                    type="checkbox"
                    checked={c.groupIds.includes(g.id)}
                    onChange={(e) => setC({ ...c, groupIds: e.target.checked ? [...c.groupIds, g.id] : c.groupIds.filter((x) => x !== g.id) })}
                  />
                  {g.key}
                </label>
              ))}
              <label className={styles.check}>
                <input type="checkbox" checked={c.includeNational} onChange={(e) => setC({ ...c, includeNational: e.target.checked })} />
                Also show services
              </label>
            </>
          )}
        </fieldset>

        <fieldset className={styles.panel}>
          <legend>Banner</legend>
          {s.titleLines.map((line, i) => (
            <div key={i} style={{ display: "grid", gap: 4 }}>
              <strong>Title line {i + 1}</strong>
              <LangInputs value={line} langs={langs} onChange={(v) => setS({ titleLines: s.titleLines.map((x, j) => (j === i ? v : x)) })} />
              <button type="button" className="btn" style={{ justifySelf: "start" }} onClick={() => setS({ titleLines: s.titleLines.filter((_, j) => j !== i) })}>Remove line</button>
            </div>
          ))}
          <button type="button" className="btn" onClick={() => setS({ titleLines: [...s.titleLines, {}] })}>Add a title line</button>
          <small>The month title (e.g. “DECEMBER 2026 | DÉCEMBRE 2026”) is added automatically. A line typed in one language only is shown once.</small>
          <div className={styles.grid2}>
            <label>Style
              <select value={s.bannerStyle} onChange={(e) => setS({ bannerStyle: e.target.value as BannerStyle })}>
                <option value="side-bands">Side bands (Canadian flag style)</option>
                <option value="top-band">Band across the top</option>
                <option value="plain">Plain with a line</option>
              </select>
            </label>
            <label>Logo address<input value={s.logoUrl ?? ""} onChange={(e) => setS({ logoUrl: e.target.value })} placeholder="/izunome-logo.png" /></label>
            <label>Band colour<input type="color" value={s.bannerColour} onChange={(e) => setS({ bannerColour: e.target.value })} /></label>
            <label>Title colour<input type="color" value={s.titleColour} onChange={(e) => setS({ titleColour: e.target.value })} /></label>
            <label>Table header colour<input type="color" value={s.headerColour} onChange={(e) => setS({ headerColour: e.target.value })} /></label>
          </div>
        </fieldset>

        <fieldset className={styles.panel}>
          <legend>Open hours box <small>(leave empty to hide)</small></legend>
          <LangInputs area value={s.openHours ?? {}} langs={langs} onChange={(v) => setS({ openHours: v })} />
        </fieldset>

        <fieldset className={styles.panel}>
          <legend>Public holidays</legend>
          <div className={styles.grid2}>
            <label>Show the holidays of
              <select
                value={s.holidays?.country ?? ""}
                onChange={(e) => setS({ holidays: e.target.value ? { colour: DEFAULT_HOLIDAY_COLOUR, ...s.holidays, country: e.target.value as HolidaySettings["country"], region: "" } : null })}
              >
                <option value="">No holidays</option>
                {HOLIDAY_COUNTRIES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
            </label>
            {s.holidays && HOLIDAY_REGIONS[s.holidays.country].length > 0 && (
              <label>Also add a province’s holidays
                <select value={s.holidays.region ?? ""} onChange={(e) => setS({ holidays: { ...s.holidays!, region: e.target.value } })}>
                  <option value="">No, nationwide only</option>
                  {HOLIDAY_REGIONS[s.holidays.country].map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </label>
            )}
          </div>
          {s.holidays && (
            <>
              <label className={styles.check}>
                <input type="color" value={s.holidays.colour || DEFAULT_HOLIDAY_COLOUR} onChange={(e) => setS({ holidays: { ...s.holidays!, colour: e.target.value } })} />
                Holiday row colour
              </label>
              <label className={styles.check}>
                <input type="checkbox" checked={s.holidays.onPhones !== false} onChange={(e) => setS({ holidays: { ...s.holidays!, onPhones: e.target.checked } })} />
                Also show holidays on phones that added this calendar
              </label>
            </>
          )}
          <small>Holidays appear automatically every year, in the calendar’s languages. Nothing to type.</small>
        </fieldset>

        <fieldset className={styles.panel}>
          <legend>Colours and legend</legend>
          {s.legend.map((l, i) => (
            <div key={l.colour} style={{ display: "grid", gap: 4 }}>
              <label className={styles.check} style={{ fontWeight: 600 }}>
                <input type="color" value={s.colours[l.colour]} onChange={(e) => setS({ colours: { ...s.colours, [l.colour]: e.target.value } })} />
                {l.colour === "national" ? "Service" : l.colour === "public" ? "Public venue" : "Everything else"}
              </label>
              <LangInputs value={l.label} langs={langs} onChange={(v) => setS({ legend: s.legend.map((x, j) => (j === i ? { ...x, label: v } : x)) })} />
            </div>
          ))}
        </fieldset>

        <div className={styles.actions}>
          <button className="btn primary" disabled={pending}>{pending ? "Saving…" : "Save calendar"}</button>
          <button className="btn" type="button" onClick={() => setC(null)}>Cancel</button>
        </div>
        {msg && !msg.ok && <p className={styles.err}>{msg.error}</p>}
      </form>
    </section>
  );
}

function holidaySummary(h: HolidaySettings | null | undefined): string {
  if (!h?.country) return "None";
  const country = HOLIDAY_COUNTRIES.find((x) => x.id === h.country)?.label ?? h.country;
  const region = HOLIDAY_REGIONS[h.country]?.find((r) => r.id === h.region)?.label;
  return region ? `${country} + ${region}` : country;
}
