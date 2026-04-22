import UkuleleChordDiagram from "./UkuleleChordDiagram";

export default function SongDetails({ song }) {
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
      <div className="song-info">
        <span>
          <strong>Key:</strong> {song.key}
        </span>
        <span>
          <strong>Capo:</strong> {song.capo}
        </span>
      </div>

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
