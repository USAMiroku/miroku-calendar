# Miroku Activities Calendar

A simple web app for making the monthly activities calendar of Miroku organizations and centres
(Miroku Association Canada, Miroku Association USA, ...), in one or two languages
(English, French, Portuguese, Spanish).

Status: work in progress. The calendar page, print layout and formatting rules are done;
sign-in, the entry form, admin lists and CSV import are being built.

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

## Connecting the database (Supabase)

Instructions will be added with the editor features. The schema is in `supabase/migrations/`.
