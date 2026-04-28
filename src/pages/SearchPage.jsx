import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";
import SongList from "../components/SongList";
import { Link } from "../components/ui";
import { Input } from "../components/Forms";

export default function SearchPage({ onToggleFavorite, favoriteSongIds }) {
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [songs, setSongs] = useState([]);
    const [popularSongs, setPopularSongs] = useState([]);
    const [query, setQuery] = useState('');

    const filteredSongs = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return songs;

        return songs.filter(
            (song) =>
                song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q)
        );
    }, [songs, query]);

    async function refreshSongs() {
        setIsLoading(true);
        setLoadError("");
        try {
            const data = await apiRequest("/api/songs");
            setSongs(data);
        } catch (error) {
            setLoadError(error.message || "Failed to load songs");
        } finally {
            setIsLoading(false);
        }
    }

    async function refreshPopular() {
        try {
            const top = await apiRequest("/api/favorites/top?limit=10");
            setPopularSongs(top);
        } catch {
            setPopularSongs([]);
        }
    }

    useEffect(() => {
        refreshSongs();
        refreshPopular();
    }, []);

    return (
        <>
            {isLoading ? <p>Loading songs...</p> : null}
            {loadError ? <p role="alert">Could not load songs: {loadError}</p> : null}

            <h2>Song Search</h2>
            <Input
                id="search"
                type="text"
                label="Search Songs"
                placeholder="Type song title or artist..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
            />
            <SongList items={filteredSongs} updatePopularList={refreshPopular} />

            <h3 className="mt-6">Most Favorited Songs</h3>
            {popularSongs.length === 0 ? (
                <p>No favorites yet.</p>
            ) : (
                <ul className="popular-list">
                    {popularSongs.map((song) => (
                        <li key={song.songId}>
                            <Link to={`/song/${song.songId}`}>{song.title}</Link>
                            <span>{song.favoriteCount} favorites</span>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
