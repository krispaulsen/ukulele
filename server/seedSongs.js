import { songs } from "../src/data/songs.js";
import { ensureDb, songsDb } from "./db.js";

async function seed() {
  await ensureDb();
  const db = songsDb();

  for (const song of songs) {
    const docId = `song:${song.id}`;

    let existing;
    try {
      existing = await db.get(docId);
    } catch (error) {
      if (error.statusCode !== 404) {
        throw error;
      }
    }

    await db.insert(
      {
        _id: docId,
        _rev: existing?._rev,
        songId: song.id,
        title: song.title,
        artist: song.artist,
        key: song.key,
        capo: song.capo,
        chords: song.chords,
        lyrics: song.lyrics
      },
      docId
    );
  }

  console.log(`Seeded ${songs.length} songs into CouchDB.`);
}

seed().catch((error) => {
  console.error("Failed to seed songs:", error);
  process.exit(1);
});
