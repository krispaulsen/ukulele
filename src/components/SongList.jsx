import { Link } from "react-router-dom";

export default function SongList({ items }) {
  return (
    <ul className="song-list">
      {items.map((song) => (
        <li key={song.id}>
          <Link className="song-btn" to={`/song/${song.id}`}>
            <span className="song-title">{song.title}</span>
            <span className="song-meta">{song.artist}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
