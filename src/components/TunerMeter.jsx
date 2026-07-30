import {
  CENTS_METER_RANGE,
  clampCentsForMeter,
  isInTune,
  tuningStatus,
} from "../lib/pitchMath.js";

const STATUS_STYLES = {
  idle: {
    note: "text-gray-500 dark:text-gray-400",
    bar: "bg-gray-300 dark:bg-gray-600",
    needle: "bg-gray-500",
    label: "text-gray-500 dark:text-gray-400",
  },
  flat: {
    note: "text-sky-600 dark:text-sky-400",
    bar: "bg-sky-200 dark:bg-sky-900",
    needle: "bg-sky-500",
    label: "text-sky-600 dark:text-sky-400",
  },
  "in-tune": {
    note: "text-green-600 dark:text-green-400",
    bar: "bg-green-200 dark:bg-green-900",
    needle: "bg-green-500",
    label: "text-green-600 dark:text-green-400",
  },
  sharp: {
    note: "text-red-600 dark:text-red-400",
    bar: "bg-red-200 dark:bg-red-900",
    needle: "bg-red-500",
    label: "text-red-600 dark:text-red-400",
  },
  held: {
    note: "text-gray-700 dark:text-gray-300",
    bar: "bg-gray-300 dark:bg-gray-600",
    needle: "bg-gray-500",
    label: "text-gray-500 dark:text-gray-400",
  },
};

/**
 * Large note + cents meter for the chromatic tuner.
 *
 * @param {{
 *   noteLabel?: string|null,
 *   cents?: number|null,
 *   listening?: boolean,
 *   signalStatus?: "idle"|"quiet"|"uncertain"|"signal"|"held",
 *   targetHint?: string|null,
 * }} props
 */
export default function TunerMeter({
  noteLabel = null,
  cents = null,
  listening = false,
  signalStatus = "idle",
  targetHint = null,
}) {
  const hasCents = Number.isFinite(cents);
  const live = signalStatus === "signal" || signalStatus === "held";
  const status = live && hasCents
    ? (signalStatus === "held" ? "held" : tuningStatus(cents))
    : "idle";
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.idle;
  const clamped = hasCents ? clampCentsForMeter(cents) : 0;
  // Map -range..+range → 0%..100% for needle position
  const pct = ((clamped + CENTS_METER_RANGE) / (2 * CENTS_METER_RANGE)) * 100;
  const inTune = hasCents && isInTune(cents);

  let secondary = "—";
  if (!listening) {
    secondary = "Start listening to detect pitch";
  } else if (signalStatus === "held" && hasCents) {
    const sign = cents > 0 ? "+" : "";
    secondary = `${sign}${Math.round(cents)} cents · holding last reading`;
  } else if (signalStatus === "quiet") {
    secondary = "No signal — pluck a string near the mic";
  } else if (signalStatus === "uncertain" && !hasCents) {
    secondary = "Uncertain — try one string, closer to the mic";
  } else if (hasCents && signalStatus === "signal") {
    const sign = cents > 0 ? "+" : "";
    secondary = `${sign}${Math.round(cents)} cents${inTune ? " · in tune" : cents < 0 ? " · flat" : " · sharp"}`;
  } else if (signalStatus === "uncertain") {
    secondary = "Uncertain — try one string, closer to the mic";
  }

  return (
    <div className="w-full max-w-md mx-auto text-center select-none">
      <div
        className={`text-6xl sm:text-7xl font-bold tracking-tight tabular-nums transition-colors duration-150 ${styles.note}`}
        aria-live="polite"
      >
        {noteLabel || (listening ? "…" : "—")}
      </div>

      {/* Always render so the meter doesn't jump when hint appears/disappears. */}
      <p
        className="mt-1 min-h-[1.25rem] text-sm text-gray-600 dark:text-gray-400"
        aria-hidden={targetHint ? undefined : true}
      >
        {targetHint || "\u00a0"}
      </p>

      <p className={`mt-2 text-base font-medium ${styles.label}`}>{secondary}</p>

      <div className="mt-6 px-2">
        <div
          className={`relative h-4 rounded-full overflow-hidden transition-colors duration-150 ${styles.bar}`}
          role="meter"
          aria-valuemin={-CENTS_METER_RANGE}
          aria-valuemax={CENTS_METER_RANGE}
          aria-valuenow={hasCents ? Math.round(clamped) : 0}
          aria-label="Cents deviation"
        >
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gray-500/50 dark:bg-gray-300/40 z-10" />
          {/* In-tune zone (approx ±8 of ±50) */}
          <div
            className="absolute top-0 bottom-0 bg-green-400/30 dark:bg-green-500/20"
            style={{
              left: `${((CENTS_METER_RANGE - 8) / (2 * CENTS_METER_RANGE)) * 100}%`,
              width: `${(16 / (2 * CENTS_METER_RANGE)) * 100}%`,
            }}
          />
          {hasCents && live ? (
            <div
              className={`absolute top-0 bottom-0 w-1.5 rounded-full shadow ${styles.needle} z-20 transition-[left] duration-100 ease-out ${
                signalStatus === "held" ? "opacity-60" : "opacity-100"
              }`}
              style={{ left: `calc(${pct}% - 3px)` }}
            />
          ) : null}
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400 tabular-nums">
          <span>−{CENTS_METER_RANGE}¢</span>
          <span>0</span>
          <span>+{CENTS_METER_RANGE}¢</span>
        </div>
      </div>
    </div>
  );
}
