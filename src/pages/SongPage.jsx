import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SongDetails from "../components/SongDetails";
import { apiRequest } from "../lib/api";

export default function SongPage({ isLoggedIn, favoriteSongIds, onToggleFavorite }) {
  const { songId } = useParams();
  const [song, setSong] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadSong() {
      setIsLoading(true);
      setLoadError("");
      try {
        const data = await apiRequest(`/api/songs/${encodeURIComponent(songId)}`);
        setSong(data);
      } catch (error) {
        setLoadError(error.message || "Failed to load song");
        setSong(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadSong();
  }, [songId]);

  return (
    <>
      <Link to="/" className="back-link">
        ← Back to search
      </Link>
      {isLoading ? <p>Loading song...</p> : null}
      {loadError ? <p role="alert">Could not load song: {loadError}</p> : null}
      <SongDetails
        song={song}
        actions={
          isLoggedIn && song ? (
            <>
              <button
                type="button"
                className={`favorite-btn ${favoriteSongIds.has(song.id) ? "on" : ""}`}
                onClick={() => onToggleFavorite(song.id)}
              >
                {favoriteSongIds.has(song.id) ? "★ Favorited" : "☆ Add Favorite"}
              </button>
              {song.canEdit ? <Link className="action-link" to={`/song/${song.id}/edit`}>Edit Song</Link> : null}
              {!song.canEdit ? <Link className="action-link" to={`/song/${song.id}/fork`}>Fork and Edit</Link> : null}
            </>
          ) : null
        }
      />
    </>
  );
}
