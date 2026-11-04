import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Marked } from "marked";

export const metadata: Metadata = { title: "Help" };
export const dynamic = "force-dynamic";

const slug = (text: string) =>
  text.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** The user manual (docs/user-manual.md), shown as a page. One file is the source for both. */
const MANUALS = {
  en: { file: "docs/user-manual.md", contents: "Contents", pdf: "Download PDF", video: "Watch the video", other: "Português", otherHref: "/help?lang=pt" },
  pt: { file: "docs/user-manual.pt.md", contents: "Índice", pdf: "Baixar PDF", video: "Assistir ao vídeo", other: "English", otherHref: "/help" },
};

export default async function HelpPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = (await searchParams).lang === "pt" ? "pt" : "en";
  const t = MANUALS[lang];
  const md = fs.readFileSync(path.join(process.cwd(), t.file), "utf8")
    // The page already is the in-app copy, so drop the paragraph that points to it.
    .replace(/^(The same guide is inside the app|O mesmo guia está dentro do aplicativo)[\s\S]*?\n\n/m, "");
  const toc: { id: string; text: string }[] = [];
  const marked = new Marked({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const id = slug(text);
        if (depth === 2) toc.push({ id, text });
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      },
      link({ href, tokens }) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:/.test(href) && !href.includes("miroku-calendar.vercel.app");
        return `<a href="${href}"${external ? ' target="_blank" rel="noreferrer"' : ""}>${text}</a>`;
      },
    },
  });
  const html = marked.parse(md, { async: false });
  return (
    <main className="container help" lang={lang}>
      <nav className="help-toc no-print" aria-label={t.contents}>
        <div className="help-actions">
          <a className="btn primary small" href={`/manual/miroku-calendar-manual-${lang}.pdf`} download>⬇ {t.pdf}</a>
          <a className="btn small" href={`/manual/miroku-calendar-video-${lang}.mp4`} target="_blank" rel="noreferrer">▶ {t.video}</a>
          <a className="btn small" href={t.otherHref}>{t.other}</a>
        </div>
        <strong>{t.contents}</strong>
        <ol>
          {toc.map((t) => (
            <li key={t.id}><a href={`#${t.id}`} dangerouslySetInnerHTML={{ __html: t.text.replace(/^\d+\.\s*/, "") }} /></li>
          ))}
        </ol>
      </nav>
      <article className="help-body" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
