# Ukulele Songbook

This app reads songs from CouchDB via a local API and supports member login, favorites, and owner-based song editing/forking.

## 1) Start CouchDB

Use Docker:

```bash
docker compose up -d
```

CouchDB will be available at `http://localhost:5984`.

## 2) Configure environment

Create a `.env` file from `.env.example` and adjust values if needed.
(On PowerShell you can run `copy .env.example .env`.)

Important vars:
- `SESSION_SECRET`: secret used to sign login cookies

## 3) Seed song documents

```bash
npm run seed:songs
```

## 4) Start app + API in dev mode

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001/api/songs`

## Member Features

- Register/Login with email + password
- Favorite songs and view your favorites
- View globally most-favorited songs
- Add songs
- Edit songs you own
- Fork songs from other users and edit your copy

## Guest (unauthenticated users) Features

- View songs
- View globally most-favorited songs
