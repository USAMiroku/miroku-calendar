import EditorShell, { requireEditor } from "@/components/EditorShell";
import PeopleEditor, { type Person } from "@/components/PeopleEditor";
import { DEMO_MODE, supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PeoplePage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const ctx = await requireEditor(org, "admin", `/${org}/admin/people`);
  let people: Person[] = [];
  if (DEMO_MODE) {
    people = [{ kind: "member", id: "demo", email: "you@example.org", role: "admin" }];
  } else {
    const sb = await supabaseServer();
    const [m, inv] = await Promise.all([
      sb.rpc("org_people", { o: ctx.org.id }),
      sb.from("invitations").select("email, role").eq("org_id", ctx.org.id),
    ]);
    people = [
      ...((m.data ?? []) as { user_id: string; email: string; role: "admin" | "editor" }[]).map((p) => ({ kind: "member" as const, id: p.user_id, email: p.email, role: p.role })),
      ...((inv.data ?? []) as { email: string; role: "admin" | "editor" }[]).map((p) => ({ kind: "invite" as const, id: p.email, email: p.email, role: p.role })),
    ];
  }
  return (
    <EditorShell orgSlug={org} orgName={ctx.org.name} role={ctx.role}>
      <PeopleEditor orgSlug={org} people={people} />
    </EditorShell>
  );
}
