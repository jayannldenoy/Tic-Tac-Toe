# TIC TAC TOE game

A responsive tic-tac-toe game generator. Players create a profile, save it, choose one of three game layouts, and share a direct link to their game.

## Run locally

```sh
npm install
npm run dev
```

Without Supabase credentials, the app uses local browser storage for a try-it-now demo. This mode is not online storage and is not shared between devices.

Run the game-rule checks with `npm test`.

## Enable online saves with Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com/).
2. Open the project's SQL editor and run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy the project URL and anon/public key from **Project Settings → API** into a local `.env` file (see [`.env.example`](.env.example)):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Restart the dev server. The header should show **Cloud connected**.

The schema enables public read/write policies so games can be played and managed without accounts. Do not put a Supabase service-role key in the browser. This is suitable for a classroom demo; use authenticated ownership policies and rate limiting before using it for sensitive or production data.

## Publish

Deploy this Vite project to Vercel or Netlify, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's environment-variable settings, and redeploy. Use Vercel's Vite preset or Netlify's build command `npm run build` and publish directory `dist`. Both platforms serve the Vite SPA fallback needed for shared game URLs.

## Game templates

- **Easy**: pixel-neon menu and classic cabinet board.
- **Medium**: green-accented dashboard menu and card-based board.
- **Hard**: tilted neon marquee and asymmetric game arena.

All three templates include the same playable game rules, settings, share link, and saved-player management.