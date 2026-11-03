"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Activity, Calendar, CalendarEvent, Group, Lang, Localized } from "@/lib/types";
import { formatEvent, LANG_NAMES, monthName, sortEvents } from "@/lib/format";
import { copyMonth, deleteEvent, saveEvent, setPublished, type Result } from "@/lib/actions";
import MonthPicker from "./MonthPicker";
import styles from "./Editor.module.css";

interface Props {
  orgSlug: string;
  year: number;
  month: number;
  groups: Group[];
  activities: Activity[];
  calendars: Calendar[];
  events: CalendarEvent[];
  publishedCalendarIds: string[];
  langs: Lang[];
}

interface Draft {
  id?: string;
  date: string;
  start: string;
  end: string;
  groupId: string;
  activityId: string;
  note: Localized;
  cancelled: boolean;
  repeatWeekly: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function EventEditor(p: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<Result | null>(null);

  // The most recently used activity is pre-selected.
  const recentActivity = useMemo(
    () => p.activities.filter((a) => !a.archived).sort((a, b) => (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? ""))[0]?.id ?? "",
    [p.activities],
  );
  const blank = (): Draft => ({
    date: `${p.year}-${pad(p.month)}-01`,
    start: "",
    end: "",
    groupId: p.groups.find((g) => !g.archived)?.id ?? "",
    activityId: recentActivity,
    note: {},
    cancelled: false,
    repeatWeekly: false,
  });
  const [draft, setDraft] = useState<Draft>(blank);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const groupById = new Map(p.groups.map((g) => [g.id, g]));
  const actById = new Map(p.activities.map((a) => [a.id, a]));

  const preview =
    draft.start && groupById.get(draft.groupId) && actById.get(draft.activityId)
      ? formatEvent(
          { id: "preview", orgId: "", date: draft.date, start: draft.start, end: draft.end || null, groupId: draft.groupId, activityId: draft.activityId, note: draft.note },
          groupById.get(draft.groupId)!,
          actById.get(draft.activityId)!,
          p.langs,
        )
      : null;

  const act = (fn: () => Promise<Result>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setMsg(r);
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    act(
      () => saveEvent(p.orgSlug, { ...draft, end: draft.end || null }),
      () => setDraft((d) => ({ ...blank(), date: d.date, groupId: d.groupId, activityId: d.activityId })),
    );
  };

  const edit = (ev: CalendarEvent) => {
    setDraft({
      id: ev.id, date: ev.date, start: ev.start, end: ev.end ?? "", groupId: ev.groupId, activityId: ev.activityId,
      note: ev.note ?? {}, cancelled: !!ev.cancelled, repeatWeekly: false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prev = p.month === 1 ? { y: p.year - 1, m: 12 } : { y: p.year, m: p.month - 1 };
  const monthLabel = `${monthName(p.langs[0], p.month)} ${p.year}`;

  return (
    <div className={styles.layout}>
      <section className={styles.panel}>
        <h2>{draft.id ? "Edit event" : "Add an event"}</h2>
        <form onSubmit={submit} className={styles.form}>
          <label>
            Date
            <input type="date" required value={draft.date} onChange={(e) => set("date", e.target.value)} />
          </label>
          <div className={styles.row2}>
            <label>
              Start
              <input type="time" required step={900} value={draft.start} onChange={(e) => set("start", e.target.value)} />
            </label>
            <label>
              End <small>(optional)</small>
              <input type="time" step={900} value={draft.end} onChange={(e) => set("end", e.target.value)} />
            </label>
          </div>
          <label>
            Group
            <select value={draft.groupId} onChange={(e) => set("groupId", e.target.value)}>
              {p.groups.filter((g) => !g.archived || g.id === draft.groupId).map((g) => (
                <option key={g.id} value={g.id}>{g.key}</option>
              ))}
            </select>
          </label>
          <label>
            Activity
            <select value={draft.activityId} onChange={(e) => set("activityId", e.target.value)}>
              {p.activities.filter((a) => !a.archived || a.id === draft.activityId).map((a) => (
                <option key={a.id} value={a.id}>{a.key}</option>
              ))}
            </select>
          </label>
          <details>
            <summary>More options</summary>
            {p.langs.map((l) => (
              <label key={l}>
                Note ({LANG_NAMES[l]}) <small>(optional, shown after the activity)</small>
                <input value={draft.note[l] ?? ""} onChange={(e) => set("note", { ...draft.note, [l]: e.target.value })} />
              </label>
            ))}
            <label className={styles.check}>
              <input type="checkbox" checked={draft.cancelled} onChange={(e) => set("cancelled", e.target.checked)} /> Cancelled
            </label>
          </details>
          {!draft.id && (
            <label className={styles.check}>
              <input type="checkbox" checked={draft.repeatWeekly} onChange={(e) => set("repeatWeekly", e.target.checked)} />
              Repeat every week for the rest of this month
            </label>
          )}

          {preview && (
            <div className={styles.preview} aria-live="polite">
              {preview.lines.map((l, i) => (
                <div key={l.lang} className={i === 0 ? styles.pPrimary : styles.pSecondary}>
                  {l.day} · {l.time} · {l.activity} · {l.location}
                </div>
              ))}
            </div>
          )}

          <div className={styles.actions}>
            <button className="btn primary" type="submit" disabled={pending}>
              {pending ? "Saving…" : draft.id ? "Save changes" : "Add event"}
            </button>
            {draft.id && (
              <button className="btn" type="button" onClick={() => setDraft(blank())}>Cancel</button>
            )}
          </div>
          {msg && <p className={msg.ok ? styles.ok : styles.err}>{msg.ok ? msg.message ?? "Done." : msg.error}</p>}
        </form>
      </section>

      <section className={styles.panel}>
        <div className="toolbar">
          <MonthPicker base={`/${p.orgSlug}/edit`} query year={p.year} month={p.month} lang={p.langs[0]} />
        </div>

        <h2 style={{ textTransform: "capitalize" }}>{monthLabel} · {p.events.length} events</h2>
        {p.events.length === 0 && (
          <p>
            No events yet.{" "}
            <button className="btn" disabled={pending} onClick={() => act(() => copyMonth(p.orgSlug, prev.y, prev.m, p.year, p.month))}>
              Copy last month’s events
            </button>
          </p>
        )}
        <ul className={styles.list}>
          {sortEvents(p.events).map((ev) => {
            const g = groupById.get(ev.groupId);
            const a = actById.get(ev.activityId);
            if (!g || !a) return null;
            const f = formatEvent(ev, g, a, p.langs.slice(0, 1));
            const l = f.lines[0];
            return (
              <li key={ev.id} className={`${styles.item} ${styles[f.colour]}`}>
                <div className={styles.day}>{f.dayNumber}</div>
                <div className={styles.itemText}>
                  <strong>{l.day} · {l.time}</strong>
                  <div style={ev.cancelled ? { textDecoration: "line-through" } : undefined}>{l.activity}</div>
                </div>
                <div className={styles.itemBtns}>
                  <button className="btn" onClick={() => edit(ev)}>Edit</button>
                  <button
                    className="btn"
                    disabled={pending}
                    onClick={() => confirm(`Delete “${l.activity}” on ${l.day} ${f.dayNumber}?`) && act(() => deleteEvent(p.orgSlug, ev.id))}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <h3>Calendars for this month</h3>
        <ul className={styles.calList}>
          {p.calendars.map((c) => {
            const isPub = p.publishedCalendarIds.includes(c.id);
            const href = `/${p.orgSlug}/${c.slug}/${p.year}/${p.month}`;
            return (
              <li key={c.id}>
                <span>{c.name}</span>
                <span className={isPub ? styles.badgeOn : styles.badgeOff}>{isPub ? "Published" : "Draft"}</span>
                <Link className="btn" href={href} target="_blank">View / print</Link>
                <button className="btn" disabled={pending} onClick={() => act(() => setPublished(p.orgSlug, c.id, p.year, p.month, !isPub))}>
                  {isPub ? "Unpublish" : "Publish"}
                </button>
                {isPub && (
                  <button className="btn" onClick={() => navigator.clipboard?.writeText(location.origin + href).then(() => setMsg({ ok: true, message: "Link copied." }))}>
                    Copy member link
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
