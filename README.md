# Miroku Activities Calendar

A simple web app for making the monthly activities calendar of Miroku organizations and centres
(Miroku Association Canada, Miroku Association USA, ...), in one or two languages
(English, French, Portuguese, Spanish).

What it does:

- Editors sign in with an emailed link (no password) and add events with a date, time, group and activity.
  The translations, location, time zone and colour fill in automatically.
- Admins manage groups, activities, calendars (whole organization or one centre, 1–2 languages each),
  banner, open hours, legend and people, and can import the old Excel "Entries" CSV.
- Each month prints on one landscape Letter page and has a read-only link for members once it is published.

## Run it on your computer

1. Install [Node.js](https://nodejs.org) 20 or newer.
2. In a terminal:

   ```bash
   git clone https://github.com/USAMiroku/miroku-calendar.git
   cd miroku-calendar
   npm install
   npm run dev
   ```

3. Open http://localhost:3000. Without a database it runs in **demo mode** with sample Canada data
   (December 2026 has sample events).

Run the formatting tests with `npm test`.

## Connecting the database (Supabase, free)

1. Create a free account at [supabase.com](https://supabase.com) (ideally with a shared Miroku email) and a new project.
2. In the project, open **SQL Editor** and run, in this order:
   - the whole of `supabase/migrations/0001_schema.sql`
   - `supabase/seed.sql`, after replacing `CHANGE-ME@example.org` with the first admin's email.
     This loads the Canada groups, activities and calendars.
3. In **Project Settings → API**, copy the Project URL and the `anon` public key.
4. Copy `.env.example` to `.env.local` and paste them in. Restart `npm run dev`.
5. In **Authentication → URL Configuration**, set the Site URL to `http://localhost:3000`
   (later, your real web address) so the sign-in emails link back to the app.
6. Open the app, click **Editor sign-in**, and enter the admin email. You're in.

Supabase pauses free projects after about a week without use. Any visit wakes it again, and
the included GitHub Action (`.github/workflows/keep-awake.yml`) visits once a day so this doesn't happen.

## Putting it online (Vercel, free)

1. Sign in at [vercel.com](https://vercel.com) with the USAMiroku GitHub account and choose
   **Add New → Project → miroku-calendar**.
2. Add the environment variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `NEXT_PUBLIC_SITE_URL` (the address Vercel gives you, e.g. `https://miroku-calendar.vercel.app`). Deploy.
3. In Supabase **Authentication → URL Configuration**, set the Site URL to that address.
4. In GitHub **Settings → Secrets and variables → Actions**, add a variable `SITE_URL` with the same
   address so the daily keep-awake visit works.

Every change pushed to `main` goes online automatically.

## Giving volunteers access

An admin opens **People**, enters the volunteer's email and picks **Editor** or **Admin**.
The volunteer then clicks **Editor sign-in** and enters that email; no password is needed.
Members who only read the calendar need nothing: share the month's link after pressing **Publish**.

## Adding another organization or centre

- A new **centre calendar** (e.g. Toronto only): **Calendars → Add a calendar**, untick "All groups" and pick the groups.
- A new **organization** (e.g. Miroku Association USA): add a row in the Supabase `organizations` table,
  then add yourself as admin in `invitations` (or `memberships`). Its groups, activities and calendars
  are then managed from the app. Each calendar can use English, French, Portuguese or Spanish, one or two at a time.
