import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { config } from "./config.js";

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

function normalizeEmail(email) {
    return String(email ?? "").trim().toLowerCase();
}

function slugify(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]+/g, "")
        .replace(/^-+|-+$/g, "");
}

function validateSongPayload(payload) {
    const title = String(payload.title ?? "").trim();
    const artist = String(payload.artist ?? "").trim();
    const key = String(payload.key ?? "").trim();
    const capo = payload.capo;
    const chords = Array.isArray(payload.chords) ? payload.chords.map((item) => String(item).trim()).filter(Boolean) : [];
    const lyrics =  String(payload.lyrics ?? "").trim();

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

function songDocToDetails(doc, currentUserId) {
    const isOwner = Boolean(currentUserId && doc.ownerUserId && doc.ownerUserId === currentUserId);
    return {
        id: doc.songId,
        title: doc.title,
        artist: doc.artist,
        key: doc.key,
        capo: doc.capo,
        chords: doc.chords ?? [],
        lyrics: doc.lyrics ?? '',
        ownerUserId: doc.ownerUserId ?? null,
        originalSongId: doc.originalSongId ?? null,
        canEdit: isOwner
    };
}

function signSession(user) {
    return jwt.sign(
        {
            userId: user.userId,
            email: user.email
        },
        config.sessionSecret,
        { expiresIn: TOKEN_TTL }
    );
}

function setSessionCookie(res, token) {
    res.cookie(TOKEN_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
}

function clearSessionCookie(res) {
    res.clearCookie(TOKEN_COOKIE);
}

async function enrichSongs(db, result) {
    // console.log(result);

    // get all ownerUserIds from the selected songs
    const userIds = [...new Set(result?.docs?.flatMap(doc => {
        return doc.ownerUserId ? ['user:' + doc.ownerUserId] : [];
    }))];
    // userIds == ["user:123", "user:456"]

    // get users from userIds
    // const userDocsResult = await db.fetch({ keys: userIds });
    const userDocsResult = await db.find({
        selector: {
            _id: {
                "$in": userIds
            }
        },
        fields: ["userId", "screenName", "email"]
    });
    // userDocsResult == { docs: [ { userId: '123', screenName: 'Test', email: 'test@test.com' }, { ... } ] }

    // get screenNames from users
    const screenNameMap = {};
    userDocsResult.docs.forEach(user => {
        screenNameMap[user.userId] = user.screenName;
    });
    // screenNameMap == { '123': 'Test', '456': 'Foo' }

    const songs = result.docs
        .map(doc => {
            return {
                id: doc.songId,
                title: doc.title || '',
                artist: doc.artist || '',
                chords: doc.chords.join(', ') || '',
                submitter: screenNameMap[doc.ownerUserId] ?? '',
                userId: doc.ownerUserId,
                modified: doc.modified,
            }
        })
        .sort((a, b) => a.title.localeCompare(b.title));

    return songs;
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

function requireAuth(req, res, next) {
    if (!req.user?.userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    next();
}

async function resolveUniqueSongId(db, title) {
    const base = slugify(title) || "song";
    for (let i = 0; i < 10; i += 1) {
        const suffix = i === 0 ? "" : `-${Math.random().toString(36).slice(2, 6)}`;
        const candidate = `${base}${suffix}`;
        try {
            await db.get(`song:${candidate}`);
        } catch (error) {
            if (error.statusCode === 404) {
                return candidate;
            }
            throw error;
        }
    }
    return `${base}-${randomUUID().slice(0, 8)}`;
}

app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
    if (!req.user?.userId) {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }

    res.json({
        userId: req.user.userId,
        email: req.user.email
    });
});

app.post("/api/auth/register", async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? "");
    const screenName = String(req.body?.screenName ?? "Rockstar");

    if (!email.includes("@")) {
        res.status(400).json({ error: "A valid email is required" });
        return;
    }

    if (password.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters" });
        return;
    }

    try {
        const db = songsDb();
        const existing = await db.find({
            selector: { type: "user", email: email },
            fields: ["_id"],
            limit: 1
        });
        if (existing.docs.length > 0) {
            res.status(409).json({ error: "An account with that email already exists" });
            return;
        }

        const userId = randomUUID();
        const passwordHash = await bcrypt.hash(password, 10);
        const now = new Date().toISOString();
        await db.insert({
            _id: `user:${userId}`,
            type: "user",
            userId,
            screenName,
            email,
            passwordHash,
            created: now,
            lastLogin: now,
        });

        const token = signSession({ userId, email });
        setSessionCookie(res, token);
        res.status(201).json({ userId, email, screenName, lastLogin: now, favorites: [] });
    } catch (error) {
        console.error("Failed to register:", error);
        res.status(500).json({ error: "Failed to register" });
    }
});

