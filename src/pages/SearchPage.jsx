import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import SongList from "../components/SongList";
import { Link } from "../components/ui";
import { Input } from "../components/Forms";

const PAGE_SIZE = 10;

export default function SearchPage({ onToggleFavorite, favoriteSongIds }) {
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [songs, setSongs] = useState([]);
    const [popularSongs, setPopularSongs] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [hasLoaded, setHasLoaded] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [query, setQuery] = useState(""); // debounced value used for fetch

    // Debounce searchTerm into query (and reset to page 1 on new search)
    useEffect(() => {
        const id = setTimeout(() => setQuery(searchTerm), 300);
        return () => clearTimeout(id);
    }, [searchTerm]);

    // Refetch when debounced query or page changes (inlined to avoid any closure issues with page/query).
    useEffect(() => {
        setIsLoading(true);
        setLoadError("");
        const q = query.trim();
        let url = `/api/songs?page=${page}&limit=${PAGE_SIZE}`;
        if (q) url += `&q=${encodeURIComponent(q)}`;

        apiRequest(url)
            .then((data) => {
                if (Array.isArray(data)) {
                    // Legacy (pre-pagination) response shape from server.
                    // Client-side slice + filter so pagination/search still "work" until backend is restarted.
                    console.warn("[SearchPage] Received legacy array from /api/songs (no pagination). Restart the dev server to pick up backend changes for real ?page/?limit/?q support.");
                    let legacy = data;
                    const qq = q.toLowerCase();
                    if (qq) {
                        legacy = legacy.filter((song) =>
                            (song.title || "").toLowerCase().includes(qq) ||
                            (song.artist || "").toLowerCase().includes(qq)
                        );
                    }
                    const start = (page - 1) * PAGE_SIZE;
                    setSongs(legacy.slice(start, start + PAGE_SIZE));
                    setTotal(legacy.length);
                    setTotalPages(Math.ceil(legacy.length / PAGE_SIZE) || 1);
                } else {
                    setSongs(data?.items || []);
                    setTotal(data?.total || 0);
                    setTotalPages(data?.totalPages || 1);
                }
            })
            .catch((error) => {
                setLoadError(error.message || "Failed to load songs");
                setSongs([]);
                setTotal(0);
                setTotalPages(1);
            })
            .finally(() => {
                setIsLoading(false);
                setHasLoaded(true);
            });
    }, [query, page]);

    async function refreshPopular() {
        try {
            const top = await apiRequest("/api/favorites/top?limit=10");
            setPopularSongs(top);
        } catch {
            setPopularSongs([]);
        }
    }

    useEffect(() => {
        refreshPopular();
    }, []);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setPage(1);
    };

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
                value={searchTerm}
                onChange={handleSearchChange}
            />
            <SongList
                items={songs}
                updatePopularList={refreshPopular}
                pagination={hasLoaded ? { page, totalPages, total, limit: PAGE_SIZE } : undefined}
                onPageChange={setPage}
            />

            <h3 className="mt-6">Most Favorited Songs</h3>
            {popularSongs.length === 0 ? (
                <p>No favorites yet.</p>
            ) : (
                <table className="dataTable lg:max-w-1/2">
                    <tbody>
                        {popularSongs.map((song) => (
                            <tr key={song.slug}>
                                <td>
                                    <div className="relative flex items-center justify-center">
                                        <i className="fa-solid fa-heart text-2xl"></i>
                                        <span className="absolute text-bg text-xs">
                                            {song.favorites}
                                            <span className="sr-only">favorites</span>
                                        </span>
                                    </div>
                                </td>
                                <td><Link to={`/song/${song.slug}`}>{song.title}</Link></td>
                                <td>{song.artist}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
}
