import { CHORD_SHAPES } from "../data/chordShapes";

function notePosition(fret, index, spacing, top, maxFret) {
  if (typeof fret !== "number" || fret <= 0) {
    return null;
  }

  const x = 24 + index * spacing;
  const y = top + ((fret - 0.5) / maxFret) * 95;
  return { x, y };
}

export default function UkuleleChordDiagram({ chord, fingering, width = 104, height = 170 }) {
  const strings = 4;
  const maxFret = 4;
  const spacing = 18;
  const top = 58;
  const diagramHeight = 95;
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
      <text x={width / 2} y="22" textAnchor="middle" className="chord-name">
        {chord}
      </text>

      {shape.map((fret, index) => {
        const x = 24 + index * spacing;
        if (fret === 0) {
          return <circle key={`marker-open-${index}`} cx={x} cy="39" r="4.2" className="chord-open-marker" />;
        }

        if (typeof fret === "string" && fret.toUpperCase() === "X") {
          return (
            <text key={`marker-muted-${index}`} x={x} y="42" textAnchor="middle" className="chord-marker">
              X
            </text>
          );
        }

        return null;
      })}

      {[0, 1, 2, 3].map((stringIndex) => (
        <line
          key={`string-${stringIndex}`}
          x1={24 + stringIndex * spacing}
          y1={top}
          x2={24 + stringIndex * spacing}
          y2={top + diagramHeight}
          className="chord-string"
        />
      ))}

      {[0, 1, 2, 3, 4].map((fret) => (
        <line
          key={`fret-${fret}`}
          x1="24"
          y1={top + (fret / maxFret) * diagramHeight}
          x2={24 + (strings - 1) * spacing}
          y2={top + (fret / maxFret) * diagramHeight}
          className={fret === 0 ? "chord-nut" : "chord-fret"}
        />
      ))}

      {shape.map((fret, index) => {
        const pos = notePosition(fret, index, spacing, top, maxFret);
        if (!pos) {
          return null;
        }

        return <circle key={`dot-${index}`} cx={pos.x} cy={pos.y} r="5.3" className="chord-dot" />;
      })}
    </svg>
  );
}