app.post("/api/auth/login", async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? "");

    try {
        const db = songsDb();
        const users = await db.find({
            selector: { type: "user", email: email },
            limit: 1
        });
        const user = users.docs[0];
        if (!user) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }

        const token = signSession({ userId: user.userId, email: user.email });
        setSessionCookie(res, token);

        // set last login
        const now = new Date().toISOString();
        db.insert({
            ...user,
            lastLogin: now
        });

        res.json({
            userId: user.userId,
            email: user.email,
            screenName: user.screenName,
            lastLogin: user.lastLogin,
        });
    } catch (error) {
        console.error("Failed to login:", error);
        res.status(500).json({ error: "Failed to login" });
    }
});

app.post("/api/auth/logout", (_req, res) => {
    clearSessionCookie(res);
    res.status(204).end();
});

app.get("/api/songs", async (_req, res) => {
    try {
        const db = songsDb();

        // select all songs
        const result = await db.find({
            // selector: { songId: { $exists: true } },
            selector: { type: 'song' },
            fields: ["songId", "title", "artist", "chords", "ownerUserId", "modified"],
            limit: 100
        });

        const songs = await enrichSongs(db, result);

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
        res.json(songDocToDetails(doc, req.user?.userId));
    } catch (error) {
        if (error.statusCode === 404) {
            res.status(404).json({ error: "Song not found" });
            return;
        }

        console.error("Failed to fetch song:", error);
        res.status(500).json({ error: "Failed to fetch song" });
    }
});

app.post("/api/songList", async (req, res) => {
    try {
        const db = songsDb();
        const songIds = req.body.songIds;
        const ids = songIds.map(id => `song:${id}`) || [];
        // const result = await db.fetch({ keys: ids });
        const result = await db.find({
            selector: {
                _id: {
                    "$in": ids
                }
            },
            fields: ["songId", "title", "artist", "chords", "ownerUserId", "modified"],
            limit: 100
        });

        const songs = await enrichSongs(db, result);

        res.json(songs);
        // res.json(result.rows.map(row => row.doc));
    } catch (error) {
        console.error("Failed to fetch song list:", error);
        res.status(500).json({ error: "Failed to fetch song list" });
    }
});

// SAVE A NEW SONG
app.post("/api/songs", requireAuth, async (req, res) => {
    const parsed = validateSongPayload(req.body ?? {});
    if (!parsed.ok) {
        res.status(400).json({ error: parsed.error });
        return;
    }

    try {
        const db = songsDb();
        const songId = await resolveUniqueSongId(db, parsed.value.title);
        const now = new Date().toISOString();
        const doc = {
            _id: `song:${songId}`,
            type: "song",
            songId,
            ...parsed.value,
            ownerUserId: req.user.userId,
            originalSongId: null,
            created: now,
            modified: now
        };
        await db.insert(doc);
        res.status(201).json(songDocToDetails(doc, req.user.userId));
    } catch (error) {
        console.error("Failed to create song:", error);
        res.status(500).json({ error: "Failed to create song" });
    }
});

// UPDATE AN EXISTING SONG
app.put("/api/songs/:songId", requireAuth, async (req, res) => {
    const parsed = validateSongPayload(req.body ?? {});
    if (!parsed.ok) {
        res.status(400).json({ error: parsed.error });
        return;
    }

    try {
        const db = songsDb();
        const doc = await db.get(`song:${req.params.songId}`);
        if (!doc.ownerUserId || doc.ownerUserId !== req.user.userId) {
            res.status(403).json({ error: "Only the song owner can edit this song" });
            return;
        }

        const updated = {
            ...doc,
            ...parsed.value,
            modified: new Date().toISOString()
        };
        await db.insert(updated);
        res.json(songDocToDetails(updated, req.user.userId));
    } catch (error) {
        if (error.statusCode === 404) {
            res.status(404).json({ error: "Song not found" });
            return;
        }
        console.error("Failed to update song:", error);
        res.status(500).json({ error: "Failed to update song" });
    }
});

