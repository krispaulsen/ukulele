import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Song from "./models/Song.js";
import { lyricsHasTabs } from "./utils.js";

/**
 * One-time backfill: set hasTabs on every song from its lyrics.
 * Usage: node ./server/backfillHasTabs.js
 */
async function backfill() {
    if (!process.env.MONGO_URI) {
        console.error("❌ MONGO_URI is not set");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const songs = await Song.find({}).select("slug lyrics hasTabs").lean();
    console.log(`Found ${songs.length} song(s)`);

    let updated = 0;
    let alreadyCorrect = 0;
    let withTabs = 0;

    for (const song of songs) {
        const next = lyricsHasTabs(song.lyrics);
        if (next) withTabs += 1;

        if (song.hasTabs === next) {
            alreadyCorrect += 1;
            continue;
        }

        await Song.updateOne({ _id: song._id }, { $set: { hasTabs: next } });
        updated += 1;
        console.log(`  updated ${song.slug}: hasTabs=${next}`);
    }

    console.log(
        `✅ Done. total=${songs.length} updated=${updated} unchanged=${alreadyCorrect} withTabs=${withTabs}`
    );
    await mongoose.disconnect();
}

backfill().catch((error) => {
    console.error("❌ Backfill failed:", error);
    process.exit(1);
});
