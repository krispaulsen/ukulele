import { describe, it, expect, beforeEach } from "vitest";
import {
  FORGOT_PASSWORD_MESSAGE,
  RATE_LIMIT_MAX_PER_EMAIL,
  RESET_TOKEN_HEX_LENGTH,
  buildResetUrl,
  clearPasswordResetRateLimits,
  consumeForgotPasswordRateLimits,
  consumeRateLimit,
  createResetToken,
  getClientIp,
  hashResetToken,
  normalizeEmail,
} from "./passwordReset.js";
import { buildPasswordResetEmail } from "./mailer.js";

describe("createResetToken / hashResetToken", () => {
  it("creates a 64-character hex token", () => {
    const token = createResetToken();
    expect(token).toMatch(/^[0-9a-f]+$/);
    expect(token).toHaveLength(RESET_TOKEN_HEX_LENGTH);
  });

  it("hashes the same token the same way and does not equal the raw token", () => {
    const token = createResetToken();
    const hash = hashResetToken(token);
    expect(hash).toHaveLength(64);
    expect(hash).not.toBe(token);
    expect(hashResetToken(token)).toBe(hash);
    expect(hashResetToken(token + "x")).not.toBe(hash);
  });
});

describe("buildResetUrl", () => {
  it("puts the token in the HashRouter query and strips a trailing slash", () => {
    expect(buildResetUrl("http://localhost:5173/", "abc123")).toBe(
      "http://localhost:5173/#/auth/reset?token=abc123"
    );
  });

  it("percent-encodes the token", () => {
    expect(buildResetUrl("https://example.com", "a+b")).toBe(
      "https://example.com/#/auth/reset?token=a%2Bb"
    );
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Foo@Example.COM ")).toBe("foo@example.com");
  });

  it("returns empty string for missing values", () => {
    expect(normalizeEmail(undefined)).toBe("");
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail("   ")).toBe("");
  });
});

describe("getClientIp", () => {
  it("prefers req.ip", () => {
    expect(getClientIp({ ip: "1.2.3.4", headers: { "x-forwarded-for": "9.9.9.9" } })).toBe("1.2.3.4");
  });

  it("falls back to the first forwarded address", () => {
    expect(getClientIp({ headers: { "x-forwarded-for": " 8.8.8.8, 1.1.1.1" } })).toBe("8.8.8.8");
  });

  it("returns unknown when nothing is present", () => {
    expect(getClientIp({})).toBe("unknown");
  });
});

describe("consumeRateLimit", () => {
  beforeEach(() => {
    clearPasswordResetRateLimits();
  });

  it("allows up to max hits in the window, then limits", () => {
    const now = 1_000_000;
    const opts = { max: 2, windowMs: 1000, now };
    expect(consumeRateLimit("k", opts).limited).toBe(false);
    expect(consumeRateLimit("k", opts).limited).toBe(false);
    const limited = consumeRateLimit("k", opts);
    expect(limited.limited).toBe(true);
    expect(limited.retryAfterMs).toBe(1000);
  });

  it("resets after the window", () => {
    expect(consumeRateLimit("k", { max: 1, windowMs: 100, now: 0 }).limited).toBe(false);
    expect(consumeRateLimit("k", { max: 1, windowMs: 100, now: 50 }).limited).toBe(true);
    expect(consumeRateLimit("k", { max: 1, windowMs: 100, now: 100 }).limited).toBe(false);
  });
});

describe("consumeForgotPasswordRateLimits", () => {
  beforeEach(() => {
    clearPasswordResetRateLimits();
  });

  it("rate-limits a single email after the per-email max", () => {
    const now = 5_000;
    for (let i = 0; i < RATE_LIMIT_MAX_PER_EMAIL; i += 1) {
      expect(consumeForgotPasswordRateLimits("a@b.c", "1.1.1.1", now).limited).toBe(false);
    }
    expect(consumeForgotPasswordRateLimits("a@b.c", "1.1.1.1", now).limited).toBe(true);
    expect(consumeForgotPasswordRateLimits("other@b.c", "1.1.1.1", now).limited).toBe(false);
  });
});

describe("forgot-password copy", () => {
  it("does not mention whether the account exists", () => {
    expect(FORGOT_PASSWORD_MESSAGE.toLowerCase()).not.toMatch(/not found|no account|doesn't exist/);
    expect(FORGOT_PASSWORD_MESSAGE).toMatch(/if an account exists/i);
  });
});

describe("buildPasswordResetEmail", () => {
  it("includes the reset URL in text and html", () => {
    const url = "http://localhost:5173/#/auth/reset?token=abc";
    const email = buildPasswordResetEmail({ resetUrl: url, ttlMinutes: 60 });
    expect(email.subject).toMatch(/reset/i);
    expect(email.text).toContain(url);
    expect(email.html).toContain(url);
    expect(email.text).toMatch(/60 minutes/);
  });
});
