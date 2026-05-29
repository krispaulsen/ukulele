import { use, useEffect, useState, Fragment } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { UserContext } from "../context/UserContext";
import { Flex, Link } from "../components/ui";
import { Input } from "../components/Forms";
import UkuleleChordDiagram from "../components/UkuleleChordDiagram";
import Lyrics from "../components/Lyrics";
import { IconButton } from "@material-tailwind/react";

export default function SongPage() {
    const { slug } = useParams();
    const { user, toggleFavorite } = use(UserContext);
    const [song, setSong] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [numCols, setNumCols] = useState(3);

    useEffect(() => {
        async function loadSong() {
            setIsLoading(true);
            setLoadError("");
            try {
                const data = await apiRequest(`/api/songs/${encodeURIComponent(slug)}`);
                setSong(data);
            } catch (error) {
                setLoadError(error.message || "Failed to load song");
                setSong(null);
            } finally {
                setIsLoading(false);
            }
        }

        loadSong();
    }, [slug]);

    return (
        <>
            {isLoading ? <p>Loading song...</p> : null}
            {loadError ? <p role="alert">Could not load song: {loadError}</p> : null}

            {song && !isLoading ? (
                <section className="details">
                    <Flex className="mb-4">
                        {user?.isLoggedIn && (
                            <IconButton
                                className={`favorite-btn ${user?.favorites?.has(song.slug) ? "active" : ""}`}
                                onClick={() => toggleFavorite(song.slug)}
                            >
                                <i className={user?.favorites?.has(song.slug) ? "fa-solid fa-star" : "fa-regular fa-star"}></i>
                            </IconButton>
                        )}
                        <div>
                            <h2 className="leading-[1.142857143]">{song.title}</h2>
                            <p className="artist">{song.artist}</p>
                        </div>
                        {user?.isLoggedIn ? (
                            <div className="pt-2">
                                {song.canEdit ? (
                                    <Link to={`/song/${song.slug}/edit`}>
                                        <i className="fa-solid fa-pencil mr-1"></i>
                                        Edit Song
                                    </Link>
                                ) : (
                                    <Link to={`/song/${song.slug}/fork`}>
                                        <i className="fa-solid fa-pencil mr-1"></i>
                                        Fork and Edit
                                    </Link>
                                )}
                            </div>
                        ) : null}
                    </Flex>

                    {/* {song.originalSlug ? <p className="song-note">Forked from: {song.originalSlug}</p> : null}
                    <div className="song-info">
                        <span>
                            <strong>Key:</strong> {song.key}
                        </span>
                        <span>
                            <strong>Capo:</strong> {song.capo}
                        </span>
                    </div> */}

                    <h3>Chords</h3>
                    <Flex gap="gap-2" className="mb-4">
                        {song.chords.map((chord) => (
                            <UkuleleChordDiagram key={chord} chord={chord} />
                        ))}
                    </Flex>

                    <Flex className="justify-between">
                        <h3>Lyrics</h3>
                        <Input type="number" label="# Columns" value={numCols} min="1" max="6" onChange={(e) => setNumCols(e.target.value)} />
                    </Flex>
                    <Lyrics columns={numCols}>{song.lyrics}</Lyrics>
                </section>
            ) : null}
        </>
    );
}
