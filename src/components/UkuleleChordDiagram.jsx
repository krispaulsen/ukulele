import { CHORD_SHAPES } from "../data/chordShapes";

export default function UkuleleChordDiagram({ chord, fingering, width = 74, height = 140 }) {
  const strings = 4;
  const maxFret = 4;
  const spacing = 20;
  const top = 36;
  const hPadding = 7;
  const diagramHeight = 100;
  const shape = fingering ?? CHORD_SHAPES[chord] ?? [0, 0, 0, 0];

  return (
    <svg
      className="chord-diagram"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`${chord} ukulele chord`}
    >
      <text x={width / 2} y="12" textAnchor="middle" className="chord-name">
        {chord}
      </text>

      {/* Strings */}
      {[0, 1, 2, 3].map((stringIndex) => {
        const x = hPadding + stringIndex * spacing;
        return <line
            key={`string-${stringIndex}`}
            x1={x}
            y1={top}
            x2={x}
            y2={top + diagramHeight}
            className="chord-string"
          />
      })}

      {/* Frets */}
      {[0, 1, 2, 3, 4].map((fret) => {
        const y = top + (fret / maxFret) * diagramHeight;
        return <line
          key={`fret-${fret}`}
          x1={hPadding}
          y1={y}
          x2={hPadding + (strings - 1) * spacing}
          y2={y}
          className={fret === 0 ? "chord-nut" : "chord-fret"}
        />
      })}

      {/* Notes */}
      {shape.map((fret, index) => {
        const x = hPadding + index * spacing;
        let y = 26;
        
        if (fret === 0) {
          return <circle key={`marker-open-${index}`} cx={x} cy={y} r="4" className="chord-open-marker" />;
        }
        
        if (typeof fret === "number" && fret > 0) {
          y = top + ((fret - 0.5) / maxFret) * 100;
          return <circle key={`dot-${index}`} cx={x} cy={y} r="6" className="chord-dot" />;
        }

        if (typeof fret === "string" && fret.toLowerCase() === "x") {
          return <text key={`marker-muted-${index}`} x={x} y={y} textAnchor="middle" className="chord-marker">×</text>;
        }

        return null;
      })}
    </svg>
  );
}
