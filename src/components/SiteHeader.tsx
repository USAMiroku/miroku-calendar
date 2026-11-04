import Link from "next/link";
import { currentUser, displayName, myOrganizations } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

/** The bar at the top of every page: the Miroku Calendar name (back home), your organizations, and sign in/out. */
export default async function SiteHeader() {
  const user = await currentUser();
  const orgs = user ? await myOrganizations() : [];
  return (
    <header className="site-header no-print">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/izunome-logo.png" alt="" width={34} height={34} />
          <span>Miroku Calendar</span>
        </Link>
        <nav className="site-nav">
          <Link href="/#calendars">Calendars</Link>
          {orgs.length === 1 && <Link href={`/${orgs[0].slug}/edit`}>Edit events</Link>}
          {orgs.length > 1 && <Link href="/#workspace">My organizations</Link>}
          {user && orgs.length === 0 && <Link href="/join">Ask to join</Link>}
        </nav>
        <div className="site-user">
          {user ? (
            <>
              <span className="who" title={user.email ?? ""}>{displayName(user)}</span>
              <form action={signOut}>
                <button className="btn small" type="submit">Sign out</button>
              </form>
            </>
          ) : (
            <Link className="btn small" href="/login">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
