"use client";

import { useRouter } from "next/navigation";
import { monthName } from "@/lib/format";
import type { Lang } from "@/lib/types";

export default function MonthPicker({ base, year, month, lang, query }: { base: string; year: number; month: number; lang: Lang; query?: boolean }) {
  const router = useRouter();
  const go = (y: number, m: number) => {
    if (m < 1) { y -= 1; m = 12; }
    if (m > 12) { y += 1; m = 1; }
    router.push(query ? `${base}?y=${y}&m=${m}` : `${base}/${y}/${m}`);
  };
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - 2020 + 3 }, (_, i) => 2020 + i);
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <button className="btn" aria-label="Previous month" onClick={() => go(year, month - 1)}>‹</button>
      <select aria-label="Month" value={month} onChange={(e) => go(year, Number(e.target.value))}>
        {Array.from({ length: 12 }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            {monthName(lang, i + 1).replace(/^./, (c) => c.toUpperCase())}
          </option>
        ))}
      </select>
      <select aria-label="Year" value={year} onChange={(e) => go(Number(e.target.value), month)}>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      <button className="btn" aria-label="Next month" onClick={() => go(year, month + 1)}>›</button>
    </div>
  );
}
