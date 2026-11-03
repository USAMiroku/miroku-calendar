import EditorShell, { requireEditor } from "@/components/EditorShell";
import ListsEditor from "@/components/ListsEditor";
import { orgLanguages } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ListsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const ctx = await requireEditor(org, "admin", `/${org}/admin/lists`);
  return (
    <EditorShell orgSlug={org} orgName={ctx.org.name} role={ctx.role}>
      <ListsEditor orgSlug={org} groups={ctx.groups.filter((g) => !g.archived)} activities={ctx.activities.filter((a) => !a.archived)} langs={orgLanguages(ctx.calendars)} />
    </EditorShell>
  );
}
