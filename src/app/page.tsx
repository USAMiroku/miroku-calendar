import Link from "next/link";
import { DEMO_MODE } from "@/lib/supabase/server";
import { currentUser, displayName, isAnyAdmin, myOrganizations } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await currentUser();
  const [mine, admin] = await Promise.all([myOrganizations(), isAnyAdmin()]);

  return (
    <main>
      <section className={user ? "hero" : "hero door"}>
        <div className="hero-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-logo" src="/izunome-logo.png" alt="Izunome" width={96} height={96} />
          <h1>Miroku Calendar</h1>
          <p className="lead">
            The monthly activities calendar of Miroku organizations and centres. Plan it together, print it on one page,
            and share it with every member.
          </p>
          <div className="hero-actions">
            {!user && <Link className="btn primary big" href="/login">Sign in to your organization</Link>}
            {user && mine.length === 0 && <Link className="btn primary big" href="/join">Ask to join your organization</Link>}
            {mine.length === 1 && <Link className="btn primary big" href={`/${mine[0].slug}/edit`}>Edit {mine[0].name}</Link>}
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

      </div>
    </main>
  );
}
