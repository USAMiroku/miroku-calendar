/* eslint-disable @typescript-eslint/no-require-imports */
// Playwright script; see scripts/manual/README.md.
const { chromium } = require('playwright');
const lang = process.argv[2] || 'en';
const B = 'http://localhost:3123';
const C = (en, pt) => (lang === 'pt' ? pt : en);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: `scripts/manual/raw-${lang}`, size: { width: 1280, height: 720 } } });
  const p = await ctx.newPage();
  const wait = (ms) => p.waitForTimeout(ms);
  const prep = async () => {
    await p.addStyleTag({ content: `
      .notice{display:none!important} .site-user{visibility:hidden}
      #cap{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);max-width:1060px;width:calc(100% - 80px);background:rgba(20,16,14,.88);color:#fff;
        font:600 24px/1.35 system-ui,sans-serif;padding:14px 22px;border-radius:12px;text-align:center;z-index:9999;box-shadow:0 6px 24px rgba(0,0,0,.3)}
      #cap small{display:block;font-weight:400;font-size:17px;opacity:.85;margin-top:4px}
      .hl{outline:4px solid #f2b705!important;outline-offset:4px;border-radius:8px;transition:outline .2s}
      #card{position:fixed;inset:0;background:radial-gradient(ellipse at top,#fff,#f3e6db);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:system-ui}
      #card h1{font:700 54px Georgia,serif;color:#b3141b;margin:18px 0 8px} #card p{font-size:26px;color:#3a3330;margin:6px 40px}` });
  };
  const go = async (url) => { await p.goto(B + url, { waitUntil: 'networkidle' }); await prep(); };
  const cap = async (text, sub, ms = 4200) => {
    await p.evaluate(([t, s]) => { let c = document.getElementById('cap'); if (!c) { c = document.createElement('div'); c.id = 'cap'; document.body.appendChild(c); }
      c.innerHTML = t + (s ? `<small>${s}</small>` : ''); }, [text, sub || '']);
    await wait(ms);
  };
  const hl = async (sel) => { await p.evaluate(() => document.querySelectorAll('.hl').forEach((e) => e.classList.remove('hl')));
    if (!sel) return; const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded(); await l.evaluate((e) => { e.classList.add('hl'); window.scrollBy(0, e.getBoundingClientRect().top - 180); }); await wait(300); };
  const card = async (title, lines, ms = 4500) => {
    await p.evaluate(([t, ls]) => { document.getElementById('cap')?.remove(); const d = document.createElement('div'); d.id = 'card';
      d.innerHTML = `<img src="/izunome-logo.png" width="110" style="border-radius:50%"><h1>${t}</h1>` + ls.map((x) => `<p>${x}</p>`).join(''); document.body.appendChild(d); }, [title, lines]);
    await wait(ms);
    await p.evaluate(() => document.getElementById('card')?.remove());
  };

  // 1. Title
  await go('/');
  await card('Miroku Calendar', [C('How to use it, step by step', 'Como usar, passo a passo'), 'miroku-calendar.vercel.app'], 4500);
  await cap(C('Miroku Calendar is the monthly activities calendar of each Miroku organization and centre.', 'O Miroku Calendar é o calendário mensal de atividades de cada organização e centro Miroku.'),
    C('Plan it together, print it on one page, and share it with every member.', 'Planeje em equipe, imprima numa página e compartilhe com todos os membros.'), 5000);

  // 2. Members
  await card(C('Part 1 · For members', 'Parte 1 · Para membros'), [C('Read, print and add the calendar to your phone', 'Ver, imprimir e adicionar o calendário ao celular'), C('No account needed', 'Não precisa de conta')], 3800);
  await go('/miroku-canada/canada/2026/12');
  await cap(C('Members open the link their centre shares. No sign-in is needed.', 'Os membros abrem o link que o centro compartilha. Não é preciso entrar com conta.'), null, 4500);
  await hl('.toolbar > div:first-child');
  await cap(C('Use ‹ and › to see other months.', 'Use ‹ e › para ver outros meses.'), null, 3500);
  await hl('.add-cal > button');
  await cap(C('“Add to my calendar” puts every activity on your phone, with a reminder.', '“Add to my calendar” coloca todas as atividades no seu celular, com lembrete.'), null, 3500);
  await p.click('.add-cal > button'); await prep(); await hl('.add-cal-menu');
  await cap(C('Choose iPhone, Android/Google or Outlook. Subscribe once: new months appear by themselves.', 'Escolha iPhone, Android/Google ou Outlook. Assine uma vez: os novos meses aparecem sozinhos.'), null, 5500);
  await p.click('.add-cal > button');
  await hl('text=Print / Save as PDF');
  await cap(C('“Print / Save as PDF” prints the month on one landscape page.', '“Print / Save as PDF” imprime o mês numa página na horizontal.'), C('To get a PDF, choose “Save as PDF” as the printer.', 'Para ter um PDF, escolha “Salvar como PDF” como impressora.'), 5000);
  await hl(null);

  // 3. Sign in
  await card(C('Part 2 · For editors', 'Parte 2 · Para editores'), [C('Sign in, add events, publish the month', 'Entrar, adicionar eventos, publicar o mês')], 3800);
  await go('/login');
  await cap(C('Editors click “Sign in to your organization” and choose theirs (Canada, USA…).', 'Os editores clicam em “Sign in to your organization” e escolhem a sua (Canadá, EUA…).'), null, 4500);
  await hl('.auth-card .btn');
  await cap(C('Then “Continue with Google”. No password: your Google account is your sign-in.', 'Depois “Continue with Google”. Sem senha: a sua conta Google é o seu acesso.'),
    C('The first time, you ask to join and an admin approves you.', 'Na primeira vez, você pede para participar e um administrador aprova.'), 5500);

  // 4. Events
  await go('/miroku-canada/edit?y=2027&m=1');
  await cap(C('The Events page: the form on the left, the month on the right.', 'A página Events: o formulário à esquerda, o mês à direita.'), null, 4000);
  await hl('text=Start from another month >> xpath=..');
  await cap(C('New month? Copy the month before in one click.', 'Mês novo? Copie o mês anterior com um clique.'), C('The 2nd Sunday goes to the 2nd Sunday, and weekly activities stay weekly.', 'O 2º domingo vai para o 2º domingo, e as atividades semanais continuam semanais.'), 5500);
  await go('/miroku-canada/edit?y=2026&m=12');
  await hl('form');
  await cap(C('To add an event, fill in the date, time, group and activity.', 'Para adicionar um evento, preencha a data, o horário, o grupo e a atividade.'), null, 3000);
  await p.fill('input[type=date]', '2026-12-13');
  await p.locator('input[type=time]').first().fill('14:00');
  await p.locator('input[type=time]').nth(1).fill('16:00');
  await wait(800);
  await hl('[aria-live=polite]');
  await cap(C('The preview shows the line in each language. Translations, place and colour fill in by themselves.', 'A pré-visualização mostra a linha em cada idioma. Traduções, local e cor se preenchem sozinhos.'), null, 5500);
  await hl('button[type=submit]');
  await cap(C('Then click “Add event”. Use Edit or Delete in the list to change one.', 'Depois clique em “Add event”. Use Edit ou Delete na lista para mudar um evento.'), null, 4500);
  await hl('text=Calendars for this month');
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await cap(C('When the month is ready, click “Publish” next to each calendar…', 'Quando o mês estiver pronto, clique em “Publish” ao lado de cada calendário…'), null, 4000);
  await hl('text=Copy member link');
  await cap(C('…then “Copy member link” and send it to the members.', '…depois em “Copy member link” e envie aos membros.'), C('Members only see published months.', 'Os membros só veem os meses publicados.'), 4800);
  await hl(null);

  // 5. Admins
  await card(C('Part 3 · For admins', 'Parte 3 · Para administradores'), [C('Groups, activities, calendars and people', 'Grupos, atividades, calendários e pessoas')], 3800);
  await go('/miroku-canada/admin/lists');
  await cap(C('“Groups & activities”: each name is typed once, in each language, and reused.', '“Groups & activities”: cada nome é digitado uma vez, em cada idioma, e reutilizado.'), null, 4500);
  await p.click('text=Add a group'); await prep();
  await hl('select >> nth=0');
  await cap(C('A group in another time zone (e.g. Vancouver) picks it from this list.', 'Um grupo em outro fuso horário (ex.: Vancouver) escolhe o fuso nesta lista.'), C('The calendar then shows “(Pacific Time)”, and phones get the right hour.', 'O calendário mostra “(Pacific Time)” e os celulares recebem o horário certo.'), 5500);
  await go('/miroku-canada/admin/settings');
  await p.click('text=Edit >> nth=0'); await prep();
  await hl('text=Main language (bold line) >> xpath=../..');
  await cap(C('“Calendars”: each calendar has one or two languages: EN, FR, PT or ES.', '“Calendars”: cada calendário tem um ou dois idiomas: EN, FR, PT ou ES.'), C('A centre calendar can show only that centre’s groups.', 'O calendário de um centro pode mostrar só os grupos desse centro.'), 5500);
  await hl('text=Logo address');
  await cap(C('Here you also set the banner, logo, colours and open hours.', 'Aqui você também define o cabeçalho, o logotipo, as cores e o horário de funcionamento.'), null, 4500);
  await go('/miroku-canada/admin/people');
  await hl('form');
  await cap(C('“People”: approve those who asked to join, or give access by Google email.', '“People”: aprove quem pediu para participar, ou dê acesso pelo e-mail Google.'), C('Editors manage events; admins also manage the setup.', 'Editores cuidam dos eventos; administradores também cuidam da configuração.'), 5500);
  await hl(null);

  // 6. Help
  await go(lang === 'pt' ? '/help?lang=pt' : '/help');
  await hl('.help-actions');
  await cap(C('The full manual is under “Help”, and you can download it as a PDF.', 'O manual completo está em “Help”, e você pode baixá-lo em PDF.'), null, 5000);
  await hl(null);
  await card('Miroku Calendar', ['miroku-calendar.vercel.app', C('Questions? Ask an admin of your organization.', 'Dúvidas? Fale com um administrador da sua organização.')], 4500);
  await ctx.close(); await b.close();
})();
