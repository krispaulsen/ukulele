import { use } from "react";
import { UserContext } from "../context/UserContext";
import { ToggleButton, Link } from "./ui";

export default function SongList({ items, updatePopularList = () => {} }) {
    const { user, toggleFavorite } = use(UserContext);

    const handleToggleFavorite = async (slug) => {
        await toggleFavorite(slug);
        updatePopularList();
    };

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
                    const isFavorited = user?.favorites?.has(song.slug);

                    return (
                        <tr key={song.slug}>
                            {user?.isLoggedIn && (
                                <td>
                                    <ToggleButton
                                        type="button"
                                        variant="icon"
                                        className={`favorite-btn ${isFavorited ? "active" : ""}`}
                                        onClick={() => handleToggleFavorite(song.slug)}
                                        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                                    >
                                        {isFavorited ? "★" : "☆"}
                                    </ToggleButton>
                                </td>
                            )}
                            <td>
                                <Link className="song-btn" to={`/song/${song.slug}`}>{song.title}</Link>
                            </td>
                            <td>{song.artist}</td>
                            <td>{song.chords.join(', ')}</td>
                            <td>
                                {song.screenName} {' '}
                                {new Date(song.updatedAt).toLocaleDateString()}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
