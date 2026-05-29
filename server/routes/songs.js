import { Router } from "express";
import Song from "../models/Song.js";
import { validateSongPayload, resolveUniqueSongSlug, songDocToDetails } from "../utils.js";
import { requireAuth } from "../middleware.js";

const router = Router();

// Get all public songs
router.get("/", async (_req, res) => {
    try {
        const songs = await Song.find({ isPublic: true })
            // .select("slug title artist chords favorites updatedAt ownerUserId")
            .populate('ownerUserId', 'screenName')
            .sort({ createdAt: -1 })
            .lean();

        res.json(songs);
    } catch (error) {
        console.error("Failed to fetch songs:", error);
        res.status(500).json({ error: "Failed to fetch songs" });
    }
});

// GET /api/songs/:slug — Get single song by slug
router.get("/:slug", async (req, res) => {
    try {
        const song = await Song.findOne({ slug: req.params.slug })
            .select("slug _id title artist key capo chords lyrics favorites createdAt updatedAt ownerUserId isPublic")
            .lean();

        if (!song) {
            return res.status(404).json({ error: "Song not found" });
        }

        res.json(song);
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

        res.json(songs);
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

        const song = await Song.create({
            slug,
            ...parsed.value,
            ownerUserId: req.user.userId,
            isPublic: true
        });

        res.status(201).json(song);
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

        if (song.ownerUserId !== req.user.userId) {
            return res.status(403).json({ error: "Only the song owner can edit this song" });
        }

        Object.assign(song, parsed.value);
        await song.save();

        res.json(songDocToDetails(song.toObject(), req.user.userId));
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

        res.status(201).json(songDocToDetails(forkedSong.toObject(), req.user.userId));
    } catch (error) {
        console.error("Failed to fork song:", error);
        res.status(500).json({ error: "Failed to fork song" });
    }
});

export default router;
