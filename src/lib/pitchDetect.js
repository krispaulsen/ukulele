/**
 * Microphone pitch detection using pitchy (McLeod-style) + Web Audio.
 */

import { PitchDetector } from "pitchy";

/** Minimum RMS (0–1 scale of float samples) to treat as signal. */
export const MIN_RMS = 0.008;

/** Minimum clarity from pitchy to accept a pitch. */
export const MIN_CLARITY = 0.8;

/** Reasonable ukulele frequency band (Hz). */
export const MIN_HZ = 70;
export const MAX_HZ = 1200;

/**
 * RMS of a float32 buffer.
 * @param {Float32Array} buf
 * @returns {number}
 */
export function bufferRms(buf) {
  if (!buf?.length) return 0;
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = buf[i];
    sum += v * v;
  }
  return Math.sqrt(sum / buf.length);
}

/**
 * Create a mic pitch session.
 * Call `start()` on a user gesture; `stop()` to release the mic.
 *
 * @param {{
 *   onFrame?: (frame: {
 *     status: "signal"|"quiet"|"uncertain",
 *     frequency: number|null,
 *     clarity: number,
 *     rms: number,
 *   }) => void,
 *   onError?: (err: Error) => void,
 *   minClarity?: number,
 *   minRms?: number,
 * }} [options]
 */
export function createPitchDetector(options = {}) {
  const onFrame = options.onFrame ?? (() => {});
  const onError = options.onError ?? (() => {});
  const minClarity = options.minClarity ?? MIN_CLARITY;
  const minRms = options.minRms ?? MIN_RMS;

  /** @type {MediaStream|null} */
  let stream = null;
  /** @type {AudioContext|null} */
  let context = null;
  /** @type {AnalyserNode|null} */
  let analyser = null;
  /** @type {MediaStreamAudioSourceNode|null} */
  let source = null;
  /** @type {PitchDetector<Float32Array>|null} */
  let detector = null;
  /** @type {Float32Array|null} */
  let buffer = null;
  /** @type {number|null} */
  let rafId = null;
  let running = false;
  let lastUiMs = 0;
  const uiIntervalMs = 50; // ~20 fps

  function emitQuiet() {
    onFrame({ status: "quiet", frequency: null, clarity: 0, rms: 0 });
  }

  function tick(now) {
    if (!running || !analyser || !detector || !buffer || !context) return;

    analyser.getFloatTimeDomainData(buffer);
    const rms = bufferRms(buffer);

    if (rms < minRms) {
      if (now - lastUiMs >= uiIntervalMs) {
        lastUiMs = now;
        emitQuiet();
      }
      rafId = requestAnimationFrame(tick);
      return;
    }

    const [pitch, clarity] = detector.findPitch(buffer, context.sampleRate);
    const freq =
      Number.isFinite(pitch) && pitch >= MIN_HZ && pitch <= MAX_HZ ? pitch : null;
    const clear = Number.isFinite(clarity) ? clarity : 0;

    if (now - lastUiMs >= uiIntervalMs) {
      lastUiMs = now;
      if (freq == null || clear < minClarity) {
        onFrame({ status: "uncertain", frequency: null, clarity: clear, rms });
      } else {
        onFrame({ status: "signal", frequency: freq, clarity: clear, rms });
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  async function start() {
    if (running) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      const err = new Error("Microphone access is not supported in this browser.");
      onError(err);
      throw err;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch (e) {
      const err =
        e instanceof Error
          ? e
          : new Error("Could not access the microphone.");
      onError(err);
      throw err;
    }

    const AC = window.AudioContext || window.webkitAudioContext;
    context = new AC();
    if (context.state === "suspended") {
      await context.resume();
    }

    analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0;

    source = context.createMediaStreamSource(stream);
    source.connect(analyser);

    buffer = new Float32Array(analyser.fftSize);
    detector = PitchDetector.forFloat32Array(analyser.fftSize);

    running = true;
    lastUiMs = 0;
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    try {
      source?.disconnect();
    } catch {
      /* ignore */
    }
    source = null;
    analyser = null;
    detector = null;
    buffer = null;

    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      stream = null;
    }

    if (context && context.state !== "closed") {
      // Dedicated context for mic; safe to close without affecting tabAudio.
      context.close().catch(() => {});
    }
    context = null;
  }

  return {
    start,
    stop,
    isRunning: () => running,
  };
}
