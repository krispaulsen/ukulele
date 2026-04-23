import SongList from "../components/SongList";

export default function FavoritesPage({ songs, favoriteSongIds, onToggleFavorite }) {
  const favoriteSongs = songs.filter((song) => favoriteSongIds.has(song.id));

  return (
    <section className="sidebar page-panel">
      <h2>My Favorites</h2>
      {favoriteSongs.length === 0 ? (
        <p>No favorites yet. Mark songs with the star button.</p>
      ) : (
        <SongList items={favoriteSongs} favoriteSongIds={favoriteSongIds} onToggleFavorite={onToggleFavorite} />
      )}
    </section>
  );
}
