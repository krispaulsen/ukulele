import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import User from "../models/User.js";
import {
    TOKEN_COOKIE,
    getSessionCookieOptions,
    getSessionCookieClearOptions,
} from "../sessionCookie.js";
import { sendPasswordResetEmail } from "../mailer.js";
import {
    FORGOT_PASSWORD_MESSAGE,
    buildResetUrl,
    consumeForgotPasswordRateLimits,
    createResetToken,
    getClientIp,
    hashResetToken,
    normalizeEmail,
} from "../passwordReset.js";

const router = Router();

const TOKEN_TTL = "7d";

function formatAuthUser(user) {
    return {
        userId: user._id,
        email: user.email,
        screenName: user.screenName,
        chordColor: user.chordColor,
        chordPosition: user.chordPosition,
        darkMode: user.darkMode,
        preferredAccidentals: user.preferredAccidentals || "flats",
    };
}

// Register
router.post("/register", async (req, res) => {
    const { email, password, screenName } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            email,
            password: hashedPassword,
            screenName: screenName || ""
        });

        const token = jwt.sign({ userId: user._id }, config.sessionSecret, { expiresIn: TOKEN_TTL });
        res.cookie(TOKEN_COOKIE, token, getSessionCookieOptions(req));

        res.status(201).json({
            user: { userId: user._id, email, screenName: user.screenName }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Failed to register" });
    }
});

// Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }); // TODO: findOneAndUpdate to set lastLogin
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user._id }, config.sessionSecret, { expiresIn: TOKEN_TTL });
        res.cookie(TOKEN_COOKIE, token, getSessionCookieOptions(req));

        console.log('api/auth/login user', user);

        res.json({
            user: formatAuthUser(user)
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Failed to login" });
    }
});

// Get current user (or null if not logged in). This endpoint is intentionally
// public so that the client can hydrate auth state without causing a 401
// console error for unauthenticated visitors.
router.get("/me", async (req, res) => {
    try {
        if (!req.user) {
            // Clear any invalid/stale session cookie that failed verification
            if (req.cookies && req.cookies[TOKEN_COOKIE]) {
                res.clearCookie(TOKEN_COOKIE, getSessionCookieClearOptions(req));
            }
            return res.json({ user: null });
        }

        const user = await User.findOne({ _id: req.user.userId }).select("-password");
        if (!user) {
            res.clearCookie(TOKEN_COOKIE, getSessionCookieClearOptions(req));
            return res.json({ user: null });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// Logout
router.post("/logout", (req, res) => {
    res.clearCookie(TOKEN_COOKIE, getSessionCookieClearOptions(req));
    res.json({ message: "Logged out" });
});

// Request a password reset email. Always returns the same message so callers
// cannot tell whether the address has an account.
router.post("/forgot-password", async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    const rate = consumeForgotPasswordRateLimits(email, getClientIp(req));
    if (rate.limited) {
        res.set("Retry-After", String(Math.max(1, Math.ceil(rate.retryAfterMs / 1000))));
        return res.status(429).json({ error: "Please wait before requesting another reset email." });
    }

    const generic = { message: FORGOT_PASSWORD_MESSAGE };

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.json(generic);
        }

        const rawToken = createResetToken();
        user.passwordResetToken = hashResetToken(rawToken);
        user.passwordResetExpires = new Date(Date.now() + config.passwordResetTtlMs);
        await user.save();

        const resetUrl = buildResetUrl(config.frontendUrl, rawToken);

        try {
            await sendPasswordResetEmail({ to: user.email, resetUrl });
        } catch (mailError) {
            console.error("Failed to send password reset email:", mailError);
        }

        if (config.exposePasswordResetLink) {
            console.log(`Password reset link for ${user.email}: ${resetUrl}`);
            return res.json({ ...generic, resetUrl });
        }

        return res.json(generic);
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ error: "Failed to process password reset request" });
    }
});

// Set a new password from a reset token and start a session.
router.post("/reset-password", async (req, res) => {
    const token = String(req.body?.token ?? "").trim();
    const password = String(req.body?.password ?? "");

    if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    try {
        const user = await User.findOne({
            passwordResetToken: hashResetToken(token),
            passwordResetExpires: { $gt: new Date() },
        }).select("+passwordResetToken +passwordResetExpires");

        if (!user) {
            return res.status(400).json({ error: "This reset link is invalid or has expired" });
        }

        user.password = await bcrypt.hash(password, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        const sessionToken = jwt.sign({ userId: user._id }, config.sessionSecret, { expiresIn: TOKEN_TTL });
        res.cookie(TOKEN_COOKIE, sessionToken, getSessionCookieOptions(req));

        res.json({ user: formatAuthUser(user) });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ error: "Failed to reset password" });
    }
});

export default router;
