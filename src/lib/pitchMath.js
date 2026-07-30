/**
 * Pure pitch math for the chromatic tuner (A4 = 440 Hz).
 * Standard re-entrant ukulele open strings: G4, C4, E4, A4.
 */

import { OPEN_FREQUENCIES } from "./tabAudio.js";

export const A4_HZ = 440;
export const A4_MIDI = 69;

/** Default |cents| window considered "in tune". */
export const IN_TUNE_CENTS = 8;

/** Display window for the cents meter (±cents). */
export const CENTS_METER_RANGE = 50;

/** Note names in sharp spelling (MIDI pitch class 0 = C). */
export const NOTE_NAMES_SHARP = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

/** Open-string targets for standard re-entrant GCEA (string order for UI). */
export const UKULELE_OPEN_STRINGS = [
  { label: "G", note: "G4", frequency: OPEN_FREQUENCIES.G },
  { label: "C", note: "C4", frequency: OPEN_FREQUENCIES.C },
  { label: "E", note: "E4", frequency: OPEN_FREQUENCIES.E },
  { label: "A", note: "A4", frequency: OPEN_FREQUENCIES.A },
];

/**
 * Convert frequency (Hz) to MIDI note number (fractional).
 * @param {number} hz
 * @param {number} [a4Hz=A4_HZ]
 * @returns {number|null}
 */
export function frequencyToMidi(hz, a4Hz = A4_HZ) {
  const f = Number(hz);
  const a4 = Number(a4Hz);
  if (!Number.isFinite(f) || f <= 0 || !Number.isFinite(a4) || a4 <= 0) return null;
  return A4_MIDI + 12 * Math.log2(f / a4);
}

/**
 * MIDI note number → frequency (Hz).
 * @param {number} midi
 * @param {number} [a4Hz=A4_HZ]
 * @returns {number|null}
 */
export function midiToFrequency(midi, a4Hz = A4_HZ) {
  const m = Number(midi);
  const a4 = Number(a4Hz);
  if (!Number.isFinite(m) || !Number.isFinite(a4) || a4 <= 0) return null;
  return a4 * 2 ** ((m - A4_MIDI) / 12);
}

/**
 * Map frequency to nearest equal-tempered note.
 * @param {number} hz
 * @param {number} [a4Hz=A4_HZ]
 * @returns {{
 *   name: string,
 *   octave: number,
 *   midi: number,
 *   frequency: number,
 *   cents: number,
 *   label: string,
 * }|null}
 */
/**
 * Build note display info for a (possibly locked) integer MIDI + measured Hz.
 * @param {number} midi
 * @param {number} [hz] measured frequency for cents; defaults to exact pitch
 * @param {number} [a4Hz=A4_HZ]
 * @returns {{
 *   name: string,
 *   octave: number,
 *   midi: number,
 *   frequency: number,
 *   cents: number,
 *   label: string,
 * }|null}
 */
export function noteFromMidi(midi, hz, a4Hz = A4_HZ) {
  const m = Math.round(Number(midi));
  if (!Number.isFinite(m)) return null;
  const name = NOTE_NAMES_SHARP[((m % 12) + 12) % 12];
  const octave = Math.floor(m / 12) - 1;
  const targetHz = midiToFrequency(m, a4Hz);
  if (targetHz == null) return null;
  const measured = hz == null ? targetHz : Number(hz);
  const cents = Number.isFinite(measured) && measured > 0
    ? (centsBetween(measured, targetHz) ?? 0)
    : 0;
  return {
    name,
    octave,
    midi: m,
    frequency: targetHz,
    cents,
    label: `${name}${octave}`,
  };
}

export function frequencyToNote(hz, a4Hz = A4_HZ) {
  const midiExact = frequencyToMidi(hz, a4Hz);
  if (midiExact == null) return null;
  return noteFromMidi(Math.round(midiExact), hz, a4Hz);
}

/**
 * Hysteresis for displayed note: stay on the locked MIDI until the pitch
 * moves clearly toward another note for several consecutive updates.
 *
 * @param {{
 *   lockedMidi: number|null,
 *   candidateMidi: number|null,
 *   candidateCount: number,
 * }} state
 * @param {number} hz
 * @param {{
 *   holdSemitones?: number,
 *   switchConfirm?: number,
 *   a4Hz?: number,
 * }} [options]
 * @returns {{
 *   lockedMidi: number|null,
 *   candidateMidi: number|null,
 *   candidateCount: number,
 *   note: ReturnType<typeof noteFromMidi>|null,
 * }}
 */
