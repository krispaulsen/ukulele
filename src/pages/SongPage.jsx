import { use, useEffect, useState, Fragment } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { UserContext } from "../context/UserContext";
import { Flex, Link } from "../components/ui";
import { Input } from "../components/Forms";
import UkuleleChordDiagram from "../components/UkuleleChordDiagram";
import Lyrics from "../components/Lyrics";
import YouTubeEmbed from "../components/YouTubeEmbed";
import { Collapse, IconButton } from "@material-tailwind/react";

export default function SongPage() {
    const { slug } = useParams();
    const { user, toggleFavorite } = use(UserContext);
    const [song, setSong] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [numCols, setNumCols] = useState(3);
    const [showVideo, setShowVideo] = useState(false);
   
    const handleToggleVideo = () => setShowVideo(current => !current);

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
                    <Flex wrap>
                        <div className="grow">
                            <Flex className="mb-4">
                                {/* Favorite icon, title, edit button */}
                                {user?.isLoggedIn && (
                                    <IconButton
                                        className={`favorite-btn ${user?.favorites?.has(song.slug) ? "active" : ""}`}
                                        variant={user?.favorites?.has(song.slug) ? "filled" : "outlined"}
                                        onClick={() => toggleFavorite(song.slug)}
                                    >
                                        <i className={user?.favorites?.has(song.slug) ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                                    </IconButton>
                                )}
                                <div>
                                    <h2 className="leading-[1.142857143]">{song.title}</h2>
                                    <p className="artist">{song.artist}</p>
                                </div>
                                {user?.isLoggedIn ? (
                                    <div className="pt-2">
                                        {(song.isOwner || user?.userId === song.ownerUserId) ? (
                                            <>
                                                {!song.isPublic ? (
                                                    <>
                                                        <i className="fa-solid fa-eye-slash" />
                                                        {' '}
                                                        <span>Private</span>
                                                        {' '}
                                                    </>
                                                ) : null}
                                                <Link to={`/song/${song.slug}/edit`}>
                                                    <i className="fa-solid fa-pencil mr-1"></i>
                                                    Edit
                                                </Link>
                                            </>
                                        ) : (
                                            <Link to={`/song/${song.slug}/fork`}>
                                                <i className="fa-regular fa-clone mr-1"></i>
                                                Clone
                                            </Link>
                                        )}
                                    </div>
                                ) : null}
                            </Flex>

                            <p>
                                Submitted by: {' '}
                                {song.screenName || "Unknown"} • {new Date(song.updatedAt).toLocaleDateString()}
                            </p>

                            {song.capo ? <p>Capo: {song.capo}</p> : null}

                            {song.notes && <p>{song.notes}</p>}

                            {/* {song.originalSlug ? <p className="song-note">Forked from: {song.originalSlug}</p> : null}
                            <div className="song-info">
                                <span>
                                    <strong>Key:</strong> {song.key}
                                </span>
                                <span>
                                    <strong>Capo:</strong> {song.capo}
                                </span>
                            </div> */}
                        </div>

                        <div className="grow">
                            <h3>Chords</h3>
                            <Flex gap="gap-2" className="mb-4">
                                {song.chords.map((chord) => (
                                    <UkuleleChordDiagram key={chord} chord={chord} />
                                ))}
                            </Flex>
                        </div>
                    </Flex>

                    {song.youtube && (    
                        <div className="mb-6 w-full md:w-1/2">
                            <h3 role="button" aria-expanded={showVideo} onClick={handleToggleVideo}>
                                <i className="fa fa-video"></i>
                                <span> Video </span>
                                <i className={showVideo ? 'fa fa-caret-down' : 'fa fa-caret-up'}></i>
                            </h3>
                            <Collapse open={showVideo} className="relative aspect-video bg-black overflow-hidden">
                                <YouTubeEmbed videoId={song.youtube} />
                            </Collapse>
                        </div>
                    )}

                    <div>
                        <Flex className="justify-between">
                            <h3>Lyrics</h3>
                            <Input type="number" label="# Columns" value={numCols} min="1" max="6" onChange={(e) => setNumCols(e.target.value)} />
                        </Flex>
                        <Lyrics columns={numCols}>{song.lyrics}</Lyrics>
                    </div>
                </section>
            ) : null}
        </>
    );
}
