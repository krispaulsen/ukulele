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
| GET | `/api/songs` | — | List all public songs |
| GET | `/api/songs/:songId` | — | Get a single song |
| POST | `/api/songs` | ✓ | Create a song |
| PUT | `/api/songs/:songId` | ✓ | Update a song (owner only) |
| POST | `/api/songs/:songId/fork` | ✓ | Fork a song |
| GET | `/api/favorites/top` | — | Top favorited songs |
| GET | `/api/favorites` | ✓ | Current user's favorites |
| POST | `/api/favorites/:songId` | ✓ | Add a favorite |
| DELETE | `/api/favorites/:songId` | ✓ | Remove a favorite |

## Features

**Members (authenticated users)**
- Register/login with email + password
- Add songs
- Edit songs you own
- Fork songs from other users and edit your copy
- Favorite songs and view your favorites
- View globally most-favorited songs

**Guests (unauthenticated users)**
- Browse all public songs
- View globally most-favorited songs
