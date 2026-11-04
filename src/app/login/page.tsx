import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import GoogleButton from "@/components/GoogleButton";
import { currentUser } from "@/lib/auth";
import { listOrganizations } from "@/lib/data";
import { DEMO_MODE } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const safePath = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : undefined);

/**
 * Sign in by organization: first choose Miroku Canada, Miroku USA…, then continue with Google.
 * Members land on that organization's events; newcomers ask that organization's admins to join.
 */
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string; org?: string }> }) {
  const sp = await searchParams;
  const orgs = await listOrganizations();
  const askedNext = safePath(sp.next);
  // The organization comes from ?org=, or from the page the person was trying to open (/miroku-usa/edit).
  const slug = sp.org ?? askedNext?.split("/")[1];
  const org = orgs.find((o) => o.slug === slug) ?? (orgs.length === 1 ? orgs[0] : undefined);
  const next = askedNext ?? (org ? `/${org.slug}/edit` : "/");
  if (await currentUser()) redirect(next);

  return (
    <main className="container">
      <div className="auth-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/izunome-logo.png" alt="" width={72} height={72} />
        {org ? (
          <>
            <h1>Sign in to {org.name}</h1>
            <p className="muted">Use your Google account. If it’s your first time, this also creates your account.</p>
            {DEMO_MODE && <p className="notice">Demo mode: sign-in is off until a database is connected.</p>}
            <GoogleButton next={next} big />
            {orgs.length > 1 && (
              <p style={{ marginTop: 14 }}>
                <Link href="/login">Choose another organization</Link>
              </p>
            )}
          </>
        ) : (
          <>
            <h1>Sign in to Miroku Calendar</h1>
            <p className="muted">Choose your organization.</p>
            <div className="org-choices">
              {orgs.map((o) => (
                <Link key={o.id} className="org-choice" href={`/login?org=${o.slug}`}>
                  <strong>{o.name}</strong>
                  <span aria-hidden>›</span>
                </Link>
              ))}
            </div>
          </>
        )}
        {sp.error && <p className="notice" style={{ marginTop: 16 }}>{sp.error}</p>}
        <p className="fine">
          Anyone can read the published calendars without signing in. To add or change events, sign in to your
          organization; the first time, one of its admins approves you.
        </p>
      </div>
    </main>
  );
}
