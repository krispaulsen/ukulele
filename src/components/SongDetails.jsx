import UkuleleChordDiagram from "./UkuleleChordDiagram";

export default function SongDetails({ song, actions }) {
  if (!song) {
    return (
      <section className="details">
        <p>Select a song to view chords and lyrics.</p>
      </section>
    );
  }

  return (
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
      {actions ? <div className="song-actions">{actions}</div> : null}

      <h3>Chords</h3>
      <div className="chord-tags">
        {song.chords.map((chord) => (
          <UkuleleChordDiagram key={chord} chord={chord} />
        ))}
      </div>

      <h3>Lyrics</h3>
      <pre className="lyrics">{song.lyrics.map((line) => line).join("\n")}</pre>
    </section>
  );
}
