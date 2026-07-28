import { describe, it, expect } from "vitest";
import { OPEN_FREQUENCIES } from "./tabAudio.js";
import {
  A4_HZ,
  IN_TUNE_CENTS,
  frequencyToMidi,
  midiToFrequency,
  frequencyToNote,
  noteFromMidi,
  centsBetween,
  nearestOpenString,
  stableNearestOpenString,
  advanceLockedNote,
  openStringByLabel,
  isInTune,
  clampCentsForMeter,
  tuningStatus,
} from "./pitchMath.js";

describe("frequencyToMidi / midiToFrequency", () => {
  it("maps A4 to MIDI 69", () => {
    expect(frequencyToMidi(440)).toBeCloseTo(69, 5);
    expect(midiToFrequency(69)).toBeCloseTo(440, 5);
  });

  it("is inverse for common notes", () => {
    for (const midi of [60, 64, 67, 69, 71]) {
      const hz = midiToFrequency(midi);
      expect(frequencyToMidi(hz)).toBeCloseTo(midi, 5);
    }
  });

  it("returns null for invalid input", () => {
    expect(frequencyToMidi(0)).toBeNull();
    expect(frequencyToMidi(-1)).toBeNull();
    expect(frequencyToMidi(NaN)).toBeNull();
    expect(midiToFrequency(NaN)).toBeNull();
  });
});

describe("frequencyToNote", () => {
  it("identifies A4", () => {
    const note = frequencyToNote(440);
    expect(note).toMatchObject({ name: "A", octave: 4, midi: 69, label: "A4" });
    expect(note.cents).toBeCloseTo(0, 1);
  });

  it("identifies open ukulele strings near their targets", () => {
    expect(frequencyToNote(OPEN_FREQUENCIES.A).label).toBe("A4");
    expect(frequencyToNote(OPEN_FREQUENCIES.E).label).toBe("E4");
    expect(frequencyToNote(OPEN_FREQUENCIES.C).label).toBe("C4");
    expect(frequencyToNote(OPEN_FREQUENCIES.G).label).toBe("G4");
  });

  it("reports cents for a slightly sharp pitch", () => {
    // One semitone above A4 is ~466.16; halfway in cents space is ~10 cents via 2^(10/1200)
    const sharp = 440 * 2 ** (10 / 1200);
    const note = frequencyToNote(sharp);
    expect(note.label).toBe("A4");
    expect(note.cents).toBeCloseTo(10, 0);
  });

  it("returns null for invalid frequency", () => {
    expect(frequencyToNote(0)).toBeNull();
    expect(frequencyToNote(-5)).toBeNull();
  });
});

describe("centsBetween", () => {
  it("is 0 for equal frequencies", () => {
    expect(centsBetween(440, 440)).toBeCloseTo(0, 5);
  });

  it("is +100 for one semitone up", () => {
    const up = 440 * 2 ** (1 / 12);
    expect(centsBetween(up, 440)).toBeCloseTo(100, 1);
  });

  it("is -100 for one semitone down", () => {
    const down = 440 * 2 ** (-1 / 12);
    expect(centsBetween(down, 440)).toBeCloseTo(-100, 1);
  });

  it("returns null for invalid inputs", () => {
    expect(centsBetween(0, 440)).toBeNull();
    expect(centsBetween(440, 0)).toBeNull();
  });
});

describe("nearestOpenString", () => {
  it("matches each open frequency to its string", () => {
    for (const [label, hz] of Object.entries(OPEN_FREQUENCIES)) {
      const nearest = nearestOpenString(hz);
      expect(nearest.label).toBe(label);
      expect(nearest.cents).toBeCloseTo(0, 1);
    }
  });

  it("picks C when slightly flat of C4", () => {
    const flatC = OPEN_FREQUENCIES.C * 2 ** (-5 / 1200);
    const nearest = nearestOpenString(flatC);
    expect(nearest.label).toBe("C");
    expect(nearest.cents).toBeCloseTo(-5, 0);
  });

  it("returns null for invalid frequency", () => {
    expect(nearestOpenString(0)).toBeNull();
  });
});