app.post("/api/songs/:songId/fork", requireAuth, async (req, res) => {
    const parsed = validateSongPayload(req.body ?? {});
    if (!parsed.ok) {
        res.status(400).json({ error: parsed.error });
        return;
    }

    try {
        const db = songsDb();
        const source = await db.get(`song:${req.params.songId}`);
        const now = new Date().toISOString();
        const songId = await resolveUniqueSongId(db, parsed.value.title);
        const copy = {
            _id: `song:${songId}`,
            type: "song",
            songId,
            ...parsed.value,
            ownerUserId: req.user.userId,
            originalSongId: source.songId,
            created: now,
            modified: now
        };
        await db.insert(copy);
        res.status(201).json(songDocToDetails(copy, req.user.userId));
    } catch (error) {
        if (error.statusCode === 404) {
            res.status(404).json({ error: "Source song not found" });
            return;
        }
        console.error("Failed to fork song:", error);
        res.status(500).json({ error: "Failed to fork song" });
    }
});

app.get("/api/favorites", requireAuth, async (req, res) => {
    try {
        const db = songsDb();
        const result = await db.find({
            selector: { type: "favorite", userId: req.user.userId },
            fields: ["songId"],
            limit: 100
        });
        res.json([...result.docs.map((doc) => doc.songId)]);
    } catch (error) {
        console.error("Failed to fetch favorites:", error);
        res.status(500).json({ error: "Failed to fetch favorites" });
    }
});

app.post("/api/favorites/:songId", requireAuth, async (req, res) => {
    try {
        const db = songsDb();
        const songId = req.params.songId;
        await db.get(`song:${songId}`);

        const docId = `favorite:${req.user.userId}:${songId}`;
        try {
            await db.get(docId);
            res.status(204).end();
            return;
        } catch (error) {
            if (error.statusCode !== 404) {
                throw error;
            }
        }

        await db.insert({
            _id: docId,
            type: "favorite",
            userId: req.user.userId,
            songId,
            created: new Date().toISOString()
        });
        res.status(201).json({ songId, userId: req.user.userId });
    } catch (error) {
        if (error.statusCode === 404) {
            res.status(404).json({ error: "Song not found" });
            return;
        }
        console.error("Failed to add favorite:", error);
        res.status(500).json({ error: "Failed to add favorite" });
    }
});

app.delete("/api/favorites/:songId", requireAuth, async (req, res) => {
    try {
        const db = songsDb();
        const docId = `favorite:${req.user.userId}:${req.params.songId}`;
        const doc = await db.get(docId);
        await db.destroy(doc._id, doc._rev);
        res.status(204).end();
    } catch (error) {
        if (error.statusCode === 404) {
            res.status(204).end();
            return;
        }
        console.error("Failed to remove favorite:", error);
        res.status(500).json({ error: "Failed to remove favorite" });
    }
});

app.get("/api/favorites/top", async (req, res) => {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit ?? 20)));

    try {
        const db = songsDb();
        const favs = await db.find({
            selector: { type: "favorite" },
            fields: ["songId"],
            limit: 20000
        });

        const counts = new Map();
        for (const doc of favs.docs) {
            counts.set(doc.songId, (counts.get(doc.songId) ?? 0) + 1);
        }

        const ranked = [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);

        if (ranked.length === 0) {
            res.json([]);
            return;
        }

        const docs = await db.fetch({ keys: ranked.map(([songId]) => `song:${songId}`) });
        const byId = new Map(
            docs.rows
                .filter((row) => row.doc)
                .map((row) => [row.doc.songId, row.doc])
        );

        const result = ranked
            .map(([songId, favoriteCount]) => {
                const song = byId.get(songId);
                if (!song) return null;
                return {
                    songId,
                    title: song.title,
                    artist: song.artist,
                    favoriteCount
                };
            })
            .filter(Boolean);

        res.json(result);
    } catch (error) {
        console.error("Failed to fetch top favorites:", error);
        res.status(500).json({ error: "Failed to fetch top favorites" });
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
