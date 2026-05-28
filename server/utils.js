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
        updatedAt: song.updatedAt,
        isOwner: currentUserId ? song.ownerUserId === currentUserId : false
    };
}

export async function resolveUniqueSongId(title) {
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

export function validateSongPayload(payload) {
    const title = String(payload.title ?? "").trim();
    const artist = String(payload.artist ?? "").trim();
    const key = String(payload.key ?? "").trim();
    const capo = payload.capo;
    const chords = Array.isArray(payload.chords)
        ? payload.chords.map((item) => String(item).trim()).filter(Boolean)
        : [];
    const lyrics = String(payload.lyrics ?? "").trim();

    if (!title || !artist) {
        return { ok: false, error: "Title and artist are required" };
    }

    return { ok: true, value: { title, artist, key, capo, chords, lyrics } };
}
