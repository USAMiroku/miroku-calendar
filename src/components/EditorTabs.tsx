"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function EditorTabs({ orgSlug, admin }: { orgSlug: string; admin: boolean }) {
  const path = usePathname();
  const tabs: [string, string][] = [["/edit", "Events"]];
  if (admin)
    tabs.push(["/admin/lists", "Groups & activities"], ["/admin/settings", "Calendars"], ["/admin/people", "People"], ["/admin/import", "Import CSV"]);
  return (
    <nav className="tabs no-print">
      {tabs.map(([href, text]) => {
        const full = `/${orgSlug}${href}`;
        return (
          <Link key={href} href={full} className={`tab${path === full ? " active" : ""}`}>{text}</Link>
        );
      })}
    </nav>
  );
}
