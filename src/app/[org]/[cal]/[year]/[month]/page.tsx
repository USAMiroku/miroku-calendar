import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CalendarSheet from "@/components/CalendarSheet";
import MonthPicker from "@/components/MonthPicker";
import PrintButton from "@/components/PrintButton";
import FitToPage from "@/components/FitToPage";
import { getMonthData } from "@/lib/data";
import { formatMonthTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { org: string; cal: string; year: string; month: string };

async function load(p: Params) {
  const year = Number(p.year);
  const month = Number(p.month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return getMonthData(p.org, p.cal, year, month);
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await load(await params);
  if (!data) return {};
  return { title: `${data.calendar.name} – ${formatMonthTitle(data.calendar.settings.languages, data.year, data.month)}` };
}

export default async function MonthPage({ params }: { params: Promise<Params> }) {
  const p = await params;
  const data = await load(p);
  if (!data) notFound();
  return (
    <main className="container">
      <div className="toolbar no-print">
        <MonthPicker base={`/${p.org}/${p.cal}`} year={data.year} month={data.month} lang={data.calendar.settings.languages[0]} />
        <span className="spacer" />
        <PrintButton />
      </div>
      {!data.published && (
        <p className="notice no-print">This month is a draft. Members will see it once an editor publishes it.</p>
      )}
      <div className="paper">
        <CalendarSheet data={data} />
        <FitToPage />
      </div>
    </main>
  );
}
