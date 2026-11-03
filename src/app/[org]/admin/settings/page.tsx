import EditorShell, { requireEditor } from "@/components/EditorShell";
import CalendarSettingsEditor from "@/components/CalendarSettingsEditor";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const ctx = await requireEditor(org, "admin", `/${org}/admin/settings`);
  return (
    <EditorShell orgSlug={org} orgName={ctx.org.name} role={ctx.role}>
      <CalendarSettingsEditor orgSlug={org} orgName={ctx.org.name} calendars={ctx.calendars} groups={ctx.groups.filter((g) => !g.archived)} />
    </EditorShell>
  );
}
