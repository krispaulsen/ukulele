import { describe, it, expect } from "vitest";
import { parseResetToken } from "./resetToken.js";

describe("parseResetToken", () => {
  it("reads a token from the hash", () => {
    expect(parseResetToken({ hash: "#token=abc123" })).toBe("abc123");
  });

  it("decodes a percent-encoded hash token", () => {
    expect(parseResetToken({ hash: "#token=a%2Bb" })).toBe("a+b");
  });

  it("prefers the query string when present", () => {
    expect(parseResetToken({ search: "?token=from-query", hash: "#token=from-hash" })).toBe("from-query");
  });

  it("treats a bare hash as the token", () => {
    expect(parseResetToken({ hash: "#deadbeef" })).toBe("deadbeef");
  });

  it("returns empty string when nothing is present", () => {
    expect(parseResetToken({})).toBe("");
    expect(parseResetToken({ search: "", hash: "#" })).toBe("");
  });
});
