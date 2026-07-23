/**
 * Ukulele tablature model + parse/serialize helpers.
 * Single character per time step: 0-9, a=10, b=11, c=12, ...
 * String order (top → bottom): A, E, C, G.
 */

export const TAB_STRINGS = ["A", "E", "C", "G"];

/** Max fret supported via letter encoding (0-9 + a-f → 0-15). */
export const MAX_FRET = 15;

const DEFAULT_STEPS = 16;
/** Steps per bar (eighth-note columns). Future: user setting for measure size / timing. */
export const DEFAULT_BAR_EVERY = 8;

/**
 * Encode a fret number as a single tab character.
 * @param {number|null|undefined} fret
 * @returns {string} '-' for empty, '0'-'9', 'a'+ for frets >= 10
 */
export function fretToChar(fret) {
  if (fret === null || fret === undefined || !Number.isFinite(fret)) {
    return "-";
  }
  const n = Math.trunc(fret);
  if (n < 0) return "-";
  if (n <= 9) return String(n);
  if (n <= MAX_FRET) return String.fromCharCode("a".charCodeAt(0) + (n - 10));
  return "-";
}

/**
 * Decode a single tab character to a fret number.
 * @param {string} ch
 * @returns {number|null}
 */
export function charToFret(ch) {
  if (ch === null || ch === undefined || ch === "" || ch === "-") {
    return null;
  }
  const c = String(ch).charAt(0);
  if (c >= "0" && c <= "9") {
    return c.charCodeAt(0) - "0".charCodeAt(0);
  }
  const lower = c.toLowerCase();
  if (lower >= "a" && lower <= "f") {
    return 10 + (lower.charCodeAt(0) - "a".charCodeAt(0));
  }
  return null;
}

/**
 * Create an empty tab model.
 * Model shape: { steps: Array<Array<number|null>> } where steps[stepIndex][stringIndex]
 * stringIndex maps to TAB_STRINGS.
 * @param {number} [stepCount=16]
 * @returns {{ steps: (number|null)[][] }}
 */
export function createEmptyTab(stepCount = DEFAULT_STEPS) {
  const n = Math.max(1, Math.trunc(Number(stepCount) || DEFAULT_STEPS));
  const steps = [];
  for (let i = 0; i < n; i++) {
    steps.push(TAB_STRINGS.map(() => null));
  }
  return { steps };
}

/**
 * Deep-clone a tab model.
 * @param {{ steps: (number|null)[][] }} model
 */
export function cloneTab(model) {
  return {
    steps: (model?.steps ?? []).map((col) =>
      TAB_STRINGS.map((_, si) => {
        const v = col?.[si];
        return v === null || v === undefined || !Number.isFinite(v) ? null : Math.trunc(v);
      })
    ),
  };
}

/**
 * Serialize a tab model to lyrics markup `[| ... |]`.
 * @param {{ steps: (number|null)[][] }} model
 * @param {{ barEvery?: number|null }} [options] — insert `|` every N steps (default 8 for eighths); null/0 disables
 * @returns {string}
 */
export function serializeTab(model, options = {}) {
  const barEvery =
    options.barEvery === null || options.barEvery === 0
      ? 0
      : Math.max(0, Math.trunc(options.barEvery ?? DEFAULT_BAR_EVERY));

  const steps = model?.steps ?? [];
  const lines = TAB_STRINGS.map((label, si) => {
    let body = "";
    for (let i = 0; i < steps.length; i++) {
      if (barEvery > 0 && i > 0 && i % barEvery === 0) {
        body += "|";
      }
      const fret = steps[i]?.[si];
      body += fretToChar(fret);
    }
    return `${label}|${body}`;
  });

  return `[\|\n${lines.join("\n")}\n|]`;
}

/**
 * Strip optional outer `[|` / `|]` markers and return inner content.
 * @param {string} text
 */
function stripBlockMarkers(text) {
  let s = String(text ?? "").trim();
  if (s.startsWith("[|")) s = s.slice(2);
  if (s.endsWith("|]")) s = s.slice(0, -2);
  return s.trim();
}

/**
 * Parse a string-line like `A|---3-0-a-|` into an array of frets (null for empty).
 * Skips spaces and decorative `|` bar markers (when not part of `A|` label).
 * @param {string} line
 * @returns {{ label: string, frets: (number|null)[] } | null}
 */
