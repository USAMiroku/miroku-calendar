import EditorShell, { requireEditor } from "@/components/EditorShell";
import PeopleEditor, { type Person, type JoinRequest } from "@/components/PeopleEditor";
import { DEMO_MODE, supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PeoplePage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const ctx = await requireEditor(org, "admin", `/${org}/admin/people`);
  let people: Person[] = [];
  let requests: JoinRequest[] = [];
  if (DEMO_MODE) {
    people = [{ kind: "member", id: "demo", email: "you@example.org", role: "admin" }];
  } else {
    const sb = await supabaseServer();
    const [m, inv, req] = await Promise.all([
      sb.rpc("org_people", { o: ctx.org.id }),
      sb.from("invitations").select("email, role").eq("org_id", ctx.org.id),
      sb.from("access_requests").select("user_id, email, name, message, created_at").eq("org_id", ctx.org.id).order("created_at"),
    ]);
    requests = ((req.data ?? []) as { user_id: string; email: string; name: string; message: string; created_at: string }[]).map((r) => ({
      userId: r.user_id, email: r.email, name: r.name, message: r.message, since: r.created_at,
    }));
    people = [
      ...((m.data ?? []) as { user_id: string; email: string; role: "admin" | "editor" }[]).map((p) => ({ kind: "member" as const, id: p.user_id, email: p.email, role: p.role })),
      ...((inv.data ?? []) as { email: string; role: "admin" | "editor" }[]).map((p) => ({ kind: "invite" as const, id: p.email, email: p.email, role: p.role })),
    ];
  }
  return (
    <EditorShell orgSlug={org} orgName={ctx.org.name} role={ctx.role}>
      <PeopleEditor orgSlug={org} people={people} requests={requests} />
    </EditorShell>
  );
}
