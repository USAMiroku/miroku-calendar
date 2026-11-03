"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { invitePerson, removePerson, type Result } from "@/lib/actions";
import styles from "./Editor.module.css";

export interface Person {
  kind: "member" | "invite";
  id: string;
  email: string;
  role: "admin" | "editor";
}

export default function PeopleEditor({ orgSlug, people }: { orgSlug: string; people: Person[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<Result | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor">("editor");
  const act = (fn: () => Promise<Result>) =>
    start(async () => {
      const r = await fn();
      setMsg(r);
      if (r.ok) { setEmail(""); router.refresh(); }
    });

  return (
    <section className={styles.panel}>
      <h2>People who can edit</h2>
      <p><strong>Editors</strong> add and change events and publish months. <strong>Admins</strong> also manage groups, activities, calendars and people. Members who only read the calendar don’t need an account: share the month’s link with them.</p>
      <form className={styles.form} style={{ maxWidth: 520 }} onSubmit={(e) => { e.preventDefault(); act(() => invitePerson(orgSlug, email, role)); }}>
        <label>Email address<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Role
          <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "editor")}>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button className="btn primary" disabled={pending}>Give access</button>
        <small>Then tell them to open the site, click “Editor sign-in” and enter this email. No password is needed.</small>
      </form>
      {msg && <p className={msg.ok ? styles.ok : styles.err}>{msg.ok ? msg.message ?? "Done." : msg.error}</p>}
      <table className={styles.table} style={{ marginTop: 16 }}>
        <thead><tr><th>Email</th><th>Role</th><th>Status</th><th /></tr></thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.kind + p.id}>
              <td>{p.email}</td>
              <td>{p.role === "admin" ? "Admin" : "Editor"}</td>
              <td>{p.kind === "member" ? "Active" : "Invited, not signed in yet"}</td>
              <td><button className="btn" disabled={pending} onClick={() => confirm(`Remove access for ${p.email}?`) && act(() => removePerson(orgSlug, p.kind, p.id))}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
