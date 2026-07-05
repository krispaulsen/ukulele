import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import SongList from "../components/SongList";
import { Link } from "../components/ui";
import { Input } from "../components/Forms";

const PAGE_SIZE = 10;

export default function SearchPage({ onToggleFavorite, favoriteSongIds }) {
    const [searchParams, setSearchParams] = useSearchParams();

    // Derive page and search q from URL (source of truth for pagination + filter).
    // This survives browser back/forward (and direct links/refresh).
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const q = (searchParams.get("q") || "").trim();

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [songs, setSongs] = useState([]);
    const [popularSongs, setPopularSongs] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Local input state for controlled <Input>. Sync from URL q on mount/back/direct nav.
    const [searchTerm, setSearchTerm] = useState(q);
    useEffect(() => {
        setSearchTerm(q);
    }, [q]);

    // Debounce local searchTerm, then commit to URL (this also resets page to 1).
    // Using search params as source of truth means back/forward restores page + search.
    useEffect(() => {
        const id = setTimeout(() => {
            const trimmed = searchTerm.trim();
            // Only push update if different from the committed URL value.
            if (trimmed !== q) {
                setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    if (trimmed) {
                        next.set("q", trimmed);
                    } else {
                        next.delete("q");
                    }
                    // New search always starts at page 1 (omit the param for cleanliness)
                    next.delete("page");
                    return next;
                }, { replace: true });
            }
        }, 300);
        return () => clearTimeout(id);
    }, [searchTerm, q, setSearchParams]);

    // Refetch when URL-derived page or q changes (survives navigation + remount).
    useEffect(() => {
        setIsLoading(true);
        setLoadError("");
        const qq = q; // already trimmed
        let url = `/api/songs?page=${page}&limit=${PAGE_SIZE}`;
        if (qq) url += `&q=${encodeURIComponent(qq)}`;

        apiRequest(url)
            .then((data) => {
                if (Array.isArray(data)) {
                    // Legacy (pre-pagination) response shape from server.
                    // Client-side slice + filter so pagination/search still "work" until backend is restarted.
                    console.warn("[SearchPage] Received legacy array from /api/songs (no pagination). Restart the dev server to pick up backend changes for real ?page/?limit/?q support.");
                    let legacy = data;
                    const lower = qq.toLowerCase();
                    if (lower) {
                        legacy = legacy.filter((song) =>
                            (song.title || "").toLowerCase().includes(lower) ||
                            (song.artist || "").toLowerCase().includes(lower)
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
    }, [page, q]);

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
        // Page reset happens inside the debounced URL update effect.
    };

    const handlePageChange = (newPage) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (newPage > 1) {
                next.set("page", String(newPage));
            } else {
                next.delete("page");
            }
            return next;
        }, { replace: true });
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
                onPageChange={handlePageChange}
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
