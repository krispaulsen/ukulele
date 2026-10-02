# Ukulele Songbook

A web app for managing and sharing ukulele songs. Supports member login, favorites, and owner-based song editing/forking.

## Tech Stack

- **Frontend:** React 19, React Router 7, Tailwind CSS, Vite
- **Backend:** Node.js, Express 5
- **Database:** MongoDB (via Mongoose)
- **Auth:** JWT stored in httpOnly cookies

## Project Structure

```
server/
  models/         # Mongoose models (User, Song, Favorite)
  routes/         # Express routers (auth, songs, favorites)
  index.js        # App entry point
  middleware.js   # attachUser, requireAuth
  utils.js        # Shared helpers
  db.js           # MongoDB connection
  config.js       # Environment config
src/              # React frontend
```

## Getting Started

### 1) Configure environment

Copy `.env.example` to `.env` and fill in your values:

```
cp .env.example .env
# On PowerShell: copy .env.example .env
```

Required vars:

- `MONGO_URI` — MongoDB connection string (e.g. `mongodb://localhost:27017/ukulele`)
- `SESSION_SECRET` — Secret used to sign JWT session cookies
- `API_PORT` — Port for the Express API (default: `5000`)
- `FRONTEND_URL` — Frontend origin for CORS (default: `http://localhost:5173`)

### Production deployment

| Piece | Host | Notes |
|-------|------|--------|
| Frontend | Vercel | `vercel.json` rewrites `/api/*` → `https://ukulele.onrender.com` and SPA routes to `index.html` |
| API | Render (`https://ukulele.onrender.com`) | Set `FRONTEND_URL` to the Vercel origin; prefer `NODE_ENV=production` |

**Do not set `VITE_API_URL` on Vercel** when using the rewrite. The browser should call same-origin `/api/...` so the session cookie stays first-party (`SameSite=Lax`).

If you ever point the frontend at the API host directly, set `CROSS_ORIGIN_COOKIES=true` on Render and `VITE_API_URL` on the frontend build.

### 2) Seed song documents

```
npm run seed:songs
```

### 3) Start app + API in dev mode

```
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:5000`

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Log in |
| GET | `/api/auth/me` | ✓ | Get current user |
| POST | `/api/auth/logout` | — | Log out |
| GET | `/api/songs` | — | List public songs (paginated + optional search). Query params: `?page=1&limit=20&q=term`. Also supports `?ownerUserId=xxx` (or `?owner=xxx`) to list songs by a user (only public unless you are that user) and `?mine=true` for the current user's songs (incl. private). Response: `{ items: [...], total, page, limit, totalPages }` (limit defaults to 10 server-side; max 100) |
| GET | `/api/songs/:slug` | — | Get a single song |
| POST | `/api/songs` | ✓ | Create a song |
| PUT | `/api/songs/:slug` | ✓ | Update a song (owner only) |
| POST | `/api/songs/:slug/fork` | ✓ | Fork a song |
| GET | `/api/favorites/top` | — | Top favorited songs |
| GET | `/api/favorites` | ✓ | Current user's favorites |
| POST | `/api/favorites/:slug` | ✓ | Add a favorite |
| DELETE | `/api/favorites/:slug` | ✓ | Remove a favorite |

## Task List

See [TASKS.md](./TASKS.md) for the current backlog of bugs, features, and improvements (including song deletion).

## Features

**Members (authenticated users)**
- Register/login with email + password
- Add songs
- Edit songs you own
- Fork songs from other users and edit your copy
- Favorite songs and view your favorites
- View a paginated list of all songs you own ("My Songs") on the My Songbook page
- View globally most-favorited songs

**Guests (unauthenticated users)**
- Browse all public songs
- View globally most-favorited songs
- Build ukulele tablature in the Tab Editor (`/tabs`) and copy markup into songs
- Use the Chromatic Tuner (`/tuner`) with microphone pitch detection or reference tones

**Tab Editor & Player**
- Visual grid to place frets on A/E/C/G strings
- Canonical markup: uppercase line labels (`A|` `E|` `C|` `G|`); frets `0`–`9`; frets 10–15 as lowercase `a`–`f`
- Export as `[| … |]` lyrics markup; insert from the song editor via modal
- Play tabs with Web Audio (playhead, tempo, loop) from the editor preview or a Play control on song lyrics

**Chromatic Tuner**
- Public practice tool at `/tuner` (header nav for guests and members)
- Microphone pitch detection: note name, cents deviation, color-coded meter
- Auto mode or lock to open G / C / E / A (standard re-entrant, A4 = 440 Hz)
- Sustained reference tones for each open string plus volume control
