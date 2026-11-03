"use client";

import { useEffect } from "react";

/** Printable height of a landscape Letter page with 0.35 in margins, in CSS pixels. */
const PAGE_HEIGHT = (8.5 - 0.7) * 96 - 4;
const MIN_ZOOM = 0.75;

/**
 * Shrinks the calendar a little when printing so a busy month still fits on one page.
 * Below 75 % it stops shrinking and the month runs onto a second page instead.
 */
export default function FitToPage({ selector = "article" }: { selector?: string }) {
  useEffect(() => {
    const fit = () => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return;
      el.style.removeProperty("--print-zoom");
      const h = el.getBoundingClientRect().height;
      const zoom = Math.max(MIN_ZOOM, Math.min(1, PAGE_HEIGHT / h));
      el.style.setProperty("--print-zoom", zoom.toFixed(3));
    };
    fit();
    window.addEventListener("beforeprint", fit);
    window.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("beforeprint", fit);
      window.removeEventListener("resize", fit);
    };
  }, [selector]);
  return null;
}
