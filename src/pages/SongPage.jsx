import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SongDetails from "../components/SongDetails";

export default function SongPage() {
  const { songId } = useParams();
  const [song, setSong] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadSong() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch(`/api/songs/${encodeURIComponent(songId)}`);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
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
      <SongDetails song={song} />
    </>
  );
}
