import { useEffect, useMemo, useState } from "react";

function SongList({ items, selectedId, onSelect }) {
  return (
    <ul className="song-list">
      {items.map((song) => (
        <li key={song.id}>
          <button
            className={song.id === selectedId ? "song-btn active" : "song-btn"}
            onClick={() => onSelect(song.id)}
          >
            <span className="song-title">{song.title}</span>
            <span className="song-meta">{song.artist}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function SongDetails({ song }) {
  if (!song) {
    return (
      <section className="details">
        <p>Select a song to view chords and lyrics.</p>
      </section>
    );
  }

  return (
    <section className="details">
      <h2>{song.title}</h2>
      <p className="artist">{song.artist}</p>
      <div className="song-info">
        <span>
          <strong>Key:</strong> {song.key}
        </span>
        <span>
          <strong>Capo:</strong> {song.capo}
        </span>
      </div>

      <h3>Chords</h3>
      <div className="chord-tags">
        {song.chords.map((chord) => (
          <span key={chord} className="tag">
            {chord}
          </span>
        ))}
      </div>

      <h3>Lyrics</h3>
      <pre className="lyrics">
        {song.lyrics.map((line) => line).join("\n")}
      </pre>
    </section>
  );
}

export default function App() {
  const [songs, setSongs] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
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
        setSelectedId((current) => current ?? data[0]?.id ?? null);
      } catch (error) {
        setLoadError(error.message || "Failed to load songs");
      } finally {
        setIsLoading(false);
      }
    }

    loadSongs();
  }, []);

  const filteredSongs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;

    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q)
    );
  }, [query]);

  const selectedSong = songs.find((song) => song.id === selectedId) ?? null;

  return (
    <main className="container">
      <header>
        <h1>Ukulele Songbook</h1>
        <p>Local network music/chord site for Raspberry Pi</p>
      </header>

      {isLoading ? <p>Loading songs...</p> : null}
      {loadError ? <p role="alert">Could not load songs: {loadError}</p> : null}

      <div className="layout">
        <aside className="sidebar">
          <label htmlFor="search">Search songs</label>
          <input
            id="search"
            type="text"
            placeholder="Type song title or artist..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <SongList
            items={filteredSongs}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>

        <SongDetails song={selectedSong} />
      </div>
    </main>
  );
}
