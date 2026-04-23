import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";

function formatSongForForm(song) {
  return {
    title: song?.title ?? "",
    artist: song?.artist ?? "",
    key: song?.key ?? "C",
    capo: String(song?.capo ?? 0),
    chords: (song?.chords ?? []).join(", "),
    lyrics: (song?.lyrics ?? []).join("\n")
  };
}

export default function SongEditorPage({ mode }) {
  const { songId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(formatSongForForm(null));
  const [sourceSong, setSourceSong] = useState(null);
  const [isLoading, setIsLoading] = useState(mode !== "new");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const title = useMemo(() => {
    if (mode === "new") return "Add Song";
    if (mode === "fork") return "Fork and Edit Song";
    return "Edit Song";
  }, [mode]);

  useEffect(() => {
    if (mode === "new") {
      setForm(formatSongForForm(null));
      setSourceSong(null);
      setIsLoading(false);
      return;
    }

    async function loadSong() {
      setIsLoading(true);
      setError("");
      try {
        const song = await apiRequest(`/api/songs/${encodeURIComponent(songId)}`);
        setSourceSong(song);
        setForm(formatSongForForm(song));
      } catch (loadError) {
        setError(loadError.message || "Failed to load song");
      } finally {
        setIsLoading(false);
      }
    }

    loadSong();
  }, [mode, songId]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const payload = {
      title: form.title.trim(),
      artist: form.artist.trim(),
      key: form.key.trim(),
      capo: Number(form.capo),
      chords: form.chords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      lyrics: form.lyrics
        .split("\n")
        .map((line) => line.trimEnd())
        .filter((line) => line.length > 0)
    };

    try {
      let savedSong;
      if (mode === "new") {
        savedSong = await apiRequest("/api/songs", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      } else if (mode === "fork") {
        savedSong = await apiRequest(`/api/songs/${encodeURIComponent(songId)}/fork`, {
          method: "POST",
          body: JSON.stringify(payload)
        });
      } else {
        savedSong = await apiRequest(`/api/songs/${encodeURIComponent(songId)}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      }
      navigate(`/song/${savedSong.id}`);
    } catch (saveError) {
      setError(saveError.message || "Failed to save song");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="details page-panel">
      <Link to={sourceSong ? `/song/${sourceSong.id}` : "/"} className="back-link">
        ← Back
      </Link>
      <h2>{title}</h2>
      {isLoading ? <p>Loading song...</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      {!isLoading ? (
        <form className="song-form" onSubmit={handleSubmit}>
          <label htmlFor="song-title">Title</label>
          <input id="song-title" value={form.title} onChange={(event) => updateField("title", event.target.value)} required />

          <label htmlFor="song-artist">Artist</label>
          <input id="song-artist" value={form.artist} onChange={(event) => updateField("artist", event.target.value)} required />

          <label htmlFor="song-key">Key</label>
          <input id="song-key" value={form.key} onChange={(event) => updateField("key", event.target.value)} />

          <label htmlFor="song-capo">Capo</label>
          <input
            id="song-capo"
            type="number"
            min="0"
            value={form.capo}
            onChange={(event) => updateField("capo", event.target.value)}
          />

          <label htmlFor="song-chords">Chords (comma-separated)</label>
          <input id="song-chords" value={form.chords} onChange={(event) => updateField("chords", event.target.value)} />

          <label htmlFor="song-lyrics">Lyrics (one line per row)</label>
          <textarea id="song-lyrics" rows={10} value={form.lyrics} onChange={(event) => updateField("lyrics", event.target.value)} />

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Song"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
