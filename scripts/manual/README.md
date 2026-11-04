# Manual PDFs and video

The manual is `docs/user-manual.md` (English) and `docs/user-manual.pt.md` (Portuguese). The app shows them at `/help`.
After changing them, rebuild the PDFs and videos in `public/manual/`:

1. Run the app in demo mode (no `.env.local`): `npm run build && npx next start -p 3123`
2. PDFs: `node scripts/manual/make-pdfs.cjs`
3. Videos (captioned walkthrough, about 2½ minutes each):
   ```bash
   node scripts/manual/record-video.cjs en && node scripts/manual/record-video.cjs pt
   for l in en pt; do ffmpeg -y -i scripts/manual/raw-$l/*.webm -c:v libx264 -pix_fmt yuv420p -crf 23 -movflags +faststart public/manual/miroku-calendar-video-$l.mp4; done
   rm -rf scripts/manual/raw-*
   ```
