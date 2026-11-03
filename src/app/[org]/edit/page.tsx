import EditorShell, { requireEditor } from "@/components/EditorShell";
import EventEditor from "@/components/EventEditor";
import { getOrgMonth, orgLanguages } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EditPage({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ y?: string; m?: string }> }) {
  const { org } = await params;
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.y) || now.getFullYear();
  const month = Number(sp.m) || now.getMonth() + 1;
  const ctx = await requireEditor(org, "editor", `/${org}/edit`);
  const { events, publishedCalendarIds } = await getOrgMonth(ctx.org.id, year, month);
  return (
    <EditorShell orgSlug={org} orgName={ctx.org.name} role={ctx.role}>
      <EventEditor
        orgSlug={org}
        year={year}
        month={month}
        groups={ctx.groups}
        activities={ctx.activities}
        calendars={ctx.calendars}
        events={events}
        publishedCalendarIds={publishedCalendarIds}
        langs={orgLanguages(ctx.calendars)}
      />
    </EditorShell>
  );
}
