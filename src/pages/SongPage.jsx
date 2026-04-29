import { use, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { UserContext } from "../context/UserContext";
import { Button, Link } from "../components/ui";
import UkuleleChordDiagram from "../components/UkuleleChordDiagram";

export default function SongPage() {
    const { songId } = useParams();
    const { user, toggleFavorite } = use(UserContext);
    const [song, setSong] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        async function loadSong() {
            setIsLoading(true);
            setLoadError("");
            try {
                const data = await apiRequest(`/api/songs/${encodeURIComponent(songId)}`);
                setSong(data);
            } catch (error) {
                setLoadError(error.message || "Failed to load song");
                setSong(null);
            } finally {
                setIsLoading(false);
            }
        }

        loadSong();
    }, [songId]);

    const formatSong = (lyrics) => {
        // TODO: build this with JSX rather than dangerously set HTML string

        // split into parts/verses
        const parts = lyrics.split('\n\n');

        // wrap each part/verse/tablature in a div
        const wrappedParts = parts.map(str => {
            let wrapThisPart = true;

            // add non-breaking spaces to keep chords spaced out
            str = str.replace(/(\x20\x20)/g, ' &nbsp;');

            // wrap tablature in a tabs div. Tabs are denoted by [|...|]
            str = str.replace(/\[\|\n?([\s\S]+?)\n?\|\]/g, (match, value) => {
                wrapThisPart = false;
                return `<div class="tabs">${value.replace(/(?:\r\n|\r|\n)/g, "<br />")}</div>`;
            });

            // wrap comments in a comments div. Comments are denoted by [(...)]
            str = str.replace(/\[\((.+?)\)\]/g, function (match, value) {
                wrapThisPart = true;
                return `<div class="comment">${value}</div>`;
            });
        
            // wrap any lines that don't already start and end with a tag.
            str = str.replace(/^([^<].+[^>])$/gm, function (match, value) {
                wrapThisPart = true;
                return `<div class="line">${value}</div>`;
            });
        
            return wrapThisPart ? `<div class="part">${str}</div>` : str;
        });
        
        let str = wrappedParts.join("\n");

        // wrap chords in a chord div. Chords are denoted by [...]
        str = str.replace(/\[(\w+?)\]/g, function (match, value) {
            return `<div class="chord">${value}</div>`;
        });

        return str;
    };

    return (
        <>
            {isLoading ? <p>Loading song...</p> : null}
            {loadError ? <p role="alert">Could not load song: {loadError}</p> : null}

            {song && !isLoading ? (
                <section className="details">
                    <h2>{song.title}</h2>
                    <p className="artist">{song.artist}</p>
                    {song.originalSongId ? <p className="song-note">Forked from: {song.originalSongId}</p> : null}
                    <div className="song-info">
                        <span>
                            <strong>Key:</strong> {song.key}
                        </span>
                        <span>
                            <strong>Capo:</strong> {song.capo}
                        </span>
                    </div>
                    {user?.isLoggedIn ? (
                        <div className="song-actions flex gap-2">
                            <Button
                                type="button"
                                className={`favorite-btn ${user?.favorites?.has(song.id) ? "active" : ""}`}
                                onClick={() => toggleFavorite(song.id)}
                            >
                                {user?.favorites?.has(song.id) ? "★ Favorited" : "☆ Add Favorite"}
                            </Button>
                            {song.canEdit ? (
                                <Link variant="button-primary" className="action-link" to={`/song/${song.id}/edit`}>Edit Song</Link>
                            ) : (
                                <Link variant="button-primary" className="action-link" to={`/song/${song.id}/fork`}>Fork and Edit</Link>
                            )}
                        </div>
                    ) : null}

                    <h3>Chords</h3>
                    <div className="chord-tags flex gap-2">
                        {song.chords.map((chord) => (
                            <UkuleleChordDiagram key={chord} chord={chord} />
                        ))}
                    </div>

                    <h3>Lyrics</h3>
                    <div className="song" dangerouslySetInnerHTML={{ __html: formatSong(song.lyrics) }} />
                </section>
            ) : null}
        </>
    );
}
