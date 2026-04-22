import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import SongPage from "./pages/SongPage";

export default function App() {
  const [songs, setSongs] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadSongs() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/songs");
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        setSongs(data);
      } catch (error) {
        setLoadError(error.message || "Failed to load songs");
      } finally {
        setIsLoading(false);
      }
    }

    loadSongs();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>Ukulele Songbook</h1>
        <p>Local network music/chord site for Raspberry Pi</p>
      </header>

      {isLoading ? <p>Loading songs...</p> : null}
      {loadError ? <p role="alert">Could not load songs: {loadError}</p> : null}

      <div className="layout">
        <Routes>
          <Route
            path="/"
            element={<SearchPage songs={songs} query={query} onQueryChange={setQuery} />}
          />
          <Route path="/song/:songId" element={<SongPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </main>
  );
}
