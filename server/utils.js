import Song from './models/Song.js';

export function slugify(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]+/g, "")
        .replace(/^-+|-+$/g, "");
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

    if (!title || !artist) {
        return { ok: false, error: "Title and artist are required" };
    }

    return { ok: true, value: { title, artist, key, capo, notes, chords, lyrics } };
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
