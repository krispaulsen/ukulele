import { songs } from "../src/data/songs.js";
import { ensureDb, songsDb } from "./db.js";

async function seed() {
    await ensureDb();
    const db = songsDb();

    for (const song of songs) {
        const docId = `song:${song.id}`;
        const now = new Date().toISOString();

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
                type: "song",
                songId: song.id,
                title: song.title,
                artist: song.artist,
                key: song.key,
                capo: song.capo,
                chords: song.chords,
                lyrics: song.lyrics,
                ownerUserId: existing?.ownerUserId ?? null,
                originalSongId: existing?.originalSongId ?? null,
                created: existing?.created ?? now,
                modified: now
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
