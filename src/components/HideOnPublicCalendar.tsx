"use client";

import { usePathname } from "next/navigation";

/** A shared calendar page: /miroku-canada/canada/2026/12 */
export const isCalendarPage = (path: string) => /^\/[^/]+\/[^/]+\/\d{4}\/\d{1,2}\/?$/.test(path);

/** Hides its children on shared calendar pages when `hide` is set (visitors who are not signed in). */
export default function HideOnPublicCalendar({ hide, children }: { hide: boolean; children: React.ReactNode }) {
  const path = usePathname();
  if (hide && isCalendarPage(path)) return null;
  return <>{children}</>;
}
