import { use } from "react";
import SongList from "../components/SongList";
import { UserContext } from "../context/UserContext";

export default function FavoritesPage({ songs, favoriteSongIds, onToggleFavorite }) {
  const { user } = use(UserContext);

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
