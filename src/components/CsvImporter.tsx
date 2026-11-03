"use client";

import { useState, useTransition } from "react";
import type { Activity, Group } from "@/lib/types";
import { parseEntriesCsv, type ParsedRow } from "@/lib/importCsv";
import { importEvents, type Result } from "@/lib/actions";
import styles from "./Editor.module.css";

export default function CsvImporter({ orgSlug, groups, activities }: { orgSlug: string; groups: Group[]; activities: Activity[] }) {
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [msg, setMsg] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const good = rows?.filter((r) => r.problems.length === 0) ?? [];
  const bad = rows?.filter((r) => r.problems.length > 0) ?? [];
  const g = new Map(groups.map((x) => [x.id, x.key]));
  const a = new Map(activities.map((x) => [x.id, x.key]));

  return (
    <section className={styles.panel}>
      <h2>Import events from Excel</h2>
      <p>
        In Excel, open the <strong>Entries</strong> tab and choose File → Save As → <strong>CSV UTF-8</strong>. The file needs the columns
        Date, Start, End, Group and Activity. Nothing is saved until you press Import.
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          setMsg(null);
          if (f) setRows(parseEntriesCsv(await f.text(), groups, activities));
        }}
      />
      {rows && (
        <>
          <p>
            <strong>{good.length}</strong> events ready to import
            {bad.length > 0 && <>, <strong className={styles.err}>{bad.length}</strong> rows need fixing (skipped)</>}.
          </p>
          {bad.length > 0 && (
            <>
              <p>Fix these in Excel, or add the missing group or activity on the Groups & activities page, then choose the file again.</p>
              <table className={styles.table}>
                <thead><tr><th>Row</th><th>Problem</th></tr></thead>
                <tbody>
                  {bad.slice(0, 50).map((r) => (
                    <tr key={r.line}><td>{r.line}</td><td>{r.problems.join("; ")}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {good.length > 0 && (
            <details>
              <summary>Preview the first rows</summary>
              <table className={styles.table}>
                <thead><tr><th>Date</th><th>Start</th><th>End</th><th>Group</th><th>Activity</th></tr></thead>
                <tbody>
                  {good.slice(0, 30).map((r) => (
                    <tr key={r.line}><td>{r.date}</td><td>{r.start}</td><td>{r.end ?? ""}</td><td>{g.get(r.groupId!)}</td><td>{a.get(r.activityId!)}</td></tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
          <p>
            <button
              className="btn primary"
              disabled={pending || good.length === 0}
              onClick={() =>
                start(async () => {
                  const r = await importEvents(
                    orgSlug,
                    good.map((x) => ({ date: x.date!, start: x.start!, end: x.end ?? null, groupId: x.groupId!, activityId: x.activityId! })),
                  );
                  setMsg(r);
                  if (r.ok) setRows(null);
                })
              }
            >
              {pending ? "Importing…" : `Import ${good.length} events`}
            </button>
          </p>
          <small>Importing the same file twice adds the events twice, so import each file once.</small>
        </>
      )}
      {msg && <p className={msg.ok ? styles.ok : styles.err}>{msg.ok ? msg.message : msg.error}</p>}
    </section>
  );
}
