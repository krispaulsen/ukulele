import { use, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import { apiRequest } from "../lib/api";
import SongList from "../components/SongList";

export default function FavoritesPage() {
    const { user } = use(UserContext);
    const [favoriteSongs, setFavoriteSongs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

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
                setFavoriteSongs(data);
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
            setIsLoading(false);
        }
    }, [user.favorites]);

    return (
        <>
            <h2>My Favorites</h2>
            {isLoading ? <p>Loading songs...</p> : null}
            {loadError ? <p role="alert">Could not load songs: {loadError}</p> : null}

            {favoriteSongs ? (
                <SongList items={favoriteSongs} />
            ) : (
                <p>No favorites yet. Mark songs with the star button.</p>
            )}
        </>
    );
}
