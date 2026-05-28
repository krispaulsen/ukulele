import { Router } from "express";
import Song from "../models/Song.js";
import Favorite from "../models/Favorite.js";
import { requireAuth } from "../middleware.js";

const router = Router();

// GET /api/favorites/top — must be registered before /:songId
router.get("/top", async (req, res) => {
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

// GET /api/favorites — return songIds the current user has favorited
router.get("/", requireAuth, async (req, res) => {
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
router.post("/:songId", requireAuth, async (req, res) => {
    try {
        const { songId } = req.params;

        const song = await Song.findOne({ songId });
        if (!song) {
            return res.status(404).json({ error: "Song not found" });
        }

        await Favorite.create({ userId: req.user.userId, songId });
        await Song.updateOne({ songId }, { $inc: { favorites: 1 } });

        res.status(201).json({ songId, userId: req.user.userId });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(204).end();
        }
        console.error("Failed to add favorite:", error);
        res.status(500).json({ error: "Failed to add favorite" });
    }
});

// DELETE /api/favorites/:songId — remove a favorite
router.delete("/:songId", requireAuth, async (req, res) => {
    try {
        const { songId } = req.params;

        const deleted = await Favorite.findOneAndDelete({
            userId: req.user.userId,
            songId
        });

        if (deleted) {
            await Song.updateOne({ songId }, { $inc: { favorites: -1 } });
        }

        res.status(204).end();
    } catch (error) {
        console.error("Failed to remove favorite:", error);
        res.status(500).json({ error: "Failed to remove favorite" });
    }
});

export default router;
