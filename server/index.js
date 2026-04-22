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
    const result = await db.find({
      selector: { songId: { $exists: true } },
      fields: ["songId", "title", "artist"],
      limit: 10000
    });
    const songs = result.docs
      .map((doc) => ({
        id: doc.songId,
        title: doc.title,
        artist: doc.artist
      }))
      .sort((a, b) => a.title.localeCompare(b.title));

    res.json(songs);
  } catch (error) {
    console.error("Failed to fetch songs:", error);
    res.status(500).json({ error: "Failed to fetch songs" });
  }
});

app.get("/api/songs/:songId", async (req, res) => {
  try {
    const db = songsDb();
    const songId = req.params.songId;
    const doc = await db.get(`song:${songId}`);

    res.json({
      id: doc.songId,
      title: doc.title,
      artist: doc.artist,
      key: doc.key,
      capo: doc.capo,
      chords: doc.chords ?? [],
      lyrics: doc.lyrics ?? []
    });
  } catch (error) {
    if (error.statusCode === 404) {
      res.status(404).json({ error: "Song not found" });
      return;
    }

    console.error("Failed to fetch song:", error);
    res.status(500).json({ error: "Failed to fetch song" });
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
