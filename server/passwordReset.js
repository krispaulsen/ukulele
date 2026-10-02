import crypto from "node:crypto";

export const FORGOT_PASSWORD_MESSAGE =
    "If an account exists for that email, we sent a password reset link.";

export const RESET_TOKEN_HEX_LENGTH = 64;
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_MAX_PER_EMAIL = 3;
export const RATE_LIMIT_MAX_PER_IP = 10;

const rateLimitBuckets = new Map();

export function createResetToken() {
    return crypto.randomBytes(32).toString("hex");
}

export function hashResetToken(rawToken) {
    return crypto.createHash("sha256").update(String(rawToken ?? ""), "utf8").digest("hex");
}

export function buildResetUrl(frontendUrl, rawToken) {
    const base = String(frontendUrl ?? "").trim().replace(/\/$/, "") || "http://localhost:5173";
    // HashRouter: the SPA route lives in the hash, token in the query inside it.
    return `${base}/#/auth/reset?token=${encodeURIComponent(String(rawToken ?? ""))}`;
}

export function normalizeEmail(value) {
    return String(value ?? "").trim().toLowerCase();
}

export function getClientIp(req) {
    if (req?.ip) return String(req.ip);
    const forwarded = req?.headers?.["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
        return forwarded.split(",")[0].trim();
    }
    const remote = req?.socket?.remoteAddress;
    return remote ? String(remote) : "unknown";
}

export function clearPasswordResetRateLimits() {
    rateLimitBuckets.clear();
}

export function consumeRateLimit(key, { max, windowMs, now = Date.now() } = {}) {
    const current = rateLimitBuckets.get(key);
    if (!current || current.resetAt <= now) {
        rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
        return { limited: false, retryAfterMs: 0 };
    }
    if (current.count >= max) {
        return { limited: true, retryAfterMs: Math.max(0, current.resetAt - now) };
    }
    current.count += 1;
    return { limited: false, retryAfterMs: 0 };
}

export function consumeForgotPasswordRateLimits(email, ip, now = Date.now()) {
    const emailLimit = consumeRateLimit(`email:${email}`, {
        max: RATE_LIMIT_MAX_PER_EMAIL,
        windowMs: RATE_LIMIT_WINDOW_MS,
        now,
    });
    const ipLimit = consumeRateLimit(`ip:${ip}`, {
        max: RATE_LIMIT_MAX_PER_IP,
        windowMs: RATE_LIMIT_WINDOW_MS,
        now,
    });
    if (emailLimit.limited || ipLimit.limited) {
        return {
            limited: true,
            retryAfterMs: Math.max(emailLimit.retryAfterMs, ipLimit.retryAfterMs),
        };
    }
    return { limited: false, retryAfterMs: 0 };
}
