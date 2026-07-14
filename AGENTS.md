# AGENTS.md

This file provides guidance for AI agents (and human developers) working on the Ukulele Songbook project.

## Project Overview

A full-stack web app for browsing, creating, editing, forking, and favoriting ukulele song sheets (with chord diagrams, lyrics, and optional tablature or YouTube embeds).

- **Authentication**: Email/password with JWT in httpOnly cookies.
- **Core entities**: Songs (with chords, lyrics markup, optional youtube, key/capo, isPublic), Users, Favorites.
- **Key flows**: Public browsing + authenticated song management + per-user favorites.

## Tech Stack

- **Frontend**: React 19, React Router 7, Vite, Tailwind CSS 4, `@material-tailwind/react`
- **Backend**: Node.js (ESM), Express 5, Mongoose + MongoDB
- **Auth**: `jsonwebtoken` + httpOnly cookies (`session`)
- **Other**: `bcryptjs`, `clsx`, `cookie-parser`, `cors`

No tests or linter configured yet (see TASKS.md).

## Getting Started

### Environment

```bash
cp .env.example .env   # or copy on Windows
```

Required variables (see `.env.example`):

- `MONGO_URI`
- `SESSION_SECRET`
- `API_PORT` (default 5000)
- `FRONTEND_URL` (default [http://localhost:5173](http://localhost:5173))
- Seed user vars for `npm run seed:songs`

### Common Commands

```bash
npm run dev          # Starts both client (Vite :5173) and server (nodemon :5000) concurrently
npm run dev:client
npm run dev:server
npm run build
npm run preview
npm run seed:songs   # Seeds from src/data/songs.js (uses SEED_* env vars)
```

**Important**: Vite dev server proxies `/api/`* → `http://localhost:5000` (see `vite.config.js`).

## Project Structure

```
server/
  models/          # Mongoose models (User, Song, Favorite)
  routes/          # auth.js, songs.js, favorites.js, users.js
  index.js         # Express app + middleware
  middleware.js    # attachUser (always), requireAuth (protected)
  utils.js         # slugify, extractYouTubeId, validateSongPayload, formatSong, songDocToDetails, resolveUniqueSongSlug
  db.js            # Mongo connect
  config.js
  seedSongs.js

src/
  components/      # Reusable UI (SongList, Lyrics, UkuleleChordDiagram, YouTubeEmbed, Forms, ui/*)
  pages/           # Route pages (SearchPage, SongPage, SongEditorPage, FavoritesPage, ...)
  context/         # UserContext (auth + favorites Set + login/logout + toggle + hydrate)
  lib/api.js       # apiRequest wrapper (credentials: 'include', no-cache, 204/304 → null)
  data/            # seed songs + chordShapes
  ...
```

## Development Guidelines

### Code Style & Conventions

- Use modern ESM (`type: "module"`).
- Prefer `String(value ?? "")`, `.trim()`, safe defaults.
- Always normalize owner data:
  - Use `formatSong(song, currentUserId)` for list/detail responses.
  - Use `songDocToDetails(song, currentUserId)` for create/update/fork responses.
  - `ownerUserId` should be a **plain string**.
  - `screenName` at top level.
  - `isOwner` boolean when `currentUserId` provided.
- Stringify IDs for comparisons: `String(req.user.userId)`, `ownerId === String(currentUserId)`.
- Backend queries: prefer `.lean()`, `.populate('ownerUserId', 'screenName')` when needed.
- Error handling: `console.error(...)`; `res.status(500).json({ error: "..." })`.
- Frontend: React 19 `use(Context)` (not `useContext`), functional components, Tailwind + Material Tailwind mix.
- Context updates: prefer functional `setUser(prev => ...)` and `setFavorites(new Set(...))` to avoid stale closures.
- Lyrics markup (parsed in `Lyrics.jsx`):
  - `[Chord]` for chords.
  - `[(Comment)]` for comments.
  - `[| ... |]` for tablature blocks (4 strings: A/E/C/G order).

### Auth & Authorization

- `attachUser` middleware runs on **every** request (sets `req.user = null` or decoded JWT).
- `requireAuth` for protected routes (returns 401 + clears cookie if missing).
- `req.user.userId` (string) after verify.
- Frontend: call `/api/auth/me` (or login/register) to hydrate; `user.isLoggedIn`, `user.userId`, `user.favorites` (Set).
- Owner checks: prefer `song.isOwner` (provided by `formatSong`/`songDocToDetails`) over raw `user.userId === song.ownerUserId`.

### Favorites

- Stored per-user in `Favorite` collection (unique on `{userId, slug}`).
- Client state: `Set<string>` of slugs (in `UserContext`).
- Toggle flow: optimistic local update + API call + background `refreshFavorites()`.
- `GET /api/favorites` returns array of slugs.
- `POST/DELETE /api/favorites/:slug` for add/remove (204 on no-op/duplicate).
- Server increments/decrements `Song.favorites` count.
- All `/api/favorites` endpoints (`GET /`, `POST /:slug`, `DELETE /:slug`) set `Cache-Control: private, no-cache, no-store, must-revalidate` (plus `Pragma`, `Expires`, and ETag/Last-Modified removal) to prevent caching/304s. The client sends matching directives on all requests.

### Song Data

- Always pass `currentUserId` (string or null) to `formatSong`/`songDocToDetails`.
- Public songs only appear in lists; individual `/songs/:slug` may return private ones (for owners/direct links).
- `validateSongPayload` + `extractYouTubeId` on input.
- `resolveUniqueSongSlug` on create/fork.
- Chord list is derived client-side in `SongEditorPage` from `[...]` in lyrics (simple regex).

### API Client

- Always use `apiRequest(path, options)` from `src/lib/api.js`.
- `credentials: "include"` + cache-control headers (client always requests no-cache).
- Returns `null` for 204 responses.
- Throws on non-2xx (with message from `error` field when possible).

## Gotchas & Common Pitfalls

- **Stale closures**: `favorites` and `user` state in `UserContext`. Always use functional setters (`prev =>`) rather than spreading the closed-over `user`/`favorites` values.
- **ID types**: JWT payloads contain string IDs; Mongoose documents use `ObjectId`. Always coerce with `String()` when comparing (e.g. ownership checks).
- **Favorites**: The endpoint is per-user and mutable. The `GET /`, `POST /:slug`, and `DELETE /:slug` responses all set `Cache-Control: private, no-cache, no-store, must-revalidate` (plus related headers) to prevent client caching. The client sends matching no-cache directives on requests.
- **Login state**: The app does not automatically restore auth on page load without the mount-time hydrate effect (which calls `/api/auth/me`).
- **Song responses**: Always go through `formatSong(...)` or `songDocToDetails(...)` so that `ownerUserId` is a string, `screenName` is top-level, and `isOwner` is present when appropriate.
- **SongEditor**: Currently mostly a stub. Real mutations of the `lyrics` string (remove line, add chord, add tab block, etc.) are still TODO items.
- **Commented-out code**: Significant amounts of commented key/capo, `originalSlug`, and old form controls remain. See TASKS.md.
- **No tests or lint**: There is currently no `test` or `lint` script (noted in TASKS.md).
- **Seed data**: `npm run seed:songs` uses the `SEED_*` variables and upserts by slug.
- **Dev proxy**: Vite proxies `/api/*` to the Express server on port 5000. Use paths starting with `/api`.

## Common Tasks

### Add a protected API route

```js
import { requireAuth } from "../middleware.js";
// ...
router.post("/something", requireAuth, async (req, res) => {
  const userId = String(req.user.userId);
  // ...
});
```

### Normalize a song response

```js
import { formatSong } from "../utils.js";
// ...
const currentUserId = req.user?.userId ? String(req.user.userId) : null;
res.json(formatSong(songDoc, currentUserId));
```

### Toggle a favorite (frontend)

Use the `toggleFavorite` from `UserContext`. Prefer it over calling the API directly so optimistic state + refresh stay in sync.

### Add a new UI component

- Place reusable pieces in `src/components/ui/` when appropriate.
- Use Tailwind classes.
- Export from `ui/index.jsx` if commonly imported together.

## Tasks & Process

- See [TASKS.md](./TASKS.md) for current backlog.
- High-priority items have detailed Backend / Frontend / Other breakdowns.
- Update `README.md` API table and Features section when adding endpoints or major features.
- Prefer focused changes and clear descriptions.
- When a change touches owner data, song responses, or auth, double-check `formatSong`, `songDocToDetails`, and ID stringification.

## Environment Notes

- Dev: Vite on 5173 proxies `/api` to Express on 5000.
- Production: Set `NODE_ENV=production`, proper `SESSION_SECRET`, secure cookies, etc.
- **Deploy**: Frontend on Vercel (`vercel.json` rewrites `/api/*` → Render API + SPA fallback). API on Render. Leave `VITE_API_URL` unset so auth cookies are same-site. Only set `CROSS_ORIGIN_COOKIES=true` on the API if the browser calls the API host directly.
- The project previously had CouchDB code (now commented out in `db.js`); current is Mongo + Mongoose.

