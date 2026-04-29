import { CHORD_SHAPES } from "../data/chordShapes";

/**
 * Ukulele Chord Fingering Diagram SVG
 * 
 * @param {Object} props - The component props.
 * @param {string} props.chord - The chord name.
 * @param {string} props.fingering - optional fingering shape that will override the shape matching the chord name. Should be 4 digits representing the four strings, and the fret number being held.
 * @param {number} props.width - the width of the svg.
 * @param {number} props.height - the height of the svg.
 * @param {number} props.hPadding - the horizontal padding of the fretboard within the svg.
 * @returns An SVG diagram showing the fingering of the specified chord.
 */
export default function UkuleleChordDiagram({ chord, fingering, width = 60, height = 116, hPadding = 6 }) {
    const strings = 4;
    const maxFret = 4;
    const top = 36; // enough room for the chord name and the open / muted strings
    const stringSpacing = (width - hPadding - hPadding) / (strings - 1); // 16;
    const fretBoardWidth = (strings - 1) * stringSpacing;
    const fretBoardHeight = height - top; // 80;
    const shape = fingering ?? CHORD_SHAPES[chord]?.[0] ?? "0000";
    const shapeArr = shape.split('').map(Number);

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

            {/* Frets */}
            {[0, 1, 2, 3, 4].map((fret) => {
                const y = top + (fret / maxFret) * fretBoardHeight;
                const width = fret === 0 ? 4 : 1;
                return <line
                    key={`fret-${fret}`}
                    x1={hPadding}
                    y1={y}
                    x2={hPadding + fretBoardWidth}
                    y2={y}
                    strokeWidth={width}
                    className={fret === 0 ? "chord-nut" : "chord-fret"}
                />
            })}

            {/* Strings */}
            {[0, 1, 2, 3].map((stringIndex) => {
                const x = hPadding + stringIndex * stringSpacing;
                const widths = [1.4, 2, 1.7, 1.1];
                return <line
                    key={`string-${stringIndex}`}
                    x1={x}
                    y1={top}
                    x2={x}
                    y2={top + fretBoardHeight}
                    strokeWidth={widths[stringIndex]}
                    className="chord-string"
                />
            })}

            {/* Notes */}
            {shapeArr.map((fret, index) => {
                const x = hPadding + index * stringSpacing;
                let y = top - 10; // above fretboard

                if (fret === 0) {
                    return <circle key={`marker-open-${index}`} cx={x} cy={y} r="4" className="chord-open-marker" />;
                }

                if (typeof fret === "number" && fret > 0) {
                    y = top + ((fret - 0.5) / maxFret) * fretBoardHeight;
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
