import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { Flex } from "../components/ui";
import { Form, Input, Textarea } from "../components/Forms";
import SongEditor from "../components/SongEditor";
import Lyrics from "../components/Lyrics";
// import { Button } from "@material-tailwind/react";
import {
    Button,
    Card,
    Collapse,
    Switch
} from "@material-tailwind/react";

function formatSongForForm(song) {
    return {
        title: song?.title ?? "",
        artist: song?.artist ?? "",
        key: song?.key ?? "",
        capo: song?.capo ?? "",
        notes: song?.notes ?? "",
        youtube: song?.youtube ?? "",
        lyrics: song?.lyrics && (typeof song.lyrics === "string" ? song.lyrics : (song.lyrics ?? []).join("\n")),
        isPublic: song?.isPublic ?? false
    };
}

export default function SongEditorPage({ mode }) {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(formatSongForForm(null));
    const [isLoading, setIsLoading] = useState(mode !== "new");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [syntaxHelpOpen, setSyntaxHelpOpen] = useState(0);

    const title = useMemo(() => {
        if (mode === "new") return "Add Song";
        if (mode === "fork") return "Fork and Edit Song";
        return "Edit Song";
    }, [mode]);

    useEffect(() => {
        if (mode === "new") {
            setForm(formatSongForForm(null));
            setIsLoading(false);
            return;
        }

        async function loadSong() {
            setIsLoading(true);
            setError("");
            try {
                const song = await apiRequest(`/api/songs/${encodeURIComponent(slug)}`);
                // if mode === "fork" set isPublic to false
                if (mode === "fork") {
                    setForm(formatSongForForm({...song, isPublic: false}));
                } else {
                    setForm(formatSongForForm(song));
                }
            } catch (loadError) {
                setError(loadError.message || "Failed to load song");
            } finally {
                setIsLoading(false);
            }
        }

        loadSong();
    }, [mode, slug]);

    const handleSyntaxToggle = () => setSyntaxHelpOpen((currentValue) => !currentValue);
 

    function updateField(name, value) {
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function findChords(lyrics) {
        const regex = /\[([A-G][24679abdgijmsu]*?)\]/g; // Matches content inside []
        const matches = lyrics.match(regex);
        const chordSet = new Set();
        if (matches) {
            matches.map((c) => {
                // remove the [] and add it to the set
                chordSet.add(c.replace(/[\[\]]/g, ''))
            });
        }
        return [...chordSet];
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setIsSaving(true);
        const chordsInSong = findChords(form.lyrics);

        const payload = {
            title: form.title.trim(),
            artist: form.artist.trim(),
            key: form.key.trim(),
            capo: form.capo,
            notes: form.notes,
            youtube: form.youtube ? form.youtube.trim() : "",
            chords: chordsInSong,
            lyrics: form.lyrics,
            isPublic: form.isPublic
        };

        try {
            let savedSong;
            if (mode === "new") {
                // NEW
                savedSong = await apiRequest("/api/songs", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
            } else if (mode === "fork") {
                // DUPLICATE
                savedSong = await apiRequest(`/api/songs/${encodeURIComponent(slug)}/fork`, {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
            } else {
                // EDIT
                savedSong = await apiRequest(`/api/songs/${encodeURIComponent(slug)}`, {
                    method: "PUT",
                    body: JSON.stringify(payload)
                });
            }
            navigate(`/song/${savedSong.slug}/edit`);
        } catch (saveError) {
            setError(saveError.message || "Failed to save song");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <>
            <h2>{title}</h2>

            {isLoading ? <p>Loading song...</p> : null}
            {error ? <p role="alert">{error}</p> : null}

            {!isLoading ? (
                <Flex wrap className="w-full">
                    <section className="grow-0">
                        <Form className="song-form" onSubmit={handleSubmit}>
                            <Input id="song-title" label="Title" value={form.title} onChange={(event) => updateField("title", event.target.value)} required />

                            <Input id="song-artist" label="Artist" value={form.artist} onChange={(event) => updateField("artist", event.target.value)} required />

                            {/* <Input id="song-key" label="Key" value={form.key} onChange={(event) => updateField("key", event.target.value)} /> */}

                            <Textarea
                                className="w-xs"
                                id="song-notes"
                                label="Notes"
                                value={form.notes}
                                rows={3}
                                onChange={(event) => updateField("notes", event.target.value)}
                            />

                            <Input
                                id="song-capo"
                                type="number"
                                label="Capo"
                                value={form.capo}
                                min="0"
                                onChange={(event) => updateField("capo", event.target.value)}
                            />

                            <Input
                                id="song-youtube"
                                label="YouTube Video"
                                value={form.youtube}
                                placeholder="https://youtu.be/... or video ID"
                                onChange={(event) => updateField("youtube", event.target.value)}
                            />

                            <Textarea
                                className="font-mono w-xs"
                                id="song-lyrics"
                                label="Lyrics"
                                value={form.lyrics}
                                rows={10}
                                onChange={(event) => updateField("lyrics", event.target.value)}
                            />

                            <Button color="secondary"
                                onClick={handleSyntaxToggle}
                                className={syntaxHelpOpen ? "rounded-b-none" : null}
                            >Lyrics Markup Syntax</Button>
                            <Collapse open={syntaxHelpOpen} className="w-xs mb-4">
                                <Card className="rounded-tl-none">
                                    <table className="border-separate border-spacing-4 w-full">
                                        <tbody>
                                            <tr className="align-top"><td>Chord</td><td><code><strong className="text-orange-400">[</strong>C<strong className="text-orange-400">]</strong></code></td></tr>
                                            <tr className="align-top"><td>Comment line</td><td><code><strong className="text-orange-400">[(</strong>Comment<strong className="text-orange-400">)]</strong></code></td></tr>
                                            <tr className="align-top"><td>Tablature block</td><td><code className="block leading-none"><strong className="text-orange-400">[|</strong><br />
                                                A|-------------<br />
                                                E|-------------<br />
                                                C|-------------<br />
                                                G|-------------<br />
                                            <strong className="text-orange-400">|]</strong></code></td></tr>
                                        </tbody>
                                    </table>
                                </Card>
                            </Collapse>

                            <Flex className="mb-4">
                                <span>Private</span>
                                <Switch
                                    color="teal"
                                    checked={!!form.isPublic}
                                    onChange={(event) => updateField("isPublic", event.target.checked)}
                                />
                                <span>Public</span>
                            </Flex>

                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Song"}
                            </Button>
                            {slug && (
                                <div className="mt-2">
                                    <Link to={`/song/${slug}`}>View Song Page</Link>
                                </div>
                            )}
                        </Form>
                    </section>

                    <section className="grow">
                        <Lyrics>{form.lyrics}</Lyrics>
                    </section>

                    <section className="grow">
                        <SongEditor
                            lyrics={form.lyrics}
                            onChange={(lyrics) => updateField("lyrics", lyrics)}
                        />
                    </section>
                </Flex>
            ) : null}
        </>
    );
}
