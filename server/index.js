import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import dotenv from "dotenv";

dotenv.config();

import connectDB from "./db.js";
// Import Mongoose models (we'll create these next)
import User from "./models/User.js";
import Song from "./models/Song.js";
import Favorite from "./models/Favorite.js";

const TOKEN_COOKIE = "session";
const TOKEN_TTL = "7d";

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());

// Connect to MongoDB
connectDB();

function validateSongPayload(payload) {
    const title = String(payload.title ?? "").trim();
    const artist = String(payload.artist ?? "").trim();
    const key = String(payload.key ?? "").trim();
    const capo = payload.capo;
    const chords = Array.isArray(payload.chords) ? payload.chords.map((item) => String(item).trim()).filter(Boolean) : [];
    const lyrics = String(payload.lyrics ?? "").trim();

    if (!title || !artist) {
        return { ok: false, error: "Title and artist are required" };
    }

    return {
        ok: true,
        value: {
            title,
            artist,
            key,
            capo,
            chords,
            lyrics
        }
    };
}


app.use((req, _res, next) => {
    const token = req.cookies[TOKEN_COOKIE];
    if (!token) {
        req.user = null;
        next();
        return;
    }

    try {
        req.user = jwt.verify(token, config.sessionSecret);
    } catch {
        req.user = null;
    }
    next();
});

// ====================== AUTH MIDDLEWARE ======================
const requireAuth = async (req, res, next) => {
    const token = req.cookies[TOKEN_COOKIE];

    if (!token) {
        return res.status(401).json({ error: "Authentication required" });
    }

    try {
        const decoded = jwt.verify(token, config.sessionSecret);
        req.user = decoded;           // { userId: "..." }
        next();
    } catch (error) {
        console.error("JWT verification failed:", error);
        res.clearCookie(TOKEN_COOKIE);
        return res.status(401).json({ error: "Invalid or expired session" });
    }
};

app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});

// ====================== AUTH ROUTES ======================

// Register
app.post("/api/auth/register", async (req, res) => {
    const { email, password, screenName } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = randomUUID();

        const user = await User.create({
            userId,
            email,
            password: hashedPassword,
            screenName: screenName || ""
        });

        const token = jwt.sign({ userId }, config.sessionSecret, { expiresIn: TOKEN_TTL });

        res.cookie(TOKEN_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            user: { userId, email, screenName: user.screenName }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Failed to register" });
    }
});

// Login
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.userId }, config.sessionSecret, { expiresIn: TOKEN_TTL });

        res.cookie(TOKEN_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            user: { userId: user.userId, email: user.email, screenName: user.screenName }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Failed to login" });
    }
});

// Get current user
app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.user.userId }).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// Logout
app.post("/api/auth/logout", (req, res) => {
    res.clearCookie(TOKEN_COOKIE);
    res.json({ message: "Logged out" });
});

// ====================== SONG ROUTES ======================

// Get all public songs
app.get("/api/songs", async (_req, res) => {
    try {
        const songs = await Song.find({ isPublic: true })
            .select("songId title artist key capo chords favorites updatedAt")
            .sort({ createdAt: -1 })
            .lean();

        res.json(songs);
    } catch (error) {
        console.error("Failed to fetch songs:", error);
        res.status(500).json({ error: "Failed to fetch songs" });
    }
});

// Get single song by songId
app.get("/api/songs/:songId", async (req, res) => {
    try {
        const song = await Song.findOne({ songId: req.params.songId }).lean();

        if (!song) {
            return res.status(404).json({ error: "Song not found" });
        }

        res.json(song);
    } catch (error) {
        console.error("Failed to fetch song:", error);
        res.status(500).json({ error: "Failed to fetch song" });
    }
});

// Get multiple songs by IDs (used by frontend)
app.post("/api/songList", async (req, res) => {
    try {
        const songIds = req.body.songIds || [];

        const songs = await Song.find({ songId: { $in: songIds } })
            .select("songId title artist key capo chords favorites createdAt")
            .lean();

        res.json(songs);
    } catch (error) {
        console.error("Failed to fetch song list:", error);
        res.status(500).json({ error: "Failed to fetch song list" });
    }
});

// CREATE new song
app.post("/api/songs", requireAuth, async (req, res) => {
    const parsed = validateSongPayload(req.body ?? {});
    if (!parsed.ok) {
        return res.status(400).json({ error: parsed.error });
    }

    try {
        const songId = await resolveUniqueSongId(parsed.value.title);

        const song = await Song.create({
            songId,
            ...parsed.value,
            ownerUserId: req.user.userId,   // Note: we'll change this to userId later if needed
            isPublic: true
        });

        res.status(201).json(song);
    } catch (error) {
        console.error("Failed to create song:", error);
        res.status(500).json({ error: "Failed to create song" });
    }
});

