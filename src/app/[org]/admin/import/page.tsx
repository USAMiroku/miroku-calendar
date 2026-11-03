import EditorShell, { requireEditor } from "@/components/EditorShell";
import CsvImporter from "@/components/CsvImporter";

export const dynamic = "force-dynamic";

export default async function ImportPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const ctx = await requireEditor(org, "admin", `/${org}/admin/import`);
  return (
    <EditorShell orgSlug={org} orgName={ctx.org.name} role={ctx.role}>
      <CsvImporter orgSlug={org} groups={ctx.groups} activities={ctx.activities} />
    </EditorShell>
  );
}
