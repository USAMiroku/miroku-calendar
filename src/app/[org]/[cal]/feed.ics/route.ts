import { buildIcs } from "@/lib/ics";
import { getFeedData } from "@/lib/data";

export const dynamic = "force-dynamic";

/** /miroku-canada/canada/feed.ics: the calendar for phones and calendar apps to subscribe to. */
export async function GET(request: Request, { params }: { params: Promise<{ org: string; cal: string }> }) {
  const { org, cal } = await params;
  const data = await getFeedData(org, cal);
  if (!data) return new Response("Calendar not found", { status: 404 });
  const origin = new URL(request.url).origin;
  const body = buildIcs({ ...data, pageUrl: `${origin}/${org}/${cal}` });
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${cal}.ics"`,
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
}
