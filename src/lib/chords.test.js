import { describe, it, expect } from "vitest";
import { transposeChord, normalizeSemitones } from "./chords.js";

describe("normalizeSemitones", () => {
  it("maps into 0..11", () => {
    expect(normalizeSemitones(0)).toBe(0);
    expect(normalizeSemitones(12)).toBe(0);
    expect(normalizeSemitones(13)).toBe(1);
    expect(normalizeSemitones(-1)).toBe(11);
    expect(normalizeSemitones(-13)).toBe(11);
  });
});

describe("transposeChord", () => {
  it("returns identity at 0 semitones", () => {
    expect(transposeChord("C", 0)).toBe("C");
    expect(transposeChord("Am7", 0)).toBe("Am7");
    expect(transposeChord("G/B", 0)).toBe("G/B");
    expect(transposeChord("C#", 0)).toBe("C#");
  });

  it("transposes natural roots", () => {
    expect(transposeChord("C", 2)).toBe("D");
    expect(transposeChord("G", 2)).toBe("A");
    expect(transposeChord("F", 1)).toBe("Gb"); // prefer flats for black keys
    expect(transposeChord("B", 1)).toBe("C");
  });

  it("wraps around the octave", () => {
    expect(transposeChord("B", 1)).toBe("C");
    expect(transposeChord("C", -1)).toBe("B");
    expect(transposeChord("A", 3)).toBe("C");
  });

  it("treats +13 like +1 (mod 12)", () => {
    expect(transposeChord("C", 13)).toBe(transposeChord("C", 1));
    expect(transposeChord("Am", -11)).toBe(transposeChord("Am", 1));
  });

  it("preserves quality / suffix", () => {
    expect(transposeChord("Am", 2)).toBe("Bm");
    expect(transposeChord("Am7", 2)).toBe("Bm7");
    expect(transposeChord("Gsus4", 2)).toBe("Asus4");
    expect(transposeChord("Cmaj7", 2)).toBe("Dmaj7");
    expect(transposeChord("Dsus2", -2)).toBe("Csus2");
  });

  it("preserves sharp style when root is sharp", () => {
    expect(transposeChord("C#", 2)).toBe("D#");
    expect(transposeChord("F#m", 1)).toBe("Gm"); // G natural — style N/A
    expect(transposeChord("C#7", 1)).toBe("D7");
  });

  it("preserves flat style when root is flat", () => {
    expect(transposeChord("Bb", 2)).toBe("C");
    expect(transposeChord("Eb7", 1)).toBe("E7");
    expect(transposeChord("Abm", 2)).toBe("Bbm");
  });

  it("transposes slash chords (root and bass)", () => {
    // Natural roots prefer flats for black keys → B+2 is Db, not C#
    expect(transposeChord("G/B", 2)).toBe("A/Db");
    expect(transposeChord("C/E", -2)).toBe("Bb/D");
    expect(transposeChord("D/F#", 2)).toBe("E/G#"); // sharp bass stays sharp family
  });

  it("leaves unknown / non-chord strings unchanged", () => {
    expect(transposeChord("(Intro)", 2)).toBe("(Intro)");
    expect(transposeChord("", 2)).toBe("");
    expect(transposeChord("N.C.", 2)).toBe("N.C.");
    expect(transposeChord("1234", 2)).toBe("1234");
  });

  it("handles negative offsets", () => {
    expect(transposeChord("D", -2)).toBe("C");
    expect(transposeChord("Am", -2)).toBe("Gm");
  });
});
