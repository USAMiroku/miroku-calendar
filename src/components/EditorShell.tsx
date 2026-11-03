import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrgLists } from "@/lib/data";
import { currentUser, roleIn, type Role } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

/** Loads the organization and checks the person may be here; renders the editor menu. */
export async function requireEditor(orgSlug: string, need: Role, path: string) {
  const lists = await getOrgLists(orgSlug);
  if (!lists) redirect("/");
  const role = await roleIn(lists.org.id);
  if (!role) redirect(`/login?next=${encodeURIComponent(path)}`);
  if (need === "admin" && role !== "admin") redirect(`/${orgSlug}/edit`);
  return { ...lists, role };
}

export default async function EditorShell({ orgSlug, orgName, role, children }: { orgSlug: string; orgName: string; role: Role; children: React.ReactNode }) {
  const user = await currentUser();
  const link = (href: string, text: string) => (
    <Link className="btn" href={`/${orgSlug}${href}`}>{text}</Link>
  );
  return (
    <main className="container">
      <nav className="toolbar no-print">
        <strong style={{ marginRight: 8 }}>{orgName}</strong>
        {link("/edit", "Events")}
        {role === "admin" && (
          <>
            {link("/admin/lists", "Groups & activities")}
            {link("/admin/settings", "Calendars")}
            {link("/admin/people", "People")}
            {link("/admin/import", "Import CSV")}
          </>
        )}
        <span className="spacer" />
        {user?.email && <small>{user.email}</small>}
        {!DEMO_MODE && (
          <form action={signOut}>
            <button className="btn" type="submit">Sign out</button>
          </form>
        )}
      </nav>
      {DEMO_MODE && <p className="notice">Demo mode: you can try every screen, but nothing is saved until a database is connected.</p>}
      {children}
    </main>
  );
}