export function advanceLockedNote(state, hz, options = {}) {
  const holdSemitones = options.holdSemitones ?? 0.55;
  const switchConfirm = options.switchConfirm ?? 4;
  const a4Hz = options.a4Hz ?? A4_HZ;
  const prev = state ?? { lockedMidi: null, candidateMidi: null, candidateCount: 0 };

  const exact = frequencyToMidi(hz, a4Hz);
  if (exact == null) {
    return {
      lockedMidi: prev.lockedMidi,
      candidateMidi: prev.candidateMidi,
      candidateCount: prev.candidateCount,
      note: prev.lockedMidi != null ? noteFromMidi(prev.lockedMidi, hz, a4Hz) : null,
    };
  }

  let lockedMidi = prev.lockedMidi;
  let candidateMidi = prev.candidateMidi;
  let candidateCount = prev.candidateCount;

  if (lockedMidi == null) {
    lockedMidi = Math.round(exact);
    candidateMidi = null;
    candidateCount = 0;
  } else if (Math.abs(exact - lockedMidi) < holdSemitones) {
    // Still closer to the locked note than halfway to a neighbor.
    candidateMidi = null;
    candidateCount = 0;
  } else {
    const next = Math.round(exact);
    if (candidateMidi === next) {
      candidateCount += 1;
    } else {
      candidateMidi = next;
      candidateCount = 1;
    }
    if (candidateCount >= switchConfirm) {
      lockedMidi = next;
      candidateMidi = null;
      candidateCount = 0;
    }
  }

  return {
    lockedMidi,
    candidateMidi,
    candidateCount,
    note: noteFromMidi(lockedMidi, hz, a4Hz),
  };
}

/**
 * Nearest open string with stickiness so the label doesn't thrash near midpoints.
 * @param {number} hz
 * @param {string|null|undefined} lockedLabel previous G|C|E|A
 * @param {number} [marginCents=25] require this many cents closer before switching
 * @returns {{
 *   label: string,
 *   note: string,
 *   frequency: number,
 *   cents: number,
 * }|null}
 */
export function stableNearestOpenString(hz, lockedLabel, marginCents = 25) {
  const nearest = nearestOpenString(hz);
  if (!nearest) return null;

  const locked = lockedLabel ? openStringByLabel(lockedLabel) : null;
  if (!locked) return nearest;

  const centsToLocked = centsBetween(hz, locked.frequency);
  if (centsToLocked == null) return nearest;

  const absLocked = Math.abs(centsToLocked);
  const absNearest = Math.abs(nearest.cents);
  // Keep the previous string unless the new one is clearly closer.
  if (nearest.label !== locked.label && absNearest + marginCents < absLocked) {
    return nearest;
  }
  return {
    label: locked.label,
    note: locked.note,
    frequency: locked.frequency,
    cents: centsToLocked,
  };
}

/**
 * Cents of `hz` relative to `targetHz` (positive = sharp).
 * @param {number} hz
 * @param {number} targetHz
 * @returns {number|null}
 */
export function centsBetween(hz, targetHz) {
  const f = Number(hz);
  const t = Number(targetHz);
  if (!Number.isFinite(f) || f <= 0 || !Number.isFinite(t) || t <= 0) return null;
  return 1200 * Math.log2(f / t);
}

/**
 * Nearest open ukulele string (G/C/E/A) by absolute cents distance.
 * @param {number} hz
 * @returns {{
 *   label: string,
 *   note: string,
 *   frequency: number,
 *   cents: number,
 * }|null}
 */
export function nearestOpenString(hz) {
  const f = Number(hz);
  if (!Number.isFinite(f) || f <= 0) return null;

  let best = null;
  for (const s of UKULELE_OPEN_STRINGS) {
    const cents = centsBetween(f, s.frequency);
    if (cents == null) continue;
    const abs = Math.abs(cents);
    if (!best || abs < best.abs) {
      best = { ...s, cents, abs };
    }
  }
  if (!best) return null;
  return {
    label: best.label,
    note: best.note,
    frequency: best.frequency,
    cents: best.cents,
  };
}

/**
 * Open-string target by label (G|C|E|A).
 * @param {string} label
 * @returns {{ label: string, note: string, frequency: number }|null}
 */
export function openStringByLabel(label) {
  const key = String(label ?? "").toUpperCase();
  return UKULELE_OPEN_STRINGS.find((s) => s.label === key) ?? null;
}

/**
 * @param {number|null|undefined} cents
 * @param {number} [window=IN_TUNE_CENTS]
 * @returns {boolean}
 */
export function isInTune(cents, window = IN_TUNE_CENTS) {
  if (cents == null) return false;
  const c = Number(cents);
  const w = Number(window);
  if (!Number.isFinite(c) || !Number.isFinite(w) || w < 0) return false;
  return Math.abs(c) <= w;
}

/**
 * Clamp cents for meter display.
 * @param {number} cents
 * @param {number} [range=CENTS_METER_RANGE]
 * @returns {number}
 */
export function clampCentsForMeter(cents, range = CENTS_METER_RANGE) {
  const c = Number(cents);
  const r = Number(range);
  if (!Number.isFinite(c) || !Number.isFinite(r) || r <= 0) return 0;
  return Math.max(-r, Math.min(r, c));
}

/**
 * Tuning status from cents deviation.
 * @param {number|null|undefined} cents
 * @param {number} [window=IN_TUNE_CENTS]
 * @returns {"idle"|"flat"|"in-tune"|"sharp"}
 */
export function tuningStatus(cents, window = IN_TUNE_CENTS) {
  // Avoid Number(null) === 0 treating "no reading" as perfect pitch.
  if (cents == null || cents === "") return "idle";
  const c = Number(cents);
  if (!Number.isFinite(c)) return "idle";
  if (isInTune(c, window)) return "in-tune";
  return c < 0 ? "flat" : "sharp";
}
