import { describe, it, expect } from "vitest";
import {
  TAB_STRINGS,
  fretToChar,
  charToFret,
  createEmptyTab,
  serializeTab,
  parseTabBlock,
  setCell,
  addSteps,
  insertStep,
  removeStep,
  clearTab,
  MAX_FRET,
} from "./tabs.js";

describe("fretToChar / charToFret", () => {
  it("maps 0-9 and empty", () => {
    expect(fretToChar(null)).toBe("-");
    expect(fretToChar(undefined)).toBe("-");
    expect(fretToChar(0)).toBe("0");
    expect(fretToChar(9)).toBe("9");
    expect(charToFret("-")).toBe(null);
    expect(charToFret("0")).toBe(0);
    expect(charToFret("9")).toBe(9);
  });

  it("maps frets 10+ to letters a, b, c, ...", () => {
    expect(fretToChar(10)).toBe("a");
    expect(fretToChar(11)).toBe("b");
    expect(fretToChar(12)).toBe("c");
    expect(fretToChar(15)).toBe("f");
    expect(charToFret("a")).toBe(10);
    expect(charToFret("b")).toBe(11);
    expect(charToFret("c")).toBe(12);
  });

  it("decodes letter frets case-insensitively", () => {
    expect(charToFret("A")).toBe(10);
    expect(charToFret("B")).toBe(11);
    expect(charToFret("C")).toBe(12);
  });

  it("rejects frets above MAX_FRET", () => {
    expect(fretToChar(MAX_FRET + 1)).toBe("-");
  });
});

describe("createEmptyTab", () => {
  it("creates 16 empty steps by default", () => {
    const tab = createEmptyTab();
    expect(tab.steps).toHaveLength(16);
    expect(tab.steps[0]).toEqual([null, null, null, null]);
    expect(TAB_STRINGS).toEqual(["A", "E", "C", "G"]);
  });
});

describe("serializeTab / parseTabBlock", () => {
  it("serializes empty tab with bar markers every 8 steps", () => {
    const tab = createEmptyTab(16);
    const text = serializeTab(tab);
    expect(text).toContain("[|");
    expect(text).toContain("|]");
    expect(text).toContain("A|");
    expect(text).toContain("E|");
    expect(text).toContain("C|");
    expect(text).toContain("G|");
    // bars every 8 steps (eighth-note columns): --------|--------
    expect(text).toMatch(/A\|-{8}\|-{8}/);
  });

  it("round-trips frets including a/b/c", () => {
    let tab = createEmptyTab(8);
    tab = setCell(tab, 0, 0, 3); // A step 0 → 3
    tab = setCell(tab, 1, 1, 0); // E step 1 → 0
    tab = setCell(tab, 2, 2, 10); // C step 2 → a
    tab = setCell(tab, 3, 3, 12); // G step 3 → c

    const markup = serializeTab(tab, { barEvery: 0 });
    expect(markup).toContain("A|3-------");
    expect(markup).toContain("E|-0------");
    expect(markup).toContain("C|--a-----");
    expect(markup).toContain("G|---c----");

    const parsed = parseTabBlock(markup);
    expect(parsed.steps[0][0]).toBe(3);
    expect(parsed.steps[1][1]).toBe(0);
    expect(parsed.steps[2][2]).toBe(10);
    expect(parsed.steps[3][3]).toBe(12);
  });

  it("parses bar markers and spaces without counting them as frets", () => {
    const markup = `[|
A|3-0-|a---|
E|---0|----|
C|----|----|
G|----|----|
|]`;
    const parsed = parseTabBlock(markup);
    // A|3-0-|a---|  → steps: 3, -, 0, -, a, ...
    expect(parsed.steps[0][0]).toBe(3);
    expect(parsed.steps[2][0]).toBe(0);
    expect(parsed.steps[4][0]).toBe(10);
  });

  it("ignores junk lines", () => {
    const markup = `[|
not a string
A|0---
E|----
C|----
G|----
|]`;
    const parsed = parseTabBlock(markup);
    expect(parsed.steps[0][0]).toBe(0);
  });

  it("parses raw lines without outer markers", () => {
    const parsed = parseTabBlock("A|12\nE|--\nC|--\nG|--");
    expect(parsed.steps[0][0]).toBe(1);
    expect(parsed.steps[1][0]).toBe(2);
  });
});

describe("setCell / addSteps / insertStep / removeStep / clearTab", () => {
  it("setCell is immutable and clamps frets", () => {
    const tab = createEmptyTab(4);
    const next = setCell(tab, 0, 1, 5);
    expect(tab.steps[1][0]).toBe(null);
    expect(next.steps[1][0]).toBe(5);
    expect(setCell(tab, 0, 0, 99).steps[0][0]).toBe(null);
  });

  it("addSteps appends empty columns", () => {
    const tab = addSteps(createEmptyTab(2), 3);
    expect(tab.steps).toHaveLength(5);
  });

  it("insertStep shifts frets right and leaves empty column", () => {
    let tab = setCell(createEmptyTab(3), 0, 1, 5); // A at step 1
    tab = insertStep(tab, 1);
    expect(tab.steps).toHaveLength(4);
    expect(tab.steps[1][0]).toBe(null);
    expect(tab.steps[2][0]).toBe(5);
  });

  it("insertStep at end appends", () => {
    const tab = insertStep(createEmptyTab(2), 2);
    expect(tab.steps).toHaveLength(3);
  });

  it("removeStep shifts frets left and keeps at least one column", () => {
    let tab = setCell(createEmptyTab(3), 0, 2, 7);
    tab = removeStep(tab, 0);
    expect(tab.steps).toHaveLength(2);
    expect(tab.steps[1][0]).toBe(7);
    tab = removeStep(tab, 0);
    tab = removeStep(tab, 0);
    expect(tab.steps).toHaveLength(1);
  });

  it("clearTab zeros frets but keeps length", () => {
    let tab = setCell(createEmptyTab(4), 0, 0, 7);
    tab = clearTab(tab);
    expect(tab.steps).toHaveLength(4);
    expect(tab.steps[0][0]).toBe(null);
  });
});
