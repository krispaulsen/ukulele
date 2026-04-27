import { useMemo } from "react";
import SongList from "../components/SongList";
import { Link } from "../components/ui";
import { Input } from "../components/Forms";

export default function SearchPage({
  songs,
  query,
  onQueryChange,
  onToggleFavorite,
  favoriteSongIds,
  popularSongs,
  onLogout,
  isLoggedIn
}) {
  const filteredSongs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;

    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q)
    );
  }, [songs, query]);

  return (
    <>
      <h2>Song Search</h2>
      <Input
        id="search"
        type="text"
        label="Search Songs"
        placeholder="Type song title or artist..."
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <SongList isLoggedIn={isLoggedIn} items={filteredSongs} favoriteSongIds={favoriteSongIds} onToggleFavorite={onToggleFavorite} />

      <h3 className="mt-6">Most Favorited Songs</h3>
      {popularSongs.length === 0 ? (
        <p>No favorites yet.</p>
      ) : (
        <ul className="popular-list">
          {popularSongs.map((song) => (
            <li key={song.songId}>
              <Link to={`/song/${song.songId}`}>{song.title}</Link>
              <span>{song.favoriteCount} favorites</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
