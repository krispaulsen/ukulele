import { Router } from "express";
import Song from "../models/Song.js";
import { validateSongPayload, resolveUniqueSongSlug, formatSong, getSongListFilter } from "../utils.js";
import { requireAuth } from "../middleware.js";

const router = Router();

// Get songs (supports pagination + optional search).
// By default returns only public songs.
// ?ownerUserId=xxx or ?owner=xxx limits to a specific owner (public only unless you are that owner).
// ?mine=true returns all songs owned by the authenticated caller (public + private).
router.get("/", async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const q = String(req.query.q || "").trim();

        const ownerParam = req.query.ownerUserId || req.query.owner;
        const mineParam = req.query.mine;

        // Early auth check for explicit "mine" requests
        const mineFlag = String(mineParam || "").trim().toLowerCase();
        const isMineRequest = mineFlag === "1" || mineFlag === "true" || mineFlag === "yes";
        if (isMineRequest && !req.user?.userId) {
            return res.status(401).json({ error: "Authentication required to view your songs" });
        }

        const filter = getSongListFilter(
            { q, ownerUserId: ownerParam, mine: mineParam },
            req.user
        );

        const total = await Song.countDocuments(filter);

        const songs = await Song.find(filter)
            .populate('ownerUserId', 'screenName')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const currentUserId = req.user?.userId ? String(req.user.userId) : null;
        const items = songs.map(s => formatSong(s, currentUserId));

        res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 });
    } catch (error) {
        console.error("Failed to fetch songs:", error);
        res.status(500).json({ error: "Failed to fetch songs" });
    }
});

// GET /api/songs/:slug — Get single song by slug
router.get("/:slug", async (req, res) => {
    try {
        const song = await Song.findOne({ slug: req.params.slug })
            .select("slug _id title artist key capo notes chords lyrics youtube favorites createdAt updatedAt ownerUserId isPublic")
            .populate('ownerUserId', 'screenName')
            .lean();

        if (!song) {
            return res.status(404).json({ error: "Song not found" });
        }

        const currentUserId = req.user?.userId ? String(req.user.userId) : null;
        res.json(formatSong(song, currentUserId));
    } catch (error) {
        console.error("Failed to fetch song:", error);
        res.status(500).json({ error: "Failed to fetch song" });
    }
});

// Get multiple songs from list of song slugs
router.post("/list", async (req, res) => {
    try {
        const slugs = req.body.slugs || [];

        const songs = await Song.find({ slug: { $in: slugs } })
            // .select("slug title artist key capo chords favorites createdAt")
            .populate('ownerUserId', 'screenName')
            .lean();

        const currentUserId = req.user?.userId ? String(req.user.userId) : null;
        res.json(songs.map(s => formatSong(s, currentUserId)));
    } catch (error) {
        console.error("Failed to fetch song list:", error);
        res.status(500).json({ error: "Failed to fetch song list" });
    }
});

// CREATE new song
router.post("/", requireAuth, async (req, res) => {
    const parsed = validateSongPayload(req.body ?? {});
    if (!parsed.ok) {
        return res.status(400).json({ error: parsed.error });
    }

    try {
        const slug = await resolveUniqueSongSlug(parsed.value.title);

        const created = await Song.create({
            slug,
            ...parsed.value,
            ownerUserId: req.user.userId,
            isPublic: true
        });

        // Populate to get screenName for consistent response shape
        const createdPopulated = await Song.findById(created._id)
            .populate('ownerUserId', 'screenName')
            .lean();
        const currentUserId = req.user?.userId ? String(req.user.userId) : null;
        res.status(201).json(formatSong(createdPopulated, currentUserId));
    } catch (error) {
        console.error("Failed to create song:", error);
        res.status(500).json({ error: "Failed to create song" });
    }
});

// UPDATE existing song
router.put("/:slug", requireAuth, async (req, res) => {
    const parsed = validateSongPayload(req.body ?? {});
    if (!parsed.ok) {
        return res.status(400).json({ error: parsed.error });
    }

    try {
        const song = await Song.findOne({ slug: req.params.slug });

        if (!song) {
            return res.status(404).json({ error: "Song not found" });
        }

        if (song.ownerUserId.toString() !== req.user.userId) {
            return res.status(403).json({ error: "Only the song owner can edit this song" });
        }

        Object.assign(song, parsed.value);
        await song.save();

        const updatedPopulated = await Song.findById(song._id)
            .populate('ownerUserId', 'screenName')
            .lean();
        const currentUserId = req.user?.userId ? String(req.user.userId) : null;
        res.json(formatSong(updatedPopulated, currentUserId));
    } catch (error) {
        console.error("Failed to update song:", error);
        res.status(500).json({ error: "Failed to update song" });
    }
});

// FORK existing song
router.post("/:slug/fork", requireAuth, async (req, res) => {
    const parsed = validateSongPayload(req.body ?? {});
    if (!parsed.ok) {
        return res.status(400).json({ error: parsed.error });
    }

    try {
        const source = await Song.findOne({ slug: req.params.slug });

        if (!source) {
            return res.status(404).json({ error: "Source song not found" });
        }

        const slug = await resolveUniqueSongSlug(parsed.value.title);

        const forkedSong = await Song.create({
            slug,
            ...parsed.value,
            ownerUserId: req.user.userId,
            originalSlug: source.slug,
        });

        const forkedPopulated = await Song.findById(forkedSong._id)
            .populate('ownerUserId', 'screenName')
            .lean();
        const currentUserId = req.user?.userId ? String(req.user.userId) : null;
        res.status(201).json(formatSong(forkedPopulated, currentUserId));
    } catch (error) {
        console.error("Failed to fork song:", error);
        res.status(500).json({ error: "Failed to fork song" });
    }
});

export default router;
