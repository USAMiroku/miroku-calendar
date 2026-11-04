import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Marked } from "marked";

export const metadata: Metadata = { title: "Help" };
export const dynamic = "force-dynamic";

const slug = (text: string) =>
  text.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** The user manual (docs/user-manual.md), shown as a page. One file is the source for both. */
export default function HelpPage() {
  const md = fs.readFileSync(path.join(process.cwd(), "docs/user-manual.md"), "utf8")
    // The page already is the in-app copy, so drop the line that points to it.
    .replace(/^The same guide is inside the app[\s\S]*?\n\n/m, "");
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
    <main className="container help">
      <nav className="help-toc no-print" aria-label="Contents">
        <strong>Contents</strong>
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
