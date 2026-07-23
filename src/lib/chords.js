/**
 * Chord name helpers for client-side display (transpose, etc.).
 * Does not mutate stored song data.
 */

const NOTE_TO_INDEX = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

/** Prefer flats for black keys (matches CHORD_SHAPES keys). */
const INDEX_TO_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const INDEX_TO_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * Normalize semitone offset into 0..11 range (handles negatives).
 * @param {number} semitones
 * @returns {number}
 */
export function normalizeSemitones(semitones) {
  const n = Number(semitones);
  if (!Number.isFinite(n)) return 0;
  return ((Math.trunc(n) % 12) + 12) % 12;
}

/**
 * Parse a single pitch class token (root or bass note).
 * @param {string} token
 * @returns {{ index: number, accidental: 'sharp' | 'flat' | 'natural' } | null}
 */
function parsePitch(token) {
  if (!token || typeof token !== "string") return null;
  const m = token.trim().match(/^([A-Ga-g])([#b♯♭]?)/);
  if (!m) return null;

  const letter = m[1].toUpperCase();
  let accidentalChar = m[2] || "";
  if (accidentalChar === "♯") accidentalChar = "#";
  if (accidentalChar === "♭") accidentalChar = "b";

  const name = letter + accidentalChar;
  const index = NOTE_TO_INDEX[name];
  if (index === undefined) return null;

  let accidental = "natural";
  if (accidentalChar === "#") accidental = "sharp";
  else if (accidentalChar === "b") accidental = "flat";

  return { index, accidental };
}

/**
 * Format a pitch class index using the preferred accidental style.
 * @param {number} index 0..11
 * @param {'sharp' | 'flat' | 'natural'} style
 * @returns {string}
 */
function formatPitch(index, style) {
  const i = ((index % 12) + 12) % 12;
  if (style === "sharp") return INDEX_TO_SHARP[i];
  // natural or flat: prefer flats for black keys (CHORD_SHAPES)
  return INDEX_TO_FLAT[i];
}

/**
 * Transpose a single chord token (no slash). Returns null if not a chord.
 * @param {string} token
 * @param {number} semitones
 * @returns {string | null}
 */
function transposeSimpleChord(token, semitones) {
  if (!token || typeof token !== "string") return null;
  const trimmed = token.trim();
  if (!trimmed) return null;

  // Root: letter + optional accidental, rest is quality/suffix
  const m = trimmed.match(/^([A-Ga-g])([#b♯♭]?)(.*)$/);
  if (!m) return null;

  const pitch = parsePitch(m[1] + m[2]);
  if (!pitch) return null;

  // Reject tokens that don't look like chord roots (e.g. bare frets)
  // Already matched A-G; suffix may be anything (m7, sus4, maj7, …)

  const offset = Number(semitones);
  if (!Number.isFinite(offset) || Math.trunc(offset) === 0) {
    // Still normalize spelling of root letter case
    const root = formatPitch(pitch.index, pitch.accidental);
    return root + m[3];
  }

  const newIndex = (pitch.index + Math.trunc(offset) + 1200) % 12;
  const root = formatPitch(newIndex, pitch.accidental);
  return root + m[3];
}

/**
 * Transpose a chord name by a number of semitones.
 * Supports roots with #/b, common suffixes, and slash chords (G/B).
 * Unknown / non-chord strings are returned unchanged.
 *
 * @param {string} name
 * @param {number} semitones
 * @returns {string}
 */
export function transposeChord(name, semitones) {
  if (name == null) return name;
  const raw = String(name);
  if (!raw.trim()) return raw;

  // Comments or parenthetical labels used in lyrics markup
  if (raw.startsWith("(") || raw.includes("(")) return raw;

  const offset = Number(semitones);
  if (!Number.isFinite(offset) || Math.trunc(offset) === 0) {
    // Still normalize slash parts if needed; identity path keeps string mostly as-is
    // except we re-emit through transposeSimple for consistent letter casing when offset 0
    // Prefer true identity for offset 0 to avoid surprising renames (Db vs C#).
    return raw;
  }

  const slashIndex = raw.indexOf("/");
  if (slashIndex === -1) {
    const result = transposeSimpleChord(raw, offset);
    return result ?? raw;
  }

  const main = raw.slice(0, slashIndex);
  const bass = raw.slice(slashIndex + 1);
  const transposedMain = transposeSimpleChord(main, offset);
  if (transposedMain == null) return raw;

  const bassTrim = bass.trim();
  if (!bassTrim) return transposedMain + "/";

  const transposedBass = transposeSimpleChord(bassTrim, offset);
  if (transposedBass == null) return transposedMain + "/" + bass;

  return `${transposedMain}/${transposedBass}`;
}

/**
 * Normalize preferred accidentals option to a formatPitch style.
 * @param {'sharps' | 'flats' | 'sharp' | 'flat' | string} preferred
 * @returns {'sharp' | 'flat'}
 */
function preferredToStyle(preferred) {
  if (preferred === "sharps" || preferred === "sharp") return "sharp";
  return "flat";
}

/**
 * Respell a simple chord token's root using preferred accidental style (ASCII #/b).
 * @param {string} token
 * @param {'sharp' | 'flat'} style
 * @returns {string | null}
 */
function spellSimpleChord(token, style) {
  if (!token || typeof token !== "string") return null;
  const trimmed = token.trim();
  if (!trimmed) return null;

  const m = trimmed.match(/^([A-Ga-g])([#b♯♭]?)(.*)$/);
  if (!m) return null;

  const pitch = parsePitch(m[1] + m[2]);
  if (!pitch) return null;

  const root = formatPitch(pitch.index, style);
  return root + m[3];
}

/**
 * Respell chord roots (and bass notes) to prefer sharps or flats.
 * Display-only helper; does not mutate stored song data.
 * Returns ASCII accidentals (# / b).
 *
 * @param {string} name
 * @param {'sharps' | 'flats' | 'sharp' | 'flat'} [preferred='flats']
 * @returns {string}
 */
export function spellChord(name, preferred = "flats") {
  if (name == null) return name;
  const raw = String(name);
  if (!raw.trim()) return raw;

  // Comments or parenthetical labels used in lyrics markup
  if (raw.startsWith("(") || raw.includes("(")) return raw;

  const style = preferredToStyle(preferred);

  const slashIndex = raw.indexOf("/");
  if (slashIndex === -1) {
    return spellSimpleChord(raw, style) ?? raw;
  }

  const main = raw.slice(0, slashIndex);
  const bass = raw.slice(slashIndex + 1);
  const spelledMain = spellSimpleChord(main, style);
  if (spelledMain == null) return raw;

  const bassTrim = bass.trim();
  if (!bassTrim) return spelledMain + "/";

  const spelledBass = spellSimpleChord(bassTrim, style);
  if (spelledBass == null) return spelledMain + "/" + bass;

  return `${spelledMain}/${spelledBass}`;
}

/**
 * Replace ASCII pitch accidentals with typographic ♯ / ♭ for display.
 * Only rewrites letter + accidental (root/bass), not quality suffixes like b9.
 *
 * @param {string} name
 * @returns {string}
 */
export function prettyPrintChord(name) {
  if (name == null) return name;
  return String(name)
    .replace(/([A-G])#/g, "$1♯")
    .replace(/([A-G])b/g, "$1♭");
}

/**
 * Lookup key for CHORD_SHAPES (ASCII flat spellings).
 * Accepts sharp/flat and ♯/♭ forms.
 *
 * @param {string} name
 * @returns {string}
 */
export function chordShapeKey(name) {
  if (name == null) return name;
  return spellChord(String(name), "flats");
}

/**
 * Full display pipeline: transpose → preferred spelling → pretty accidentals.
 * Purely cosmetic; does not change stored data.
 *
 * @param {string} name
 * @param {{ transpose?: number, preferredAccidentals?: 'sharps' | 'flats' }} [options]
 * @returns {string}
 */
export function formatChordDisplay(name, { transpose = 0, preferredAccidentals = "flats" } = {}) {
  const transposed = transposeChord(name, transpose);
  const spelled = spellChord(transposed, preferredAccidentals);
  return prettyPrintChord(spelled);
}
