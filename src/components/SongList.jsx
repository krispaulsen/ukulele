import { use } from "react";
import { UserContext } from "../context/UserContext";
import { ToggleButton, Link } from "./ui";

export default function SongList({ items }) {
    const { user, toggleFavorite } = use(UserContext);

    return (
        <table className="w-full">
            <thead>
                <tr className="text-left">
                    {user?.isLoggedIn && <th></th>}
                    <th>Song</th>
                    <th>Artist</th>
                    <th>Chords</th>
                    <th>Submitted By</th>
                </tr>
            </thead>
            <tbody>
                {items.map((song) => {
                    const isFavorited = user?.favorites?.has(song.id);

                    return (
                        <tr key={song.id}>
                            {user?.isLoggedIn && (
                                <td>
                                    <ToggleButton
                                        type="button"
                                        variant="icon"
                                        className={`favorite-btn ${isFavorited ? "active" : ""}`}
                                        onClick={() => toggleFavorite(song.id)}
                                        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                                    >
                                        {isFavorited ? "★" : "☆"}
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
