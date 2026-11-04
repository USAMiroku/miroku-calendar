"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestAccess, withdrawRequest, type Result } from "@/lib/actions";

export interface PendingRequest {
  orgId: string;
  since: string;
}

export default function JoinForm({ options, pending, orgNames }: { options: { id: string; name: string }[]; pending: PendingRequest[]; orgNames: Record<string, string> }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<Result | null>(null);
  const pendingIds = new Set(pending.map((p) => p.orgId));
  const open = options.filter((o) => !pendingIds.has(o.id));
  const [orgId, setOrgId] = useState(open[0]?.id ?? "");
  const [note, setNote] = useState("");

  const act = (fn: () => Promise<Result>) =>
    start(async () => {
      const r = await fn();
      setMsg(r);
      if (r.ok) { setNote(""); router.refresh(); }
    });

  return (
    <>
      {pending.length > 0 && (
        <div className="card">
          <h2>Waiting for approval</h2>
          <ul className="plain">
            {pending.map((p) => (
              <li key={p.orgId}>
                <strong>{orgNames[p.orgId] ?? "Organization"}</strong> · asked {new Date(p.since).toLocaleDateString()} ·{" "}
                <button className="linklike" disabled={busy} onClick={() => act(() => withdrawRequest(p.orgId))}>Withdraw</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {open.length > 0 ? (
        <form className="card form-grid" onSubmit={(e) => { e.preventDefault(); act(() => requestAccess(orgId, note)); }}>
          <label>
            Organization
            <select value={orgId} onChange={(e) => setOrgId(e.target.value)}>
              {open.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
          <label>
            Note for the admin <span className="muted">(optional)</span>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. I coordinate the Toronto group and will enter our activities." />
          </label>
          <div><button className="btn primary" disabled={busy || !orgId}>Send request</button></div>
        </form>
      ) : (
        pending.length === 0 && <p className="muted">There are no other organizations to join yet.</p>
      )}
      {msg && <p className={msg.ok ? "ok" : "err"}>{msg.ok ? msg.message ?? "Done." : msg.error}</p>}
    </>
  );
}
