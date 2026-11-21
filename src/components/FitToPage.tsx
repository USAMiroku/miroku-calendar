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
      let zoom = Math.min(1, PAGE_HEIGHT / el.getBoundingClientRect().height);
      // Text wraps a little differently once zoomed, so check again and shrink a touch more if needed.
      for (let i = 0; i < 4 && zoom > MIN_ZOOM; i++) {
        el.style.setProperty("--print-zoom", Math.max(MIN_ZOOM, zoom).toFixed(3));
        const h = el.getBoundingClientRect().height;
        if (h <= PAGE_HEIGHT) break;
        zoom = zoom * (PAGE_HEIGHT / h) - 0.005;
      }
      el.style.setProperty("--print-zoom", Math.max(MIN_ZOOM, zoom).toFixed(3));
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