describe("openStringByLabel", () => {
  it("resolves G/C/E/A case-insensitively", () => {
    expect(openStringByLabel("a").frequency).toBe(OPEN_FREQUENCIES.A);
    expect(openStringByLabel("G").note).toBe("G4");
  });

  it("returns null for unknown labels", () => {
    expect(openStringByLabel("X")).toBeNull();
    expect(openStringByLabel("")).toBeNull();
  });
});

describe("isInTune / tuningStatus / clampCentsForMeter", () => {
  it("treats |cents| within default window as in tune", () => {
    expect(isInTune(0)).toBe(true);
    expect(isInTune(IN_TUNE_CENTS)).toBe(true);
    expect(isInTune(-(IN_TUNE_CENTS))).toBe(true);
    expect(isInTune(IN_TUNE_CENTS + 1)).toBe(false);
  });

  it("maps cents to tuning status", () => {
    expect(tuningStatus(null)).toBe("idle");
    expect(tuningStatus(-20)).toBe("flat");
    expect(tuningStatus(0)).toBe("in-tune");
    expect(tuningStatus(3)).toBe("in-tune");
    expect(tuningStatus(20)).toBe("sharp");
  });

  it("clamps meter cents to range", () => {
    expect(clampCentsForMeter(80, 50)).toBe(50);
    expect(clampCentsForMeter(-80, 50)).toBe(-50);
    expect(clampCentsForMeter(12, 50)).toBe(12);
  });
});

describe("A4_HZ constant", () => {
  it("is concert pitch 440", () => {
    expect(A4_HZ).toBe(440);
  });
});

describe("advanceLockedNote", () => {
  it("locks the first detected note", () => {
    const s = advanceLockedNote(
      { lockedMidi: null, candidateMidi: null, candidateCount: 0 },
      440,
    );
    expect(s.lockedMidi).toBe(69);
    expect(s.note.label).toBe("A4");
    expect(s.note.cents).toBeCloseTo(0, 1);
  });

  it("keeps the lock for small drifts", () => {
    let s = advanceLockedNote(
      { lockedMidi: null, candidateMidi: null, candidateCount: 0 },
      440,
    );
    const sharp = 440 * 2 ** (20 / 1200); // +20 cents, still A4
    s = advanceLockedNote(s, sharp);
    expect(s.lockedMidi).toBe(69);
    expect(s.note.label).toBe("A4");
    expect(s.note.cents).toBeCloseTo(20, 0);
  });

  it("requires several frames before switching notes", () => {
    let s = advanceLockedNote(
      { lockedMidi: null, candidateMidi: null, candidateCount: 0 },
      440,
    );
    // A#4 ≈ 466.16
    const aSharp = 440 * 2 ** (1 / 12);
    s = advanceLockedNote(s, aSharp, { switchConfirm: 3 });
    expect(s.lockedMidi).toBe(69); // still A
    s = advanceLockedNote(s, aSharp, { switchConfirm: 3 });
    expect(s.lockedMidi).toBe(69);
    s = advanceLockedNote(s, aSharp, { switchConfirm: 3 });
    expect(s.lockedMidi).toBe(70); // switched
    expect(s.note.label).toBe("A#4");
  });
});

describe("stableNearestOpenString", () => {
  it("sticks to the locked string near midpoints", () => {
    // Midpoint-ish between C and E in cents space still closer to one;
    // with lock on C, require clear margin to switch.
    const slightlyTowardE = OPEN_FREQUENCIES.C * 2 ** (30 / 1200);
    const stuck = stableNearestOpenString(slightlyTowardE, "C", 25);
    expect(stuck.label).toBe("C");
  });

  it("switches when clearly closer to another open string", () => {
    const nearE = OPEN_FREQUENCIES.E * 2 ** (2 / 1200);
    const next = stableNearestOpenString(nearE, "C", 25);
    expect(next.label).toBe("E");
  });
});

describe("noteFromMidi", () => {
  it("formats midi and cents against measured hz", () => {
    const n = noteFromMidi(69, 440 * 2 ** (10 / 1200));
    expect(n.label).toBe("A4");
    expect(n.cents).toBeCloseTo(10, 0);
  });
});
