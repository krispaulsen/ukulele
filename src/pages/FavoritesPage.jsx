import { use, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import { apiRequest } from "../lib/api";
import SongList from "../components/SongList";

const FAV_PAGE_SIZE = 20;

export default function FavoritesPage() {
    const { user } = use(UserContext);
    const [favoriteSongs, setFavoriteSongs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [favPage, setFavPage] = useState(1);

    useEffect(() => {
        async function loadSongList() {
            setIsLoading(true);
            setLoadError("");
            try {
                const data = await apiRequest(`/api/songs/list`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slugs: [...user.favorites] })
                });
                setFavoriteSongs(data || []);
                setFavPage(1);
            } catch (error) {
                setLoadError(error.message || "Failed to load song");
                setFavoriteSongs(null);
            } finally {
                setIsLoading(false);
            }
        }

        if (user.favorites.size) {
            loadSongList();
        } else {
            // favorites is empty
            setFavoriteSongs([]);
            setIsLoading(false);
            setFavPage(1);
        }
    }, [user.favorites]);

    // Compute paged view + meta (client side)
    const full = Array.isArray(favoriteSongs) ? favoriteSongs : [];
    const tPages = Math.max(1, Math.ceil(full.length / FAV_PAGE_SIZE));
    const safePage = Math.min(favPage, tPages);
    const paged = full.slice((safePage - 1) * FAV_PAGE_SIZE, safePage * FAV_PAGE_SIZE);
    const favPagination = full.length > FAV_PAGE_SIZE
        ? { page: safePage, totalPages: tPages, total: full.length, limit: FAV_PAGE_SIZE }
        : null;

    return (
        <>
            <h2>My Favorites</h2>
            {isLoading ? <p>Loading songs...</p> : null}
            {loadError ? <p role="alert">Could not load songs: {loadError}</p> : null}

            {favoriteSongs ? (
                <SongList
                    items={paged}
                    pagination={favPagination}
                    onPageChange={setFavPage}
                />
            ) : (
                <p>No favorites yet. Mark songs with the star button.</p>
            )}
        </>
    );
}
