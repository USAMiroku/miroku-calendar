"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Activity, Group, Lang, Localized, VenueType } from "@/lib/types";
import { LANG_NAMES } from "@/lib/format";
import { archiveItem, saveActivity, saveGroup, type ActivityInput, type GroupInput, type Result } from "@/lib/actions";
import styles from "./Editor.module.css";
import { TIME_ZONES, timeZoneId, timeZoneLabel } from "@/lib/timeZones";

/** Soft colours that keep black text easy to read on screen and on paper. */
const PALETTE: { hex: string; name: string }[] = [
  { hex: "#FFF2CC", name: "Yellow" },
  { hex: "#FCE4D6", name: "Orange" },
  { hex: "#F8D7E3", name: "Pink" },
  { hex: "#E4DFEC", name: "Lavender" },
  { hex: "#D5F0E8", name: "Mint" },
  { hex: "#DDEBF7", name: "Sky" },
  { hex: "#EDEDED", name: "Grey" },
];

function Swatch({ colour }: { colour?: string | null }) {
  if (!colour) return <span style={{ color: "var(--muted)" }}>None</span>;
  return <span title={colour} style={{ display: "inline-block", width: 22, height: 16, background: colour, border: "1px solid #888", borderRadius: 3, verticalAlign: "middle" }} />;
}

function ColourPicker({ value, onChange }: { value?: string | null; onChange: (c: string | null) => void }) {
  const v = value?.toUpperCase() ?? null;
  const box = (selected: boolean): React.CSSProperties => ({
    width: 30, height: 26, borderRadius: 4, cursor: "pointer", padding: 0,
    border: selected ? "3px solid #222" : "1px solid #888",
  });
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 6 }}>
      <legend style={{ fontWeight: 600, marginBottom: 4 }}>
        Colour on the calendar <small style={{ fontWeight: 400, color: "var(--muted)" }}>(optional, shown in the legend too)</small>
      </legend>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button type="button" className="btn" aria-pressed={!v} style={{ fontWeight: !v ? 700 : 400 }} onClick={() => onChange(null)}>No colour</button>
        {PALETTE.map((p) => (
          <button key={p.hex} type="button" title={p.name} aria-label={p.name} aria-pressed={v === p.hex} style={{ ...box(v === p.hex), background: p.hex }} onClick={() => onChange(p.hex)} />
        ))}
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 400 }}>
          Other
          <input type="color" style={{ width: 40, minHeight: 26, padding: 0 }} value={v ?? "#FFFFFF"} onChange={(e) => onChange(e.target.value)} />
        </label>
      </div>
    </fieldset>
  );
}

const VENUES: Record<VenueType, string> = { centre: "Centre", public: "Public venue", home: "Member home" };

