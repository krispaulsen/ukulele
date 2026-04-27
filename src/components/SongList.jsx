import { ToggleButton, Link } from "./ui";

export default function SongList({ items, favoriteSongIds = new Set(), onToggleFavorite, isLoggedIn }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="text-left">
          {isLoggedIn && <th></th>}
          <th>Song</th>
          <th>Artist</th>
          <th>Chords</th>
          <th>Submitted By</th>
        </tr>
      </thead>
      <tbody>
        {items.map((song) => {
          const isFavorited = favoriteSongIds.has(song.id);
          return (
            <tr key={song.id}>
              {isLoggedIn && (
                <td>
                  <ToggleButton
                    type="button"
                    variant="icon"
                    className={`favorite-btn ${isFavorited ? "active" : ""}`}
                    onClick={() => onToggleFavorite(song.id)}
                    aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                  >
                    { isFavorited ? "★" : "☆" }
                  </ToggleButton>
                </td>
              )}
              <td>
                <Link className="song-btn" to={`/song/${song.id}`}>{song.title}</Link>
              </td>
              <td>{song.artist}</td>
              <td>{song.chords}</td>
              <td>
                {song.submitter} {' '}
                {new Date(song.modified).toLocaleDateString()}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
