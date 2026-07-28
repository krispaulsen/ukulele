import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../components/ui";
import TunerMeter from "../components/TunerMeter";
import { tabAudio, OPEN_FREQUENCIES } from "../lib/tabAudio.js";
import { createPitchDetector } from "../lib/pitchDetect.js";
import {
  UKULELE_OPEN_STRINGS,
  frequencyToNote,
  advanceLockedNote,
  stableNearestOpenString,
  openStringByLabel,
  centsBetween,
} from "../lib/pitchMath.js";

/** @typedef {"auto"|"G"|"C"|"E"|"A"} TargetMode */

/** Keep showing the last good pitch this long after the note decays. */
const HOLD_MS = 3000;

/** EMA: lower = smoother / less twitchy. */
const SMOOTH_ALPHA = 0.22;

/**
 * Reject wild pitch jumps (common octave errors) unless confirmed.
 * Ratio > ~1.9 ≈ octave up; < ~0.53 ≈ octave down.
 */
const MAX_JUMP_RATIO = 1.85;

/** @typedef {"idle"|"quiet"|"uncertain"|"signal"|"held"} DisplayStatus */

export default function TunerPage() {
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState(/** @type {string|null} */ (null));
  const [signalStatus, setSignalStatus] = useState(
    /** @type {DisplayStatus} */ ("idle"),
  );
  const [detectedHz, setDetectedHz] = useState(/** @type {number|null} */ (null));
  /** Locked chromatic note for Auto mode (stable label). */
  const [lockedNoteLabel, setLockedNoteLabel] = useState(/** @type {string|null} */ (null));
  const [lockedCents, setLockedCents] = useState(/** @type {number|null} */ (null));
  const [openStringHint, setOpenStringHint] = useState(
    /** @type {{ label: string, note: string, cents: number }|null} */ (null),
  );
  /** @type {[TargetMode, function]} */
  const [targetMode, setTargetMode] = useState(/** @type {TargetMode} */ ("auto"));
  const [sustainLabel, setSustainLabel] = useState(/** @type {string|null} */ (null));
  const [volume, setVolume] = useState(() => tabAudio.getVolume());
  const [helpOpen, setHelpOpen] = useState(false);

  const detectorRef = useRef(/** @type {ReturnType<typeof createPitchDetector>|null} */ (null));
  const smoothHzRef = useRef(/** @type {number|null} */ (null));
  const lastGoodAtRef = useRef(0);
  const holdTimerRef = useRef(/** @type {ReturnType<typeof setTimeout>|null} */ (null));
  const jumpCandidateRef = useRef(/** @type {{ hz: number, count: number }|null} */ (null));
  const noteLockRef = useRef({
    lockedMidi: /** @type {number|null} */ (null),
    candidateMidi: /** @type {number|null} */ (null),
    candidateCount: 0,
  });
  const openStringLockRef = useRef(/** @type {string|null} */ (null));

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current != null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const resetPitchState = useCallback(() => {
    smoothHzRef.current = null;
    lastGoodAtRef.current = 0;
    jumpCandidateRef.current = null;
    noteLockRef.current = { lockedMidi: null, candidateMidi: null, candidateCount: 0 };
    openStringLockRef.current = null;
    setDetectedHz(null);
    setLockedNoteLabel(null);
    setLockedCents(null);
    setOpenStringHint(null);
  }, []);

  const cleanupDetector = useCallback(() => {
    clearHoldTimer();
    detectorRef.current?.stop();
    detectorRef.current = null;
    resetPitchState();
    setListening(false);
    setSignalStatus("idle");
  }, [clearHoldTimer, resetPitchState]);

  useEffect(() => () => {
    cleanupDetector();
    tabAudio.stopSustain();
  }, [cleanupDetector]);

  function applyLivePitch(hz) {
    const advanced = advanceLockedNote(noteLockRef.current, hz, {
      holdSemitones: 0.55,
      switchConfirm: 5,
    });
    noteLockRef.current = {
      lockedMidi: advanced.lockedMidi,
      candidateMidi: advanced.candidateMidi,
      candidateCount: advanced.candidateCount,
    };

    if (advanced.note) {
      setLockedNoteLabel(advanced.note.label);
      setLockedCents(advanced.note.cents);
    }

    const open = stableNearestOpenString(hz, openStringLockRef.current, 28);
    if (open) {
      openStringLockRef.current = open.label;
      setOpenStringHint({
        label: open.label,
        note: open.note,
        cents: open.cents,
      });
    }

    setDetectedHz(hz);
    setSignalStatus("signal");
  }

  function scheduleHoldExpiry() {
    clearHoldTimer();
    holdTimerRef.current = setTimeout(() => {
      // Only expire if we never got a newer good sample.
      if (performance.now() - lastGoodAtRef.current >= HOLD_MS - 30) {
        resetPitchState();
        setSignalStatus("quiet");
      }
    }, HOLD_MS);
  }

  async function handleStartListening() {
    setMicError(null);
    cleanupDetector();

    const detector = createPitchDetector({
      onFrame(frame) {
        const now = performance.now();

        if (frame.status === "signal" && frame.frequency != null) {
          let raw = frame.frequency;
          const prev = smoothHzRef.current;

          // Soft-reject octave / huge jumps unless they repeat.
          if (prev != null && prev > 0) {
            const ratio = raw / prev;
            if (ratio > MAX_JUMP_RATIO || ratio < 1 / MAX_JUMP_RATIO) {
              const cand = jumpCandidateRef.current;
              if (cand && Math.abs(Math.log2(cand.hz / raw)) < 0.08) {
                cand.count += 1;
                if (cand.count < 3) {
                  // Keep previous smooth value; treat as brief glitch.
                  lastGoodAtRef.current = now;
                  setSignalStatus("signal");
                  scheduleHoldExpiry();
                  return;
                }
                // Confirmed jump — accept.
                jumpCandidateRef.current = null;
              } else {
                jumpCandidateRef.current = { hz: raw, count: 1 };
                lastGoodAtRef.current = now;
                setSignalStatus("signal");
                scheduleHoldExpiry();
                return;
              }
            } else {
              jumpCandidateRef.current = null;
            }
          }

          const next =
            prev == null ? raw : prev * (1 - SMOOTH_ALPHA) + raw * SMOOTH_ALPHA;
          smoothHzRef.current = next;
          lastGoodAtRef.current = now;
          clearHoldTimer();
          applyLivePitch(next);
          return;
        }

        // Quiet or uncertain: hold the last good reading so the UI doesn't thrash.
        if (smoothHzRef.current != null && now - lastGoodAtRef.current < HOLD_MS) {
          setSignalStatus("held");
          scheduleHoldExpiry();
          return;
        }

        if (frame.status === "quiet") {
          if (smoothHzRef.current != null) {
            // Past hold window — clear on this frame.
            resetPitchState();
          }
          setSignalStatus("quiet");
        } else {
          setSignalStatus(smoothHzRef.current != null ? "held" : "uncertain");
        }
      },
      onError(err) {
        const name = /** @type {{ name?: string }} */ (err)?.name;
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setMicError(
            "Microphone permission denied. Allow mic access, or use the reference tones below to tune by ear.",
          );
        } else if (name === "NotFoundError") {
          setMicError("No microphone found. Use the reference tones below to tune by ear.");
        } else {
          setMicError(err?.message || "Could not access the microphone.");
        }
        setListening(false);
      },
    });

    detectorRef.current = detector;
    try {
      await detector.start();
      setListening(true);
      setSignalStatus("quiet");
    } catch {
      detectorRef.current = null;
      setListening(false);
    }
  }

  function handleStopListening() {
    cleanupDetector();
  }

  async function handlePlayString(label) {
    const target = openStringByLabel(label);
    if (!target) return;
    await tabAudio.resume();
    // Toggle off if same string is already sustaining
    if (sustainLabel === label && tabAudio.isSustaining()) {
      tabAudio.stopSustain();
      setSustainLabel(null);
      return;
    }
    tabAudio.startSustain(target.frequency);
    setSustainLabel(label);
  }

  function handleStopTone() {
    tabAudio.stopSustain();
    setSustainLabel(null);
  }

  function handleVolumeChange(e) {
    const v = Number(e.target.value);
    setVolume(v);
    tabAudio.setVolume(v);
  }

  // Derive display from detected Hz + target mode
  let noteLabel = null;
  let cents = null;
  let targetHint = null;
  const showReading =
    detectedHz != null &&
    (signalStatus === "signal" || signalStatus === "held");

  if (showReading) {
    if (targetMode === "auto") {
      noteLabel = lockedNoteLabel ?? frequencyToNote(detectedHz)?.label ?? null;
      cents = lockedCents ?? frequencyToNote(detectedHz)?.cents ?? null;
      if (openStringHint) {
        targetHint = `Nearest open string: ${openStringHint.label} (${openStringHint.note}) · ${Math.round(openStringHint.cents)}¢ from open`;
      }
    } else {
      const target = openStringByLabel(targetMode);
      if (target) {
        noteLabel = target.note;
        cents = centsBetween(detectedHz, target.frequency);
        const detected = lockedNoteLabel ?? frequencyToNote(detectedHz)?.label;
        targetHint = `Tuning to ${target.label} · hearing ${detected ?? "…"}${
          detectedHz != null ? ` (${detectedHz.toFixed(1)} Hz)` : ""
        }`;
      }
    }
  } else if (targetMode !== "auto") {
    const target = openStringByLabel(targetMode);
    if (target) {
      noteLabel = target.note;
      targetHint = `Target: open ${target.label} (${target.frequency.toFixed(1)} Hz)`;
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold mb-1">Chromatic Tuner</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Standard re-entrant ukulele: G4 · C4 · E4 · A4 (A4 = 440 Hz)
      </p>

      <TunerMeter
        noteLabel={noteLabel}
        cents={cents}
        listening={listening}
        signalStatus={listening ? signalStatus : "idle"}
        targetHint={targetHint}
      />

      {/* Target string */}
      <div className="mt-8">
        <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Target string
        </p>
        <div className="flex flex-wrap gap-2">
          {/** @type {TargetMode[]} */}
          {(["auto", "G", "C", "E", "A"]).map((mode) => {
            const active = targetMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setTargetMode(mode)}
                className={[
                  "min-w-[3.25rem] px-4 py-3 rounded-md border-2 text-base font-semibold transition-colors",
                  active
                    ? "bg-orange-900 text-orange-100 border-orange-800"
                    : "bg-transparent border-gray-300 dark:border-gray-600 hover:border-orange-700",
                ].join(" ")}
                aria-pressed={active}
              >
                {mode === "auto" ? "Auto" : mode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mic controls */}
      <div className="mt-6 flex flex-wrap gap-3 items-center">
        {!listening ? (
          <Button type="button" variant="primary" onClick={handleStartListening}>
            Start Listening
          </Button>
        ) : (
          <Button type="button" variant="secondary" onClick={handleStopListening}>
            Stop Listening
          </Button>
        )}
        {listening ? (
          <span className="inline-flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            Listening…
          </span>
        ) : null}
      </div>

      {micError ? (
        <p className="mt-3 text-sm text-red-700 dark:text-red-400" role="alert">
          {micError}
        </p>
      ) : null}

      {/* Reference tones */}
      <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-6">
        <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Reference tones
        </p>
        <div className="flex flex-wrap gap-2">
          {UKULELE_OPEN_STRINGS.map((s) => {
            const active = sustainLabel === s.label;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => handlePlayString(s.label)}
                className={[
                  "min-w-[3.5rem] px-4 py-3 rounded-md border-2 text-base font-semibold transition-colors",
                  active
                    ? "bg-indigo-900 text-indigo-100 border-indigo-600"
                    : "bg-transparent border-gray-300 dark:border-gray-600 hover:border-indigo-600",
                ].join(" ")}
                aria-pressed={active}
                title={`${s.note} · ${s.frequency.toFixed(1)} Hz`}
              >
                {s.label}
                <span className="block text-xs font-normal opacity-80">{s.note}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleStopTone}
            className="min-w-[3.5rem] px-4 py-3 rounded-md border-2 text-base font-semibold border-gray-300 dark:border-gray-600 hover:border-gray-500"
          >
            Stop
          </button>
        </div>

        <label className="mt-4 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
          <span className="shrink-0 w-16">Volume</span>
          <input
            type="range"
            min={0.05}
            max={0.8}
            step={0.01}
            value={volume}
            onChange={handleVolumeChange}
            className="w-full max-w-xs"
          />
        </label>
      </div>

      {/* Help */}
      <div className="mt-8">
        <button
          type="button"
          className="text-sm font-medium text-orange-900 dark:text-orange-300 underline-offset-2 hover:underline"
          onClick={() => setHelpOpen((o) => !o)}
          aria-expanded={helpOpen}
        >
          {helpOpen ? "Hide tips" : "How to use"}
        </button>
        {helpOpen ? (
          <ul className="mt-3 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1">
            <li>Pluck one string at a time near the microphone.</li>
            <li>
              Adjust the tuning peg slowly until cents is near 0 and the meter turns green
              (within about ±8 cents).
            </li>
            <li>
              Use <strong>Auto</strong> to hear any pitch, or lock to G / C / E / A to focus on
              one open string. The display holds the last reading briefly as the note fades.
            </li>
            <li>
              Reference tones play a continuous pitch (A4 = {OPEN_FREQUENCIES.A} Hz). Tap the
              same string again or Stop to silence.
            </li>
            <li>If the mic is blocked, you can still tune by ear with reference tones.</li>
          </ul>
        ) : null}
      </div>
    </div>
  );
}