function parseStringLine(line) {
  const trimmed = String(line ?? "").trim();
  if (!trimmed) return null;

  // Match optional label A| E| C| G| (case-insensitive), rest is body
  const m = trimmed.match(/^([AECG])\|(.*)$/i);
  if (!m) return null;

  const label = m[1].toUpperCase();
  const body = m[2];
  const frets = [];
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === " " || ch === "\t" || ch === "|") continue;
    if (ch === "-") {
      frets.push(null);
      continue;
    }
    const fret = charToFret(ch);
    if (fret !== null) {
      frets.push(fret);
    }
    // ignore unknown characters
  }
  return { label, frets };
}

/**
 * Parse tablature markup (full block or raw lines) into a tab model.
 * Best-effort: missing strings filled with nulls; length = max of parsed rows.
 * @param {string} text
 * @returns {{ steps: (number|null)[][] }}
 */
export function parseTabBlock(text) {
  const inner = stripBlockMarkers(text);
  const lines = inner.split(/\r?\n/);

  /** @type {Record<string, (number|null)[]>} */
  const byLabel = {};

  for (const line of lines) {
    const parsed = parseStringLine(line);
    if (!parsed) continue;
    byLabel[parsed.label] = parsed.frets;
  }

  const lengths = TAB_STRINGS.map((s) => byLabel[s]?.length ?? 0);
  const stepCount = Math.max(DEFAULT_STEPS, ...lengths, 1);

  const steps = [];
  for (let i = 0; i < stepCount; i++) {
    steps.push(
      TAB_STRINGS.map((label) => {
        const row = byLabel[label];
        if (!row || i >= row.length) return null;
        return row[i];
      })
    );
  }

  return { steps };
}

/**
 * Set a single cell. Returns a new model (immutable-friendly).
 * @param {{ steps: (number|null)[][] }} model
 * @param {number} stringIndex
 * @param {number} stepIndex
 * @param {number|null} fret
 */
export function setCell(model, stringIndex, stepIndex, fret) {
  const next = cloneTab(model);
  if (stepIndex < 0 || stepIndex >= next.steps.length) return next;
  if (stringIndex < 0 || stringIndex >= TAB_STRINGS.length) return next;
  let value = null;
  if (fret !== null && fret !== undefined && Number.isFinite(fret)) {
    const n = Math.trunc(fret);
    value = n >= 0 && n <= MAX_FRET ? n : null;
  }
  next.steps[stepIndex][stringIndex] = value;
  return next;
}

/**
 * Append empty columns.
 * @param {{ steps: (number|null)[][] }} model
 * @param {number} count
 */
export function addSteps(model, count = 4) {
  const n = Math.max(0, Math.trunc(count));
  const next = cloneTab(model);
  for (let i = 0; i < n; i++) {
    next.steps.push(TAB_STRINGS.map(() => null));
  }
  return next;
}

function emptyColumn() {
  return TAB_STRINGS.map(() => null);
}

/**
 * Insert one empty column at `stepIndex` (0 = before first; length = append).
 * Existing frets shift right. Always keeps at least the new column.
 * @param {{ steps: (number|null)[][] }} model
 * @param {number} stepIndex
 */
export function insertStep(model, stepIndex) {
  const next = cloneTab(model);
  const len = next.steps.length;
  let i = Math.trunc(Number(stepIndex));
  if (!Number.isFinite(i)) i = len;
  i = Math.min(Math.max(0, i), len);
  next.steps.splice(i, 0, emptyColumn());
  return next;
}

/**
 * Remove the column at `stepIndex`. Refuses to remove the last remaining column.
 * @param {{ steps: (number|null)[][] }} model
 * @param {number} stepIndex
 */
export function removeStep(model, stepIndex) {
  const next = cloneTab(model);
  if (next.steps.length <= 1) return next;
  const i = Math.trunc(Number(stepIndex));
  if (!Number.isFinite(i) || i < 0 || i >= next.steps.length) return next;
  next.steps.splice(i, 1);
  return next;
}

/**
 * Clear all cells, keeping length.
 * @param {{ steps: (number|null)[][] }} model
 */
export function clearTab(model) {
  const len = model?.steps?.length || DEFAULT_STEPS;
  return createEmptyTab(len);
}

/**
 * Display glyph for a cell in the grid (single char).
 * @param {number|null} fret
 */
export function cellDisplayChar(fret) {
  return fretToChar(fret);
}
