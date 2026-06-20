import { use } from "react";
import { UserContext } from "../context/UserContext";
import { Link } from "./ui";
import { IconButton } from "@material-tailwind/react";

export default function SongList({ items, updatePopularList = () => {} }) {
    const { user, toggleFavorite } = use(UserContext);

    const handleToggleFavorite = async (slug) => {
        await toggleFavorite(slug);
        updatePopularList();
    };

    return (
        <table className="dataTable">
            <thead>
                <tr>
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
                                    <IconButton
                                        onClick={() => handleToggleFavorite(song.slug)}
                                        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                                        variant={isFavorited ? "filled" : "outlined"}
                                        size="sm"
                                    >
                                        {isFavorited ? (
                                            <i className="fa-solid fa-heart"></i>
                                        ) : (
                                            <i className="fa-regular fa-heart"></i>
                                        )}
                                    </IconButton>
                                </td>
                            )}
                            <td>
                                <Link className="song-btn" to={`/song/${song.slug}`}>{song.title}</Link>
                            </td>
                            <td>{song.artist}</td>
                            <td>{song.chords.join(', ')}</td>
                            <td>
                                {song.screenName || "Unknown"} • {new Date(song.updatedAt).toLocaleDateString()}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
