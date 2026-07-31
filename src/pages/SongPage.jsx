import { use, useEffect, useState, Fragment } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { formatChordDisplay } from "../lib/chords";
import { UserContext } from "../context/UserContext";
import { Flex, Link } from "../components/ui";
import { Input, Option, Select, Switch } from "../components/Forms";
import UkuleleChordDiagram from "../components/UkuleleChordDiagram";
import Lyrics from "../components/Lyrics";
import YouTubeEmbed from "../components/YouTubeEmbed";
import { Collapse, IconButton } from "@material-tailwind/react";

const DEFAULT_NUM_COLS = 3;
const MAX_NUM_COLS = 6;

function ColumnsControl({numCols, setNumCols}) {
    const handleChange = (e) => {
        const value = e.target.value;
        if (isNaN(value)) {
            setNumCols(DEFAULT_NUM_COLS);
        } else if (value < 1) {
            setNumCols(1);
        } else if (value > MAX_NUM_COLS) {
            setNumCols(MAX_NUM_COLS);
        } else {
            setNumCols(value);
        }
    }
    const handleDecrement = () => {
        if (numCols > 1) {
            setNumCols(numCols - 1);
        }
    }
    const handleIncrement = () => {
        if (numCols < MAX_NUM_COLS) {
            setNumCols(numCols + 1);
        }
    }

    return (
        <Flex gap="gap-0">
            <IconButton
                className="rounded-r-none"
                onClick={handleDecrement}
                disabled={numCols <= 1}
            >
                <i className="fa fa-minus"></i>
            </IconButton>
            <Input
                type="number"
                aria-label="# Columns"
                value={numCols}
                min="1"
                max={MAX_NUM_COLS}
                onChange={handleChange}
                wrapperClassName="my-0 h-8"
                className="m-0 p-0 w-8 h-8 !rounded-none text-center no-spinners"
            />
            <IconButton
                className="rounded-l-none"
                onClick={handleIncrement}
                disabled={numCols >= MAX_NUM_COLS}
            >
                <i className="fa fa-plus"></i>
            </IconButton>
        </Flex>
    )
}

export default function SongPage() {
    const { slug } = useParams();
    const { user, toggleFavorite } = use(UserContext);
    const [song, setSong] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [numCols, setNumCols] = useState(DEFAULT_NUM_COLS);
    const [showVideo, setShowVideo] = useState(false);
    const [transpose, setTranspose] = useState(0);
    const userPreferredAccidentals =
        user?.preferredAccidentals === "sharps" ? "sharps" : "flats";
    const [preferredAccidentals, setPreferredAccidentals] = useState(userPreferredAccidentals);
   
    const handleToggleVideo = () => setShowVideo(current => !current);

    // Default to the user's saved preference (and re-apply when navigating songs).
    // Guests and users without a preference fall back to flats.
    useEffect(() => {
        setPreferredAccidentals(userPreferredAccidentals);
        setTranspose(0);
    }, [slug, userPreferredAccidentals]);

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
                            <Flex className="justify-between">
                                <h3>Chords</h3>
                                <Select
                                    label="Transpose"
                                    wrapperClassName="flex items-center gap-2 my-0"
                                    value={transpose === 0 ? "0" : transpose > 0 ? `+${transpose}` : String(transpose)}
                                    options={['+6', '+5', '+4', '+3', '+2', '+1', '0', '-1', '-2', '-3', '-4', '-5']}
                                    onChange={(e) => setTranspose(Number(e.target.value))}
                                />
                                <Switch
                                    option0="♯"
                                    option1="♭"
                                    checked={preferredAccidentals === 'flats'}
                                    onChange={(e) => {
                                        setPreferredAccidentals(e.target.checked ? 'flats' : 'sharps')
                                    }}
                                />
                            </Flex>
                            <Flex gap="gap-2" className="mb-4 flex-wrap">
                                {song.chords.map((chord) => (
                                    <UkuleleChordDiagram
                                        key={chord}
                                        chord={formatChordDisplay(chord, {
                                            transpose,
                                            preferredAccidentals,
                                        })}
                                    />
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
                            <ColumnsControl numCols={numCols} setNumCols={setNumCols} />
                        </Flex>
                        <Lyrics
                            columns={numCols}
                            transpose={transpose}
                            preferredAccidentals={preferredAccidentals}
                        >
                            {song.lyrics}
                        </Lyrics>
                    </div>
                </section>
            ) : null}
        </>
    );
}
