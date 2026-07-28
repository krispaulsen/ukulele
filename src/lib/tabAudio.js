/**
 * Web Audio helpers for ukulele tab playback.
 * Standard re-entrant tuning: G4, C4, E4, A4.
 */

import { TAB_STRINGS } from "./tabs.js";

/** Open-string frequencies (Hz) by string label. */
export const OPEN_FREQUENCIES = {
  G: 392.0,
  C: 261.63,
  E: 329.63,
  A: 440.0,
};

/**
 * Frequency for a fretted note.
 * @param {string} stringLabel A|E|C|G
 * @param {number} fret
 * @returns {number|null}
 */
export function fretToFrequency(stringLabel, fret) {
  const open = OPEN_FREQUENCIES[String(stringLabel ?? "").toUpperCase()];
  if (!open || !Number.isFinite(fret) || fret < 0) return null;
  return open * 2 ** (Math.trunc(fret) / 12);
}

/**
 * Notes to pluck for one step of a tab model.
 * @param {{ steps: (number|null)[][] }} model
 * @param {number} stepIndex
 * @returns {{ stringLabel: string, fret: number, frequency: number }[]}
 */
export function columnNotes(model, stepIndex) {
  const col = model?.steps?.[stepIndex];
  if (!col) return [];
  const notes = [];
  for (let si = 0; si < TAB_STRINGS.length; si++) {
    const fret = col[si];
    if (fret === null || fret === undefined || !Number.isFinite(fret)) continue;
    const stringLabel = TAB_STRINGS[si];
    const frequency = fretToFrequency(stringLabel, fret);
    if (frequency == null) continue;
    notes.push({ stringLabel, fret: Math.trunc(fret), frequency });
  }
  return notes;
}

/** Eighth-note step duration from quarter-note BPM. */
export function stepDurationMs(bpm, subdivision = 4) {
  const b = Number(bpm);
  const safeBpm = Number.isFinite(b) && b > 0 ? b : 120;
  const sub = Number.isFinite(subdivision) && subdivision > 0 ? subdivision : 2;
  return 60000 / safeBpm / sub;
}

let sharedContext = null;

/** Shared AudioContext for tab playback and tuner reference tones. */
export function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!sharedContext || sharedContext.state === "closed") {
    sharedContext = new AC();
  }
  return sharedContext;
}

/**
 * Shared tab audio engine (one AudioContext for the app).
 * Supports short plucks (tab player) and sustained reference tones (tuner).
 * @returns {{
 *   resume: () => Promise<void>,
 *   playColumn: (notes: { frequency: number }[], when?: number) => void,
 *   startSustain: (frequency: number, options?: { volume?: number }) => void,
 *   stopSustain: () => void,
 *   isSustaining: () => boolean,
 *   getSustainFrequency: () => number|null,
 *   setVolume: (v: number) => void,
 *   getVolume: () => number,
 *   getContext: () => AudioContext|null,
 * }}
 */
export function createTabAudioEngine() {
  let volume = 0.35;
  /** @type {{ osc: OscillatorNode, gain: GainNode, frequency: number }|null} */
  let sustain = null;

  function stopSustainInternal(fadeMs = 40) {
    if (!sustain) return;
    const { osc, gain } = sustain;
    sustain = null;
    const ctx = getAudioContext();
    const now = ctx?.currentTime ?? 0;
    const fade = Math.max(0.01, fadeMs / 1000);
    try {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + fade);
      osc.stop(now + fade + 0.02);
    } catch {
      try {
        osc.stop();
      } catch {
        /* ignore */
      }
    }
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        /* ignore */
      }
    };
  }

  return {
    async resume() {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        await ctx.resume();
      }
    },
    setVolume(v) {
      const n = Number(v);
      if (Number.isFinite(n)) volume = Math.min(1, Math.max(0, n));
      if (sustain) {
        const ctx = getAudioContext();
        const now = ctx?.currentTime ?? 0;
        try {
          sustain.gain.gain.setTargetAtTime(Math.max(0.0001, volume), now, 0.02);
        } catch {
          /* ignore */
        }
      }
    },
    getVolume() {
      return volume;
    },
    getContext() {
      return getAudioContext();
    },
    /**
     * Pluck simultaneous notes (chord) with a short decay envelope.
     * @param {{ frequency: number }[]} notes
     * @param {number} [when] AudioContext time; default now
     */
    playColumn(notes, when) {
      const ctx = getAudioContext();
      if (!ctx || !notes?.length) return;
      const start = when ?? ctx.currentTime;
      const attack = 0.008;
      const decay = 0.18;

      for (const note of notes) {
        const freq = note.frequency;
        if (!Number.isFinite(freq) || freq <= 0) continue;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + attack + decay + 0.02);
        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {
            /* ignore */
          }
        };
      }
    },
    /**
     * Start a continuous reference tone (replaces any existing sustain).
     * @param {number} frequency
     * @param {{ volume?: number }} [options]
     */
    startSustain(frequency, options = {}) {
      const ctx = getAudioContext();
      const freq = Number(frequency);
      if (!ctx || !Number.isFinite(freq) || freq <= 0) return;

      if (options.volume != null) {
        const n = Number(options.volume);
        if (Number.isFinite(n)) volume = Math.min(1, Math.max(0, n));
      }

      stopSustainInternal(20);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      const attack = 0.02;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + attack);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);

      sustain = { osc, gain, frequency: freq };
    },
    stopSustain() {
      stopSustainInternal();
    },
    isSustaining() {
      return sustain != null;
    },
    getSustainFrequency() {
      return sustain?.frequency ?? null;
    },
  };
}

/** Module-level engine singleton. */
export const tabAudio = createTabAudioEngine();
