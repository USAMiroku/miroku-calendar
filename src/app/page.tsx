import Link from "next/link";
import { listOrganizations } from "@/lib/data";
import { DEMO_MODE } from "@/lib/supabase/server";
import { currentUser, displayName, isAnyAdmin, myOrganizations } from "@/lib/auth";
import GoogleButton from "@/components/GoogleButton";
import { LANG_NAMES } from "@/lib/format";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: "🗓️", title: "Plan in minutes", text: "Add an event with a date, a time, a group and an activity. Everything else fills in by itself, in every language." },
  { icon: "🖨️", title: "One page, ready to print", text: "Each month fits one landscape Letter page, with the banner, open hours and colour legend, or saves as a PDF." },
  { icon: "🔗", title: "One link for everyone", text: "Members open the calendar on their phone. Publish a month when it is ready; earlier months stay available." },
  { icon: "🌎", title: "Your languages", text: "English, French, Portuguese or Spanish, one or two at a time, for each organization and each centre." },
];

export default async function Home() {
  const user = await currentUser();
  const [orgs, mine, admin] = await Promise.all([listOrganizations(), myOrganizations(), isAnyAdmin()]);
  const myIds = new Map(mine.map((o) => [o.id, o.role]));

  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-logo" src="/izunome-logo.png" alt="Izunome" width={96} height={96} />
          <h1>Miroku Calendar</h1>
          <p className="lead">
            The monthly activities calendar of Miroku organizations and centres. Plan it together, print it on one page,
            and share it with every member.
          </p>
          <div className="hero-actions">
            <a className="btn primary big" href="#calendars">See the calendars</a>
            {!user && !DEMO_MODE && <GoogleButton big label="Sign in with Google" />}
            {user && mine.length === 0 && <Link className="btn big" href="/join">Ask to join your organization</Link>}
            {mine.length === 1 && <Link className="btn big" href={`/${mine[0].slug}/edit`}>Edit {mine[0].name}</Link>}
          </div>
        </div>
      </section>

      <div className="container">
        {DEMO_MODE && (
          <p className="notice">Demo mode: no database is connected, so you are seeing sample data for Miroku Association Canada.</p>
        )}

        {user && (
          <section id="workspace" className="section">
            <h2>Hello, {displayName(user).split(" ")[0]}</h2>
            {mine.length > 0 ? (
              <div className="card-grid">
                {mine.map((o) => (
                  <div key={o.id} className="card">
                    <small className="eyebrow">{o.role === "admin" ? "Admin" : "Editor"}</small>
                    <h3>{o.name}</h3>
                    <div className="card-actions">
                      <Link className="btn primary" href={`/${o.slug}/edit`}>Events</Link>
                      {o.role === "admin" && <Link className="btn" href={`/${o.slug}/admin/people`}>People</Link>}
                      {o.role === "admin" && <Link className="btn" href={`/${o.slug}/admin/settings`}>Calendars</Link>}
                    </div>
                  </div>
                ))}
                {admin && (
                  <Link href="/new" className="card card-add">
                    <span>＋</span>
                    New organization
                  </Link>
                )}
              </div>
            ) : (
              <div className="card">
                <p style={{ marginTop: 0 }}>
                  You’re signed in as <strong>{user.email}</strong>, but you don’t edit any calendar yet.
                </p>
                <Link className="btn primary" href="/join">Ask to join your organization</Link>
              </div>
            )}
          </section>
        )}

        <section id="calendars" className="section">
          <h2>Calendars</h2>
          <p className="muted">Open any calendar to see this month’s activities. No sign-in needed.</p>
          <div className="card-grid">
            {orgs.map((o) => (
              <div key={o.id} className="card org-card">
                <h3>{o.name}</h3>
                <ul className="cal-links">
                  {o.calendars.map((c) => (
                    <li key={c.id}>
                      <Link href={`/${o.slug}/${c.slug}`}>
                        <span className="cal-name">{c.name}</span>
                        <span className="cal-langs">{c.settings.languages.map((l) => LANG_NAMES[l].split(" ")[0]).join(" · ")}</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </li>
                  ))}
                  {o.calendars.length === 0 && <li className="muted">No calendar yet.</li>}
                </ul>
                {myIds.has(o.id) && <Link className="small-link" href={`/${o.slug}/edit`}>Edit events</Link>}
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>What it does</h2>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature">
                <div className="feature-icon" aria-hidden="true">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section how">
          <h2>How to join as an editor</h2>
          <ol className="steps">
            <li><strong>Sign in with Google.</strong> Your account is created the first time.</li>
            <li><strong>Ask to join</strong> your organization, with a short note.</li>
            <li><strong>An admin approves you</strong>, and you can start adding events.</li>
          </ol>
          {!user && !DEMO_MODE && <GoogleButton label="Sign in with Google" />}
          {user && mine.length === 0 && <Link className="btn primary" href="/join">Ask to join</Link>}
        </section>
      </div>
    </main>
  );
}
