import EditorTabs from "./EditorTabs";
import { redirect } from "next/navigation";
import { getOrgLists } from "@/lib/data";
import { currentUser, roleIn, type Role } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/supabase/server";

/** Loads the organization and checks the person may be here; renders the editor menu. */
export async function requireEditor(orgSlug: string, need: Role, path: string) {
  const lists = await getOrgLists(orgSlug);
  if (!lists) redirect("/");
  const role = await roleIn(lists.org.id);
  if (!role) redirect((await currentUser()) ? "/join" : `/login?next=${encodeURIComponent(path)}`);
  if (need === "admin" && role !== "admin") redirect(`/${orgSlug}/edit`);
  return { ...lists, role };
}

export default async function EditorShell({ orgSlug, orgName, role, children }: { orgSlug: string; orgName: string; role: Role; children: React.ReactNode }) {
  return (
    <main className="container">
      <div className="page-title no-print">
        <small>{role === "admin" ? "Admin" : "Editor"}</small>
        <h1>{orgName}</h1>
      </div>
      <EditorTabs orgSlug={orgSlug} admin={role === "admin"} />
      {DEMO_MODE && <p className="notice">Demo mode: you can try every screen, but nothing is saved until a database is connected.</p>}
      {children}
    </main>
  );
}
