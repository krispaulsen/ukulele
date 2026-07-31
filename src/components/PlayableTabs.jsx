import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { IconButton } from "@material-tailwind/react";
import {
  TAB_STRINGS,
  DEFAULT_BAR_EVERY,
  parseTabBlock,
  cellDisplayChar,
} from "../lib/tabs";
import { columnNotes, stepDurationMs, tabAudio } from "../lib/tabAudio";

const BPM_MIN = 40;
const BPM_MAX = 240;

/**
 * Playable monospaced tab display with Web Audio playback.
 *
 * @param {object} props
 * @param {string} props.markup - Tab body or full [| ... |] block
 * @param {boolean} [props.autoPlay] - Start playing on mount (after user gesture context)
 * @param {boolean} [props.showControls]
 * @param {boolean} [props.showClose]
 * @param {() => void} [props.onClose] - Collapse back to static view
 * @param {boolean} [props.includeBars] - Show bar separators every DEFAULT_BAR_EVERY steps
 * @param {string} [props.className]
 */
export default function PlayableTabs({
  markup,
  autoPlay = false,
  showControls = true,
  showClose = false,
  onClose,
  includeBars = true,
  className,
}) {
  const model = useMemo(() => parseTabBlock(markup ?? ""), [markup]);
  const stepCount = model.steps?.length ?? 0;

  const [status, setStatus] = useState("idle"); // idle | playing | paused
  const [stepIndex, setStepIndex] = useState(0);
  const [bpm, setBpm] = useState(120);
  /** Draft string while the BPM field is focused; null when not editing. */
  const [bpmDraft, setBpmDraft] = useState(null);
  const [loop, setLoop] = useState(false);

  function commitBpm(raw) {
    const v = Number(raw);
    if (!Number.isFinite(v)) return;
    setBpm(Math.min(BPM_MAX, Math.max(BPM_MIN, Math.trunc(v))));
  }

  const statusRef = useRef(status);
  const stepRef = useRef(stepIndex);
  const bpmRef = useRef(bpm);
  const loopRef = useRef(loop);
  const modelRef = useRef(model);
  const timerRef = useRef(null);

  statusRef.current = status;
  stepRef.current = stepIndex;
  bpmRef.current = bpm;
  loopRef.current = loop;
  modelRef.current = model;

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const playStepAt = useCallback((index) => {
    const notes = columnNotes(modelRef.current, index);
    if (notes.length) {
      tabAudio.playColumn(notes);
    }
  }, []);

  const scheduleNext = useCallback(() => {
    clearTimer();
    const delay = stepDurationMs(bpmRef.current);
    timerRef.current = setTimeout(() => {
      if (statusRef.current !== "playing") return;
      const len = modelRef.current.steps?.length ?? 0;
      if (len === 0) {
        statusRef.current = "idle";
        setStatus("idle");
        return;
      }
      let next = stepRef.current + 1;
      if (next >= len) {
        if (loopRef.current) {
          next = 0;
        } else {
          statusRef.current = "idle";
          stepRef.current = 0;
          setStatus("idle");
          setStepIndex(0);
          return;
        }
      }
      stepRef.current = next;
      setStepIndex(next);
      playStepAt(next);
      scheduleNext();
    }, delay);
  }, [clearTimer, playStepAt]);

  const stopPlayback = useCallback(() => {
    clearTimer();
    statusRef.current = "idle";
    stepRef.current = 0;
    setStatus("idle");
    setStepIndex(0);
  }, [clearTimer]);

  const pausePlayback = useCallback(() => {
    clearTimer();
    statusRef.current = "paused";
    setStatus("paused");
  }, [clearTimer]);

  const startPlayback = useCallback(
    async (fromStep) => {
      const len = modelRef.current.steps?.length ?? 0;
      if (len === 0) return;
      await tabAudio.resume();
      const start =
        fromStep !== undefined && fromStep !== null
          ? Math.min(Math.max(0, fromStep), len - 1)
          : statusRef.current === "paused"
            ? stepRef.current
            : 0;
      stepRef.current = start;
      statusRef.current = "playing";
      setStepIndex(start);
      setStatus("playing");
      playStepAt(start);
      clearTimer();
      scheduleNext();
    },
    [clearTimer, playStepAt, scheduleNext]
  );

  // Reset when markup/model length changes
  useEffect(() => {
    stopPlayback();
  }, [markup]); // eslint-disable-line react-hooks/exhaustive-deps -- reset only on markup change

  useEffect(() => {
    if (autoPlay) {
      startPlayback(0);
    }
    return () => clearTimer();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount only

  useEffect(() => () => clearTimer(), [clearTimer]);

  function handlePlayPause() {
    if (status === "playing") {
      pausePlayback();
    } else {
      startPlayback(status === "paused" ? stepIndex : 0);
    }
  }

  function handleStop() {
    stopPlayback();
  }

  function handleRestart() {
    stopPlayback();
    // slight delay so stop clears timer before restart
    queuePromise.resolve().then(() => startPlayback(0));
  }

  function handleSeek(index) {
    stepRef.current = index;
    setStepIndex(index);
    if (statusRef.current === "playing") {
      clearTimer();
      playStepAt(index);
      scheduleNext();
    }
  }

  const empty = stepCount === 0;

  return (
    <div className={clsx("playable-tabs space-y-2", className)}>
      {showControls && (
        <div className="flex flex-wrap items-center gap-2">
          <IconButton
            type="button"
            color="primary"
            size="sm"
            disabled={empty}
            title={status === "playing" ? "Pause" : "Play"}
            aria-label={status === "playing" ? "Pause" : "Play"}
            onClick={handlePlayPause}
          >
            <i className={status === "playing" ? "fa-solid fa-pause" : "fa-solid fa-play"} />
          </IconButton>
          <IconButton
            type="button"
            color="secondary"
            size="sm"
            disabled={empty || status === "idle"}
            title="Stop"
            aria-label="Stop"
            onClick={handleStop}
          >
            <i className="fa-solid fa-stop" />
          </IconButton>
          <IconButton
            type="button"
            color="secondary"
            size="sm"
            disabled={empty}
            title="Restart"
            aria-label="Restart"
            onClick={handleRestart}
          >
            <i className="fa-solid fa-rotate-left" />
          </IconButton>
          <label className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            BPM
            <input
              type="number"
              min={BPM_MIN}
              max={BPM_MAX}
              value={bpmDraft !== null ? bpmDraft : bpm}
              onFocus={() => setBpmDraft(String(bpm))}
              onChange={(e) => {
                const raw = e.target.value;
                setBpmDraft(raw);
                // Live-update playback only when the value is already in range
                // so partial typing (e.g. "8" on the way to "80") is not clamped.
                const v = Number(raw);
                if (Number.isFinite(v) && v >= BPM_MIN && v <= BPM_MAX) {
                  setBpm(Math.trunc(v));
                }
              }}
              onBlur={() => {
                commitBpm(bpmDraft ?? bpm);
                setBpmDraft(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="w-14 px-1 py-0.5 rounded border border-taupe-400 dark:border-taupe-600 bg-transparent text-sm"
            />
          </label>
          <label className="inline-flex items-center gap-1 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={loop}
              onChange={(e) => setLoop(e.target.checked)}
            />
            Loop
          </label>
          {status !== "idle" && (
            <span className="text-xs text-gray-500" aria-live="polite">
              Step {stepIndex + 1}/{stepCount}
            </span>
          )}
          {showClose && typeof onClose === "function" && (
            <IconButton
              type="button"
              color="secondary"
              size="sm"
              className="ml-auto"
              title="Close player"
              aria-label="Close player"
              onClick={() => {
                stopPlayback();
                onClose();
              }}
            >
              <i className="fa-solid fa-xmark" />
            </IconButton>
          )}
        </div>
      )}

      <div
        className={clsx(
          "tabs playable-tabs-display font-mono text-sm leading-none overflow-x-auto",
          "p-2 rounded border border-taupe-400 dark:border-taupe-600",
          "bg-taupe-100/80 dark:bg-taupe-900/50"
        )}
        role="group"
        aria-label="Tablature with playhead"
      >
        {TAB_STRINGS.map((label, stringIndex) => (
          <div key={label} className="flex items-center whitespace-nowrap mb-0.5">
            <span className="inline-block w-4 shrink-0 select-none opacity-80">{label}</span>
            <span className="select-none opacity-50">|</span>
            {Array.from({ length: stepCount }, (_, i) => {
              const fret = model.steps[i][stringIndex];
              const active = i === stepIndex && status !== "idle";
              const barBefore = includeBars && i > 0 && i % DEFAULT_BAR_EVERY === 0;
              return (
                <span key={`${label}-${i}`} className="inline-flex items-stretch">
                  {barBefore && (
                    <span className="inline-block w-[0.5ch] text-center opacity-40 select-none" aria-hidden>
                      |
                    </span>
                  )}
                  <button
                    type="button"
                    className={clsx(
                      "inline-block w-[1ch] text-center p-0 m-0 border-0 bg-transparent font-mono leading-none",
                      "hover:bg-orange-200/60 dark:hover:bg-orange-800/40 cursor-pointer",
                      active && "bg-orange-300 dark:bg-orange-700 ring-1 ring-orange-500"
                    )}
                    title={`Step ${i + 1}${fret == null ? "" : `, fret ${fret}`}`}
                    aria-label={`${label} string, step ${i + 1}${
                      fret == null ? ", empty" : `, fret ${fret}`
                    }`}
                    onClick={() => handleSeek(i)}
                  >
                    {cellDisplayChar(fret)}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
