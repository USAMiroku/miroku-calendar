import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, displayName, myOrganizations } from "@/lib/auth";
import { listOrganizations } from "@/lib/data";
import { DEMO_MODE, supabaseServer } from "@/lib/supabase/server";
import JoinForm, { type PendingRequest } from "@/components/JoinForm";

export const metadata: Metadata = { title: "Ask to join" };
export const dynamic = "force-dynamic";

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  const { org: orgSlug } = await searchParams;
  const user = await currentUser();
  if (!DEMO_MODE && !user) redirect(orgSlug ? `/login?org=${encodeURIComponent(orgSlug)}` : "/login?next=/join");
  const [orgs, mine] = await Promise.all([listOrganizations(), myOrganizations()]);
  let pending: PendingRequest[] = [];
  if (!DEMO_MODE && user) {
    const sb = await supabaseServer();
    const { data } = await sb.from("access_requests").select("org_id, created_at").eq("user_id", user.id);
    pending = (data ?? []).map((r) => ({ orgId: r.org_id as string, since: r.created_at as string }));
  }
  const mineIds = new Set(mine.map((o) => o.id));
  const chosen = orgs.find((o) => o.slug === orgSlug);
  if (chosen && mineIds.has(chosen.id)) redirect(`/${chosen.slug}/edit`);
  // Signed in for one organization: ask only that one. Otherwise pick from the list.
  const options = orgs.filter((o) => !mineIds.has(o.id) && (!chosen || o.id === chosen.id)).map((o) => ({ id: o.id, name: o.name }));
  return (
    <main className="container narrow">
      <h1>{chosen ? `Ask to join ${chosen.name}` : "Ask to join an organization"}</h1>
      <p className="muted">
        Welcome{user ? `, ${displayName(user)}` : ""}. {chosen ? "Send a short note." : "Choose your organization and send a short note."} One
        of its admins will approve you, and you can then add and change its events.
      </p>
      {mine.length > 0 && (
        <div className="card">
          <h2>You already belong to</h2>
          <ul className="plain">
            {mine.map((o) => (
              <li key={o.id}>
                <strong>{o.name}</strong> · {o.role === "admin" ? "Admin" : "Editor"} · <Link href={`/${o.slug}/edit`}>Edit events</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {chosen && orgs.length > 1 && (
        <p className="muted">
          Not the right one? <Link href="/join">Choose another organization</Link>
        </p>
      )}
      <JoinForm options={options} pending={pending} orgNames={Object.fromEntries(orgs.map((o) => [o.id, o.name]))} />
    </main>
  );
}
