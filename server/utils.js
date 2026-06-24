import Song from './models/Song.js';

export function slugify(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]+/g, "")
        .replace(/^-+|-+$/g, "");
}

/**
 * Extract a YouTube video ID (11 chars) from a full URL, short link, embed, or raw ID.
 * Returns empty string if nothing valid is found.
 */
export function extractYouTubeId(input) {
    if (!input) return "";
    const str = String(input).trim();
    if (!str) return "";

    // Already a clean ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
        return str;
    }

    // Common patterns
    const patterns = [
        /(?:v=|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/i,
        /[?&]v=([a-zA-Z0-9_-]{11})/i,
    ];

    for (const pattern of patterns) {
        const match = str.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return "";
}

export function songDocToDetails(song, currentUserId = null) {
    const ownerId = song.ownerUserId
        ? (typeof song.ownerUserId === "object" ? String(song.ownerUserId._id || song.ownerUserId) : String(song.ownerUserId))
        : song.ownerUserId;

    // Try to extract screenName if the passed song has a populated owner
    const ownerObj = song.ownerUserId && typeof song.ownerUserId === "object" ? song.ownerUserId : null;
    const screenName = ownerObj?.screenName || song.screenName || "";

    return {
        _id: song._id,
        slug: song.slug,
        title: song.title,
        artist: song.artist,
        key: song.key,
        capo: song.capo,
        notes: song.notes,
        chords: song.chords || [],
        lyrics: song.lyrics || "",
        youtube: song.youtube || "",
        ownerUserId: ownerId,
        screenName,
        originalSlug: song.originalSlug,
        isPublic: song.isPublic,
        favorites: song.favorites || 0,
        createdAt: song.createdAt,
        updatedAt: song.updatedAt,
        isOwner: currentUserId ? ownerId === String(currentUserId) : false
    };
}

export async function resolveUniqueSongSlug(title) {
    let baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await Song.findOne({ slug });
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}

export function validateSongPayload(payload) {
    const title = String(payload.title ?? "").trim();
    const artist = String(payload.artist ?? "").trim();
    const key = String(payload.key ?? "").trim();
    const capo = payload.capo;
    const notes = String(payload.notes ?? "").trim();
    const chords = Array.isArray(payload.chords)
        ? payload.chords.map((item) => String(item).trim()).filter(Boolean)
        : [];
    const lyrics = String(payload.lyrics ?? "").trim();
    const youtube = extractYouTubeId(payload.youtube);

    if (!title || !artist) {
        return { ok: false, error: "Title and artist are required" };
    }

    return { ok: true, value: { title, artist, key, capo, notes, chords, lyrics, youtube } };
}

/**
 * Normalizes a (lean + possibly populated) song document for API responses.
 * Ensures:
 *  - screenName is available at the top level (for "Submitted By" in lists)
 *  - ownerUserId is always a plain string id (not a populated subdocument)
 *  - isOwner is computed when currentUserId is provided
 */
export function formatSong(song, currentUserId = null) {
    if (!song) return song;

    const owner = song.ownerUserId && typeof song.ownerUserId === "object"
        ? song.ownerUserId
        : null;

    const ownerUserId = owner
        ? String(owner._id || owner)
        : song.ownerUserId
            ? String(song.ownerUserId)
            : song.ownerUserId;

    const screenName = owner?.screenName || song.screenName || "";

    const isOwner = currentUserId
        ? String(ownerUserId) === String(currentUserId)
        : false;

    return {
        ...song,
        ownerUserId,
        screenName,
        isOwner
    };
}

/**
 * Builds a MongoDB filter object for the public song list (GET /api/songs).
 * Supports:
 *  - ?ownerUserId=xxx or ?owner=xxx : songs owned by a specific user
 *  - ?mine=true : shorthand for the current authenticated user's songs
 *
 * Privacy rule:
 *  - If the requester is the target owner (detected via currentUser), private songs are returned.
 *  - Otherwise only isPublic songs are returned for that owner (or all public songs if no owner filter).
 *
 * q search (title/artist, case-insensitive) is combined with the base condition.
 */
export function getSongListFilter(params = {}, currentUser = null) {
    const q = String(params.q || params.query || "").trim();
    const rawOwner = String(params.ownerUserId || params.owner || "").trim();
    const mineFlag = String(params.mine || "").trim().toLowerCase();
    const isMine = mineFlag === "1" || mineFlag === "true" || mineFlag === "yes";

    let targetOwnerId = null;
    let viewingOwn = false;

    if (isMine) {
        if (currentUser && currentUser.userId) {
            targetOwnerId = String(currentUser.userId);
            viewingOwn = true;
        }
    } else if (rawOwner) {
        targetOwnerId = rawOwner;
        if (currentUser && currentUser.userId && targetOwnerId === String(currentUser.userId)) {
            viewingOwn = true;
        }
    }

    let filter;
    if (targetOwnerId) {
        filter = { ownerUserId: targetOwnerId };
        if (!viewingOwn) {
            filter.isPublic = true;
        }
    } else {
        filter = { isPublic: true };
    }

    if (q) {
        filter = {
            ...filter,
            $or: [
                { title: { $regex: q, $options: "i" } },
                { artist: { $regex: q, $options: "i" } }
            ]
        };
    }

    return filter;
}
