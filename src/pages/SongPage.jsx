import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import SongDetails from "../components/SongDetails";
import { Button, Link } from "../components/ui";

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
      {isLoading ? <p>Loading song...</p> : null}
      {loadError ? <p role="alert">Could not load song: {loadError}</p> : null}
      
      <SongDetails
        song={song}
        actions={
          isLoggedIn && song ? (
            <>
              <Button
                type="button"
                className={`favorite-btn ${favoriteSongIds.has(song.id) ? "active" : ""}`}
                onClick={() => onToggleFavorite(song.id)}
              >
                {favoriteSongIds.has(song.id) ? "★ Favorited" : "☆ Add Favorite"}
              </Button>
              {song.canEdit ? (
                <Link variant="button-primary" className="action-link" to={`/song/${song.id}/edit`}>Edit Song</Link>
              ) : (
                <Link variant="button-primary" className="action-link" to={`/song/${song.id}/fork`}>Fork and Edit</Link>
              )}
            </>
          ) : null
        }
      />
    </>
  );
}
