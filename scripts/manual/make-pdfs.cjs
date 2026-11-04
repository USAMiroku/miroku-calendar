/* eslint-disable @typescript-eslint/no-require-imports */
// Playwright script; see scripts/manual/README.md.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [lang, q, title] of [['en','', 'Miroku Calendar – User Manual'], ['pt','?lang=pt', 'Miroku Calendar – Manual do Usuário']]) {
    await p.goto('http://localhost:3123/help' + q, { waitUntil: 'networkidle' });
    await p.pdf({ path: `public/manual/miroku-calendar-manual-${lang}.pdf`, format: 'Letter', margin: { top: '0.7in', bottom: '0.7in', left: '0.75in', right: '0.75in' },
      printBackground: true, displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:8px;color:#888;width:100%;text-align:right;padding-right:0.75in">${title}</div>`,
      footerTemplate: `<div style="font-size:8px;color:#888;width:100%;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>` });
  }


  await b.close();
})();
