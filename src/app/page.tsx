import Link from "next/link";
import { listOrganizations } from "@/lib/data";
import { DEMO_MODE } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const orgs = await listOrganizations();
  return (
    <main className="container">
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>Activities Calendar</h1>
        <span className="spacer" />
        <Link className="btn" href="/login">Editor sign-in</Link>
      </div>
      {DEMO_MODE && (
        <p className="notice">
          Demo mode: no database is connected, so you are seeing sample data for Miroku Association Canada. See README.md to connect Supabase.
        </p>
      )}
      {orgs.map((o) => (
        <section key={o.id}>
          <h2>{o.name}</h2>
          <ul>
            {o.calendars.map((c) => (
              <li key={c.id}>
                <Link href={`/${o.slug}/${c.slug}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
          <p><Link className="btn" href={`/${o.slug}/edit`}>Edit events</Link></p>
        </section>
      ))}
    </main>
  );
}
