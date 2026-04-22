import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { ensureDb, songsDb } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/songs", async (_req, res) => {
  try {
    const db = songsDb();
    const result = await db.list({ include_docs: true });
    const songs = result.rows
      .map((row) => row.doc)
      .filter(Boolean)
      .map((doc) => ({
        id: doc.songId,
        title: doc.title,
        artist: doc.artist,
        key: doc.key,
        capo: doc.capo,
        chords: doc.chords ?? [],
        lyrics: doc.lyrics ?? []
      }))
      .sort((a, b) => a.title.localeCompare(b.title));

    res.json(songs);
  } catch (error) {
    console.error("Failed to fetch songs:", error);
    res.status(500).json({ error: "Failed to fetch songs" });
  }
});

const start = async () => {
  try {
    await ensureDb();
    app.listen(config.port, () => {
      console.log(`API running on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start API:", error);
    process.exit(1);
  }
};

start();
