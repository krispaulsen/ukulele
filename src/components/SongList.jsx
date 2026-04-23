import { Link } from "react-router-dom";

export default function SongList({ items, favoriteSongIds = new Set(), onToggleFavorite, isLoggedIn }) {
  return (
    <ul className="song-list">
      {items.map((song) => (
        <li key={song.id}>
          <div className="song-row">
            <Link className="song-btn" to={`/song/${song.id}`}>
              <span className="song-title">{song.title}</span>
              <span className="song-meta">{song.artist}</span>
            </Link>
            {isLoggedIn && onToggleFavorite ? (
              <button
                type="button"
                className={`favorite-btn ${favoriteSongIds.has(song.id) ? "on" : ""}`}
                onClick={() => onToggleFavorite(song.id)}
                aria-label={favoriteSongIds.has(song.id) ? "Remove from favorites" : "Add to favorites"}
              >
                ★
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