// UPDATE existing song
app.put("/api/songs/:songId", requireAuth, async (req, res) => {
    const parsed = validateSongPayload(req.body ?? {});
    if (!parsed.ok) {
        return res.status(400).json({ error: parsed.error });
    }

    try {
        const song = await Song.findOne({ songId: req.params.songId });

        if (!song) {
            return res.status(404).json({ error: "Song not found" });
        }

        if (song.ownerUserId !== req.user.userId) {
            return res.status(403).json({ error: "Only the song owner can edit this song" });
        }

        // Update the song
        Object.assign(song, parsed.value);
        await song.save();

        res.json(songDocToDetails(song.toObject(), req.user.userId));
    } catch (error) {
        console.error("Failed to update song:", error);
        res.status(500).json({ error: "Failed to update song" });
    }
});

// FORK existing song
app.post("/api/songs/:songId/fork", requireAuth, async (req, res) => {
    const parsed = validateSongPayload(req.body ?? {});
    if (!parsed.ok) {
        return res.status(400).json({ error: parsed.error });
    }

    try {
        const source = await Song.findOne({ songId: req.params.songId });

        if (!source) {
            return res.status(404).json({ error: "Source song not found" });
        }

        const songId = await resolveUniqueSongId(parsed.value.title);   // we'll update this function soon

        const forkedSong = await Song.create({
            songId,
            ...parsed.value,
            ownerUserId: req.user.userId,
            originalSongId: source.songId,
        });

        res.status(201).json(songDocToDetails(forkedSong.toObject(), req.user.userId));
    } catch (error) {
        console.error("Failed to fork song:", error);
        res.status(500).json({ error: "Failed to fork song" });
    }
});

// ====================== FAVORITES ROUTES ======================

// GET /api/favorites/top  — must be before /api/favorites/:songId
app.get("/api/favorites/top", async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    try {
        const topSongs = await Song.find({ isPublic: true })
            .sort({ favorites: -1, createdAt: -1 })
            .limit(limit)
            .select("songId title artist key capo chords favorites createdAt")
            .lean();

        res.json(topSongs);
    } catch (error) {
        console.error("Failed to fetch top favorites:", error);
        res.status(500).json({ error: "Failed to fetch top favorites" });
    }
});

// GET /api/favorites — return list of songIds the current user has favorited
app.get("/api/favorites", requireAuth, async (req, res) => {
    try {
        const favorites = await Favorite.find({ userId: req.user.userId })
            .select("songId -_id")
            .lean();
        res.json(favorites.map(f => f.songId));
    } catch (error) {
        console.error("Failed to fetch favorites:", error);
        res.status(500).json({ error: "Failed to fetch favorites" });
    }
});

// POST /api/favorites/:songId — add a favorite
app.post("/api/favorites/:songId", requireAuth, async (req, res) => {
    try {
        const { songId } = req.params;

        const song = await Song.findOne({ songId });
        if (!song) {
            return res.status(404).json({ error: "Song not found" });
        }

        await Favorite.create({ userId: req.user.userId, songId });

        // Increment the favorites count on the song
        await Song.updateOne({ songId }, { $inc: { favorites: 1 } });

        res.status(201).json({ songId, userId: req.user.userId });
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key — already favorited, treat as success
            return res.status(204).end();
        }
        console.error("Failed to add favorite:", error);
        res.status(500).json({ error: "Failed to add favorite" });
    }
});

// DELETE /api/favorites/:songId — remove a favorite
app.delete("/api/favorites/:songId", requireAuth, async (req, res) => {
    try {
        const { songId } = req.params;

        const deleted = await Favorite.findOneAndDelete({
            userId: req.user.userId,
            songId
        });

        if (deleted) {
            // Only decrement if a favorite was actually removed
            await Song.updateOne({ songId }, { $inc: { favorites: -1 } });
        }

        res.status(204).end();
    } catch (error) {
        console.error("Failed to remove favorite:", error);
        res.status(500).json({ error: "Failed to remove favorite" });
    }
});

const start = async () => {
    try {
        app.listen(config.port, () => {
            console.log(`✅ API running on http://localhost:${config.port}`);
        });
    } catch (error) {
        console.error("Failed to start API:", error);
        process.exit(1);
    }
};

// ====================== HELPER FUNCTIONS ======================

function slugify(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]+/g, "")
        .replace(/^-+|-+$/g, "");
}

// Convert Mongoose document to frontend-expected format
function songDocToDetails(song, currentUserId = null) {
    return {
        songId: song.songId,
        title: song.title,
        artist: song.artist,
        key: song.key,
        capo: song.capo,
        chords: song.chords || [],
        lyrics: song.lyrics || "",
        ownerUserId: song.ownerUserId,
        originalSongId: song.originalSongId,
        isPublic: song.isPublic,
        favorites: song.favorites || 0,
        createdAt: song.createdAt,
        updatedAt: song.updatedAt,     // New field from timestamps
        isOwner: currentUserId ? song.ownerUserId === currentUserId : false
    };
}

// Generate a unique songId (title-slug + random suffix if needed)
async function resolveUniqueSongId(title) {
    let baseSlug = slugify(title);

    let songId = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await Song.findOne({ songId });
        if (!existing) break;

        songId = `${baseSlug}-${counter}`;
        counter++;
    }

    return songId;
}

start();
