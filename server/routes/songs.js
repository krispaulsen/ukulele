import { Router } from "express";
import Song from "../models/Song.js";
import { validateSongPayload, resolveUniqueSongId, songDocToDetails } from "../utils.js";
import { requireAuth } from "../middleware.js";

const router = Router();

// Get all public songs
router.get("/", async (_req, res) => {
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
router.get("/:songId", async (req, res) => {
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

// Get multiple songs by IDs
router.post("/list", async (req, res) => {
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
router.post("/", requireAuth, async (req, res) => {
    const parsed = validateSongPayload(req.body ?? {});
    if (!parsed.ok) {
        return res.status(400).json({ error: parsed.error });
    }

    try {
        const songId = await resolveUniqueSongId(parsed.value.title);

        const song = await Song.create({
            songId,
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
router.put("/:songId", requireAuth, async (req, res) => {
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

        Object.assign(song, parsed.value);
        await song.save();

        res.json(songDocToDetails(song.toObject(), req.user.userId));
    } catch (error) {
        console.error("Failed to update song:", error);
        res.status(500).json({ error: "Failed to update song" });
    }
});

// FORK existing song
router.post("/:songId/fork", requireAuth, async (req, res) => {
    const parsed = validateSongPayload(req.body ?? {});
    if (!parsed.ok) {
        return res.status(400).json({ error: parsed.error });
    }

    try {
        const source = await Song.findOne({ songId: req.params.songId });

        if (!source) {
            return res.status(404).json({ error: "Source song not found" });
        }

        const songId = await resolveUniqueSongId(parsed.value.title);

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

export default router;
