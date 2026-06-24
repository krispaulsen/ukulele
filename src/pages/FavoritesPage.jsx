import { use, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import { apiRequest } from "../lib/api";
import SongList from "../components/SongList";
import { Link } from "../components/ui";

const FAV_PAGE_SIZE = 10;
const MY_PAGE_SIZE = 10;

export default function FavoritesPage() {
    const { user } = use(UserContext);
    const [favoriteSongs, setFavoriteSongs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [favPage, setFavPage] = useState(1);

    // My Songs (owned by current user) - server paginated
    const [mySongs, setMySongs] = useState([]);
    const [myIsLoading, setMyIsLoading] = useState(true);
    const [myLoadError, setMyLoadError] = useState("");
    const [myPage, setMyPage] = useState(1);
    const [myTotal, setMyTotal] = useState(0);
    const [myTotalPages, setMyTotalPages] = useState(1);

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

    // Load "My Songs" (songs owned by current user) with server pagination
    useEffect(() => {
        async function loadMySongs() {
            if (!user?.isLoggedIn) {
                setMySongs([]);
                setMyTotal(0);
                setMyTotalPages(1);
                setMyIsLoading(false);
                return;
            }
            setMyIsLoading(true);
            setMyLoadError("");
            try {
                const url = `/api/songs?mine=true&page=${myPage}&limit=${MY_PAGE_SIZE}`;
                const data = await apiRequest(url);
                if (Array.isArray(data)) {
                    // Legacy (pre-pagination) response
                    const start = (myPage - 1) * MY_PAGE_SIZE;
                    setMySongs(data.slice(start, start + MY_PAGE_SIZE));
                    setMyTotal(data.length);
                    setMyTotalPages(Math.ceil(data.length / MY_PAGE_SIZE) || 1);
                } else {
                    setMySongs(data?.items || []);
                    setMyTotal(data?.total || 0);
                    setMyTotalPages(data?.totalPages || 1);
                }
            } catch (error) {
                setMyLoadError(error.message || "Failed to load your songs");
                setMySongs([]);
                setMyTotal(0);
                setMyTotalPages(1);
            } finally {
                setMyIsLoading(false);
            }
        }

        loadMySongs();
    }, [myPage, user?.isLoggedIn, user?.userId]);

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
            <h2>My Songbook</h2>

            <h3>My Favorites</h3>
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

            <h3 className="mt-6">My Songs</h3>
            {myIsLoading ? <p>Loading your songs...</p> : null}
            {myLoadError ? <p role="alert">Could not load your songs: {myLoadError}</p> : null}

            {!myIsLoading && !myLoadError && myTotal === 0 ? (
                <p>You haven't created any songs yet. <Link to="/song/new">Add your first song</Link>.</p>
            ) : (
                <SongList
                    items={mySongs}
                    pagination={myTotal > 0 ? { page: myPage, totalPages: myTotalPages, total: myTotal, limit: MY_PAGE_SIZE } : undefined}
                    onPageChange={setMyPage}
                />
            )}
        </>
    );
}
