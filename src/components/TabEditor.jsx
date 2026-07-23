import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { Button, IconButton } from "@material-tailwind/react";
import { Flex } from "./ui";
import {
  TAB_STRINGS,
  DEFAULT_BAR_EVERY,
  createEmptyTab,
  serializeTab,
  parseTabBlock,
  setCell,
  addSteps,
  insertStep,
  removeStep,
  clearTab,
  cellDisplayChar,
  MAX_FRET,
} from "../lib/tabs";

const KEYPAD_FRETS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * Visual ukulele tab builder: 4 strings × N steps.
 *
 * @param {object} props
 * @param {string} [props.initialMarkup]
 * @param {(markup: string) => void} [props.onChange]
 * @param {'page'|'modal'} [props.mode]
 * @param {(markup: string) => void} [props.onInsert]
 * @param {boolean} [props.showInsert]
 * @param {boolean} [props.showMarkupPreview]
 */
export default function TabEditor({
  initialMarkup,
  onChange,
  mode = "page",
  onInsert,
  showInsert = false,
  showMarkupPreview = true,
}) {
  const [model, setModel] = useState(() =>
    initialMarkup?.trim() ? parseTabBlock(initialMarkup) : createEmptyTab(16)
  );
  const [cursor, setCursor] = useState({ stringIndex: 0, stepIndex: 0 });
  const [copyStatus, setCopyStatus] = useState("");
  /** When true, export `|` bar separators every DEFAULT_BAR_EVERY steps. */
  const [includeBars, setIncludeBars] = useState(true);
  const gridRef = useRef(null);

  const markup = useMemo(
    () => serializeTab(model, { barEvery: includeBars ? DEFAULT_BAR_EVERY : 0 }),
    [model, includeBars]
  );
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current?.(markup);
  }, [markup]);

  const updateModel = useCallback((updater) => {
    setModel((prev) => (typeof updater === "function" ? updater(prev) : updater));
  }, []);

  const stepCount = model.steps?.length ?? 0;

  const placeFret = useCallback(
    (fret) => {
      const { stringIndex, stepIndex } = cursor;
      updateModel((prev) => setCell(prev, stringIndex, stepIndex, fret));
    },
    [cursor, updateModel]
  );

  const clearCell = useCallback(() => {
    placeFret(null);
  }, [placeFret]);

  const moveCursor = useCallback(
    (dString, dStep) => {
      setCursor((c) => {
        const maxStep = Math.max(0, (model.steps?.length ?? 1) - 1);
        const stringIndex = Math.min(
          TAB_STRINGS.length - 1,
          Math.max(0, c.stringIndex + dString)
        );
        const stepIndex = Math.min(maxStep, Math.max(0, c.stepIndex + dStep));
        return { stringIndex, stepIndex };
      });
    },
    [model.steps?.length]
  );

  const handleKeyDown = useCallback(
    (event) => {
      const key = event.key;
      if (key === "ArrowUp") {
        event.preventDefault();
        moveCursor(-1, 0);
        return;
      }
      if (key === "ArrowDown") {
        event.preventDefault();
        moveCursor(1, 0);
        return;
      }
      if (key === "ArrowLeft") {
        event.preventDefault();
        moveCursor(0, -1);
        return;
      }
      if (key === "ArrowRight") {
        event.preventDefault();
        moveCursor(0, 1);
        return;
      }
      if (key === "Backspace" || key === "Delete") {
        event.preventDefault();
        clearCell();
        return;
      }
      if (key.length === 1) {
        if (key >= "0" && key <= "9") {
          event.preventDefault();
          placeFret(Number(key));
          return;
        }
        const lower = key.toLowerCase();
        if (lower >= "a" && lower <= "f") {
          const fret = 10 + (lower.charCodeAt(0) - "a".charCodeAt(0));
          if (fret <= MAX_FRET) {
            event.preventDefault();
            placeFret(fret);
          }
        }
      }
    },
    [moveCursor, clearCell, placeFret]
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(markup);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch {
      setCopyStatus("Copy failed");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  }

  function handleClearAll() {
    updateModel((prev) => clearTab(prev));
  }

  function handleAddSteps(count) {
    updateModel((prev) => addSteps(prev, count));
  }

  function handleInsertColumn(stepIndex) {
    updateModel((prev) => insertStep(prev, stepIndex));
    setCursor((c) => ({
      stringIndex: c.stringIndex,
      stepIndex, // stay on the new empty column
    }));
  }

  function handleRemoveColumn(removedIndex) {
    if (stepCount <= 1) return;
    updateModel((prev) => removeStep(prev, removedIndex));
    setCursor((c) => {
      const maxStep = Math.max(0, stepCount - 2);
      let stepIndex = c.stepIndex;
      if (c.stepIndex > removedIndex) stepIndex = c.stepIndex - 1;
      else if (c.stepIndex === removedIndex) stepIndex = Math.min(c.stepIndex, maxStep);
      return {
        stringIndex: c.stringIndex,
        stepIndex: Math.max(0, Math.min(stepIndex, maxStep)),
      };
    });
  }

  function handleImport() {
    const raw = window.prompt("Paste tablature markup ([| … |]):", "");
    if (raw == null || !String(raw).trim()) return;
    updateModel(parseTabBlock(raw));
    setCursor({ stringIndex: 0, stepIndex: 0 });
  }

  const selectedFret =
    model.steps?.[cursor.stepIndex]?.[cursor.stringIndex] ?? null;
  const canRemoveColumn = stepCount > 1;

  return (
    <div className={clsx("tab-editor space-y-4", mode === "modal" && "max-h-[70vh] overflow-y-auto")}>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Click a cell, then enter a fret (<strong>0–9</strong>, or{" "}
        <strong>a / b / c</strong> for frets 10 / 11 / 12). Arrow keys move;
        Backspace clears the cell. Column headers: <strong>+</strong> inserts a
        blank step before that column; <strong>×</strong> removes the column
        (notes shift). Optionally include bar lines every {DEFAULT_BAR_EVERY}{" "}
        steps in the exported markup.
      </p>

      <Flex gap="gap-2" className="flex-wrap items-center">
        <Button type="button" color="secondary" size="sm" onClick={() => handleAddSteps(8)}>
          +8 steps
        </Button>
        <Button type="button" color="secondary" size="sm" onClick={handleClearAll}>
          Clear all
        </Button>
        <Button type="button" color="secondary" size="sm" onClick={handleImport}>
          Import…
        </Button>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none px-1">
          <input
            type="checkbox"
            checked={includeBars}
            onChange={(e) => setIncludeBars(e.target.checked)}
            className="size-4 accent-orange-600"
          />
          Include bars in markup
        </label>
        <Button type="button" color="primary" size="sm" onClick={handleCopy}>
          Copy markup
        </Button>
        {showInsert && typeof onInsert === "function" && (
          <Button type="button" color="primary" size="sm" onClick={() => onInsert(markup)}>
            Insert into song
          </Button>
        )}
        {copyStatus && (
          <span className="text-sm text-green-700 dark:text-green-400" role="status">
            {copyStatus}
          </span>
        )}
      </Flex>

      <div
        ref={gridRef}
        className="overflow-x-auto rounded-lg border border-taupe-400 dark:border-taupe-600 bg-taupe-200/50 dark:bg-taupe-900/40 p-3 outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        tabIndex={0}
        role="grid"
        aria-label="Ukulele tablature grid"
        onKeyDown={handleKeyDown}
      >
        <div className="inline-block min-w-full">
          {/* Column controls: + inserts before, × removes column */}
          <div className="flex mb-1">
            <div className="w-8 shrink-0" aria-hidden />
            {Array.from({ length: stepCount }, (_, stepIndex) => {
              const barStart = stepIndex > 0 && stepIndex % DEFAULT_BAR_EVERY === 0;
              const isSelectedCol = cursor.stepIndex === stepIndex;
              return (
                <div
                  key={`h-${stepIndex}`}
                  className={clsx(
                    "w-8 shrink-0 flex flex-col items-stretch gap-0.5",
                    barStart && "ml-1"
                  )}
                >
                  <button
                    type="button"
                    title={`Insert blank column before step ${stepIndex + 1}`}
                    aria-label={`Insert blank column before step ${stepIndex + 1}`}
                    className={clsx(
                      "h-5 leading-none rounded border font-semibold",
                      "border-taupe-400 dark:border-taupe-600",
                      "bg-taupe-100 dark:bg-taupe-800 hover:bg-green-100 dark:hover:bg-green-900",
                      "text-green-800 dark:text-green-300"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInsertColumn(stepIndex);
                      gridRef.current?.focus();
                    }}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    title={
                      canRemoveColumn
                        ? `Remove column ${stepIndex + 1}`
                        : "Cannot remove the last column"
                    }
                    aria-label={`Remove column ${stepIndex + 1}`}
                    disabled={!canRemoveColumn}
                    className={clsx(
                      "h-5 leading-none rounded border font-semibold",
                      "border-taupe-400 dark:border-taupe-600",
                      canRemoveColumn
                        ? "bg-taupe-100 dark:bg-taupe-800 hover:bg-red-100 dark:hover:bg-red-900 text-red-800 dark:text-red-300"
                        : "opacity-40 cursor-not-allowed text-gray-400"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveColumn(stepIndex);
                      gridRef.current?.focus();
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            {/* Append column at end */}
            <div className="w-8 shrink-0 ml-0.5 flex flex-col">
              <button
                type="button"
                title="Append blank column at end"
                aria-label="Append blank column at end"
                className={clsx(
                  "h-5 leading-none rounded border font-semibold",
                  "border-taupe-400 dark:border-taupe-600",
                  "bg-taupe-100 dark:bg-taupe-800 hover:bg-green-100 dark:hover:bg-green-900",
                  "text-green-800 dark:text-green-300"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleInsertColumn(stepCount);
                  gridRef.current?.focus();
                }}
              >
                +
              </button>
            </div>
          </div>

          {TAB_STRINGS.map((label, stringIndex) => (
            <div key={label} className="flex items-center" role="row">
              <div
                className="w-8 shrink-0 font-mono font-semibold text-lg text-center pr-1"
                aria-hidden
              >
                {label}
              </div>
              {Array.from({ length: stepCount }, (_, stepIndex) => {
                const fret = model.steps[stepIndex][stringIndex];
                const selected =
                  cursor.stringIndex === stringIndex && cursor.stepIndex === stepIndex;
                const barStart = stepIndex > 0 && stepIndex % DEFAULT_BAR_EVERY === 0;
                return (
                  <button
                    key={`${label}-${stepIndex}`}
                    type="button"
                    role="gridcell"
                    aria-label={`${label} string, step ${stepIndex + 1}${
                      fret === null ? ", empty" : `, fret ${fret}`
                    }`}
                    aria-selected={selected}
                    className={clsx(
                      "w-8 h-8 shrink-0 font-mono text-lg transition-colors",
                      "flex items-center justify-center",
                      barStart && "ml-1",
                      selected
                        ? "bg-orange-200 dark:bg-orange-900 ring-2 ring-orange-500 z-10"
                        : "dark:border-taupe-600 bg-white/70 dark:bg-taupe-800 hover:border-orange-400"
                    )}
                    onClick={() => {
                      setCursor({ stringIndex, stepIndex });
                      gridRef.current?.focus();
                    }}
                  >
                    {cellDisplayChar(fret)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">
          Fret keypad
          {selectedFret !== null && (
            <span className="ml-2">
              (selected: fret {selectedFret}
              {selectedFret >= 10 ? ` → ${cellDisplayChar(selectedFret)}` : ""})
            </span>
          )}
        </p>
        <Flex gap="gap-1" className="flex-wrap">
          {KEYPAD_FRETS.map((f) => (
            <button
              key={f}
              type="button"
              className={clsx(
                "min-w-9 h-9 px-2 rounded border font-mono text-sm",
                "border-taupe-400 dark:border-taupe-600",
                "bg-taupe-100 dark:bg-taupe-800 hover:bg-orange-100 dark:hover:bg-orange-900",
                selectedFret === f && "ring-2 ring-orange-500"
              )}
              onClick={() => {
                placeFret(f);
                gridRef.current?.focus();
              }}
            >
              {f}
            </button>
          ))}
          <IconButton
            type="button"
            color="secondary"
            variant="outlined"
            size="sm"
            className="min-w-9 h-9"
            title="Clear cell"
            onClick={() => {
              clearCell();
              gridRef.current?.focus();
            }}
          >
            <i className="fa-solid fa-delete-left" />
          </IconButton>
        </Flex>
      </div>

      {showMarkupPreview && (
        <div>
          <label className="text-xs text-gray-500 block mb-1" htmlFor="tab-markup-preview">
            Markup preview
          </label>
          <pre
            id="tab-markup-preview"
            className="font-mono text-xs p-3 rounded-lg bg-taupe-100 dark:bg-taupe-900 border border-taupe-400 dark:border-taupe-600 overflow-x-auto whitespace-pre"
          >
            {markup}
          </pre>
        </div>
      )}
    </div>
  );
}
