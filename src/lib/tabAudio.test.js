import { describe, it, expect } from "vitest";
import {
  OPEN_FREQUENCIES,
  fretToFrequency,
  columnNotes,
  stepDurationMs,
} from "./tabAudio.js";
import { createEmptyTab, setCell, parseTabBlock } from "./tabs.js";

describe("fretToFrequency", () => {
  it("returns open-string frequencies at fret 0", () => {
    expect(fretToFrequency("A", 0)).toBeCloseTo(OPEN_FREQUENCIES.A, 1);
    expect(fretToFrequency("E", 0)).toBeCloseTo(OPEN_FREQUENCIES.E, 1);
    expect(fretToFrequency("C", 0)).toBeCloseTo(OPEN_FREQUENCIES.C, 1);
    expect(fretToFrequency("G", 0)).toBeCloseTo(OPEN_FREQUENCIES.G, 1);
  });

  it("raises one octave at fret 12", () => {
    expect(fretToFrequency("A", 12)).toBeCloseTo(OPEN_FREQUENCIES.A * 2, 1);
  });

  it("is case-insensitive on label", () => {
    expect(fretToFrequency("a", 0)).toBeCloseTo(OPEN_FREQUENCIES.A, 1);
  });

  it("returns null for invalid input", () => {
    expect(fretToFrequency("X", 0)).toBeNull();
    expect(fretToFrequency("A", -1)).toBeNull();
  });
});

describe("columnNotes", () => {
  it("collects fretted strings for a step", () => {
    let model = createEmptyTab(4);
    model = setCell(model, 0, 1, 3); // A
    model = setCell(model, 1, 1, 0); // E
    const notes = columnNotes(model, 1);
    expect(notes).toHaveLength(2);
    expect(notes.map((n) => n.stringLabel).sort()).toEqual(["A", "E"]);
    expect(notes.find((n) => n.stringLabel === "A").fret).toBe(3);
  });

  it("returns empty array for rests", () => {
    expect(columnNotes(createEmptyTab(2), 0)).toEqual([]);
  });

  it("works with parsed markup including letter frets", () => {
    const model = parseTabBlock(`[|
A|a---|
E|----|
C|----|
G|----|
|]`);
    const notes = columnNotes(model, 0);
    expect(notes).toHaveLength(1);
    expect(notes[0].fret).toBe(10);
    expect(notes[0].frequency).toBeCloseTo(fretToFrequency("A", 10), 1);
  });
});

describe("stepDurationMs", () => {
  it("computes eighth-note duration from quarter BPM", () => {
    // 120 BPM: quarter = 500ms, eighth = 250ms
    expect(stepDurationMs(120)).toBeCloseTo(250, 5);
    expect(stepDurationMs(60)).toBeCloseTo(500, 5);
  });
});
