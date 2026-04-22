# Ukulele Songbook

This app now reads songs from CouchDB via a small local API.

## 1) Start CouchDB

Use Docker:

```bash
docker compose up -d
```

CouchDB will be available at `http://localhost:5984`.

## 2) Configure environment

Create a `.env` file from `.env.example` and adjust values if needed.
(On PowerShell you can run `copy .env.example .env`.)

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
