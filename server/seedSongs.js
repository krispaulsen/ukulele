import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { songs } from "../src/data/songs.js";
import Song from "./models/Song.js";
import User from "./models/User.js";

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Create seed user if they don't already exist
    const hashedPassword = await bcrypt.hash(process.env.SEED_USER_PASSWORD, 10);
    const seedUser = await User.findOneAndUpdate(
        { email: process.env.SEED_USER_EMAIL },
        {
            $setOnInsert: {
                email: process.env.SEED_USER_EMAIL,
                password: hashedPassword,
                screenName: 'SeedUser'
            }
        },
        { upsert: true, new: true }
    );

    for (const song of songs) {
        await Song.findOneAndUpdate(
            { slug: song.slug },
            {
                $set: {
                    title: song.title,
                    artist: song.artist,
                    key: song.key,
                    capo: song.capo,
                    chords: song.chords,
                    lyrics: song.lyrics,
                    isPublic: true,
                },
                $setOnInsert: {
                    slug: song.slug,
                    ownerUserId: seedUser._id,
                }
            },
            { upsert: true, new: true }
        );
    }

    console.log(`✅ Seeded ${songs.length} songs into MongoDB.`);
    await mongoose.disconnect();
}

seed().catch((error) => {
    console.error("❌ Failed to seed songs:", error);
    process.exit(1);
});
