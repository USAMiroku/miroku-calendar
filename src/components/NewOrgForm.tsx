"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/types";
import { LANG_NAMES } from "@/lib/format";
import { slugify } from "@/lib/newOrg";
import { createOrganization, type Result } from "@/lib/actions";
import styles from "./Editor.module.css";

const ALL_LANGS = Object.keys(LANG_NAMES) as Lang[];

export default function NewOrgForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<Result | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [calSlug, setCalSlug] = useState("calendar");
  const [lang1, setLang1] = useState<Lang>("en");
  const [lang2, setLang2] = useState<Lang | "">("");

  const webName = slugTouched ? slug : slugify(name);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const languages = (lang2 ? [lang1, lang2] : [lang1]) as [Lang] | [Lang, Lang];
    start(async () => {
      const r = await createOrganization({ name, slug: webName, calendarSlug: calSlug, languages });
      if (r.ok && r.message) router.push(`/${r.message}/admin/lists`);
      else setMsg(r);
    });
  };

  return (
    <form className={styles.panel} onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      <label>
        Name
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Miroku Association USA" />
      </label>
      <label>
        Web name
        <input
          required
          value={webName}
          onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
          pattern="[a-z0-9-]+"
        />
        <small style={{ fontWeight: 400 }}>Used in links, e.g. miroku-calendar.vercel.app/{webName || "miroku-usa"}. Only a–z, 0–9 and dashes.</small>
      </label>
      <label>
        First calendar’s web name
        <input required value={calSlug} onChange={(e) => setCalSlug(e.target.value)} pattern="[a-z0-9-]+" />
        <small style={{ fontWeight: 400 }}>The shareable link will be /{webName || "…"}/{calSlug || "…"}. You can add centre calendars later.</small>
      </label>
      <div className={styles.grid2}>
        <label>
          Main language (bold line)
          <select value={lang1} onChange={(e) => { const v = e.target.value as Lang; setLang1(v); if (lang2 === v) setLang2(""); }}>
            {ALL_LANGS.map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}
          </select>
        </label>
        <label>
          Second language (grey line)
          <select value={lang2} onChange={(e) => setLang2(e.target.value as Lang | "")}>
            <option value="">None</option>
            {ALL_LANGS.filter((l) => l !== lang1).map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}
          </select>
        </label>
      </div>
      <p style={{ margin: 0 }}><small>You will be the admin. Next you’ll add the groups and activities, then the logo, banner and open hours on the Calendars page.</small></p>
      <div>
        <button className="btn primary" type="submit" disabled={pending}>{pending ? "Creating…" : "Create organization"}</button>
      </div>
      {msg && !msg.ok && <p className="notice">{msg.error}</p>}
    </form>
  );
}
