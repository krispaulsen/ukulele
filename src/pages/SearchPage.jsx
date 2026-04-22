import { useMemo } from "react";
import SongList from "../components/SongList";

export default function SearchPage({ songs, query, onQueryChange }) {
  const filteredSongs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;

    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q)
    );
  }, [songs, query]);

  return (
    <section className="sidebar page-panel">
      <h2>Song Search</h2>
      <label htmlFor="search">Search songs</label>
      <input
        id="search"
        type="text"
        placeholder="Type song title or artist..."
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <SongList items={filteredSongs} />
    </section>
  );
}