function LangFields({ label, value, langs, onChange, hint }: { label: string; value: Localized; langs: Lang[]; onChange: (v: Localized) => void; hint?: string }) {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 6 }}>
      <legend style={{ fontWeight: 600, marginBottom: 4 }}>{label} {hint && <small style={{ fontWeight: 400, color: "var(--muted)" }}>{hint}</small>}</legend>
      <div className={styles.grid2}>
        {langs.map((l) => (
          <label key={l} style={{ fontWeight: 400 }}>
            {LANG_NAMES[l]}
            <input value={value[l] ?? ""} onChange={(e) => onChange({ ...value, [l]: e.target.value })} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function ListsEditor({ orgSlug, groups, activities, langs }: { orgSlug: string; groups: Group[]; activities: Activity[]; langs: Lang[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<Result | null>(null);
  const [g, setG] = useState<GroupInput | null>(null);
  const [a, setA] = useState<ActivityInput | null>(null);
  const [tzCustom, setTzCustom] = useState(false);

  const act = (fn: () => Promise<Result>, done: () => void) =>
    start(async () => {
      const r = await fn();
      setMsg(r);
      if (r.ok) { done(); router.refresh(); }
    });

  const newGroup = (): GroupInput => ({ key: "", name: {}, location: {}, timeZoneLabel: {}, venueType: "public", sortOrder: groups.length });
  const newActivity = (): ActivityInput => ({ key: "", name: {}, addGroupName: false, isNationalService: false, colour: null });

  return (
    <div className={styles.layout} style={{ gridTemplateColumns: "1fr" }}>
      {msg && <p className={msg.ok ? styles.ok : styles.err}>{msg.ok ? msg.message ?? "Saved." : msg.error}</p>}

      <section className={styles.panel}>
        <h2>Groups</h2>
        {g ? (
          <form className={styles.form} onSubmit={(e) => { e.preventDefault(); act(() => saveGroup(orgSlug, g), () => setG(null)); }}>
            <label>Short name (used in the dropdown and CSV import)<input required value={g.key} onChange={(e) => setG({ ...g, key: e.target.value })} /></label>
            <LangFields label="Group name" value={g.name} langs={langs} onChange={(v) => setG({ ...g, name: v })} />
            <LangFields label="Location" value={g.location} langs={langs} onChange={(v) => setG({ ...g, location: v })} />
            <label>Time zone
              <select
                value={tzCustom ? "custom" : timeZoneId(g.timeZoneLabel)}
                onChange={(e) => {
                  setTzCustom(e.target.value === "custom");
                  if (e.target.value !== "custom") setG({ ...g, timeZoneLabel: timeZoneLabel(e.target.value) });
                }}
              >
                <option value="">Same as the calendar (not shown)</option>
                {TIME_ZONES.map((z) => <option key={z.id} value={z.id}>{z.label.en}</option>)}
                <option value="custom">Other (type it below)</option>
              </select>
              <small>Shown after the time, e.g. “6 – 8 PM (Pacific Time)”. Choose it only for groups in a different time zone from the calendar.</small>
            </label>
            {(tzCustom || timeZoneId(g.timeZoneLabel) === "custom") && (
              <LangFields label="Time zone, as written on the calendar" value={g.timeZoneLabel} langs={langs} onChange={(v) => setG({ ...g, timeZoneLabel: v })} />
            )}
            <label>Venue type
              <select value={g.venueType} onChange={(e) => setG({ ...g, venueType: e.target.value as VenueType })}>
                {Object.entries(VENUES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <div className={styles.actions}>
              <button className="btn primary" disabled={pending}>Save group</button>
              <button className="btn" type="button" onClick={() => setG(null)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <table className={styles.table}>
              <thead><tr><th>Group</th><th>Location</th><th>Time zone</th><th>Venue</th><th /></tr></thead>
              <tbody>
                {groups.map((x) => (
                  <tr key={x.id}>
                    <td><strong>{x.key}</strong><br />{langs.map((l) => x.name[l]).filter(Boolean).join(" / ")}</td>
                    <td>{x.location[langs[0]]}</td>
                    <td>{x.timeZoneLabel[langs[0]] || <span style={{ color: "var(--muted)" }}>—</span>}</td>
                    <td>{VENUES[x.venueType]}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn" onClick={() => { setTzCustom(false); setG({ ...x }); }}>Edit</button>{" "}
                      <button className="btn" disabled={pending} onClick={() => confirm(`Remove ${x.key} from the list? Past months keep it.`) && act(() => archiveItem(orgSlug, "groups", x.id), () => {})}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p><button className="btn primary" onClick={() => { setTzCustom(false); setG(newGroup()); }}>Add a group</button></p>
          </>
        )}
      </section>

      <section className={styles.panel}>
        <h2>Activities</h2>
        {a ? (
          <form className={styles.form} onSubmit={(e) => { e.preventDefault(); act(() => saveActivity(orgSlug, a), () => setA(null)); }}>
            <label>Short name<input required value={a.key} onChange={(e) => setA({ ...a, key: e.target.value })} /></label>
            <LangFields label="Activity name" hint="typed once, reused for every event" value={a.name} langs={langs} onChange={(v) => setA({ ...a, name: v })} />
            <label className={styles.check}><input type="checkbox" checked={a.addGroupName} onChange={(e) => setA({ ...a, addGroupName: e.target.checked })} /> Add the group name (e.g. “Johrei Gathering – Calgary Group”)</label>
            <label className={styles.check}><input type="checkbox" checked={a.isNationalService} onChange={(e) => setA({ ...a, isNationalService: e.target.checked })} /> Service (uses the calendar&apos;s Service colour, and shows on centre calendars that include services)</label>
            {!a.isNationalService && <ColourPicker value={a.colour} onChange={(c) => setA({ ...a, colour: c })} />}
            <div className={styles.actions}>
              <button className="btn primary" disabled={pending}>Save activity</button>
              <button className="btn" type="button" onClick={() => setA(null)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <table className={styles.table}>
              <thead><tr><th>Activity</th><th>Adds group name</th><th>Service</th><th>Colour</th><th /></tr></thead>
              <tbody>
                {activities.map((x) => (
                  <tr key={x.id}>
                    <td><strong>{x.key}</strong><br />{langs.map((l) => x.name[l]).filter(Boolean).join(" / ")}</td>
                    <td>{x.addGroupName ? "Yes" : "No"}</td>
                    <td>{x.isNationalService ? "Yes" : "No"}</td>
                    <td>{x.isNationalService ? <span style={{ color: "var(--muted)" }}>Service colour</span> : <Swatch colour={x.colour} />}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn" onClick={() => setA({ ...x })}>Edit</button>{" "}
                      <button className="btn" disabled={pending} onClick={() => confirm(`Remove ${x.key} from the list? Past months keep it.`) && act(() => archiveItem(orgSlug, "activities", x.id), () => {})}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p><button className="btn primary" onClick={() => setA(newActivity())}>Add an activity</button></p>
          </>
        )}
      </section>
    </div>
  );
}
