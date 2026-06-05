import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware.js";

const router = Router();

const TOKEN_COOKIE = "session";
const TOKEN_TTL = "7d";

const cookieOptions = (req) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
});

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
        res.cookie(TOKEN_COOKIE, token, cookieOptions(req));

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
        res.cookie(TOKEN_COOKIE, token, cookieOptions(req));

        console.log('api/auth/login user', user);

        res.json({
            user: {
                userId: user._id,
                email: user.email,
                screenName: user.screenName,
                chordColor: user.chordColor,
                chordPosition: user.chordPosition,
                darkMode: user.darkMode,
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Failed to login" });
    }
});

// Get current user
router.get("/me", requireAuth, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user.userId }).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// Logout
router.post("/logout", (req, res) => {
    res.clearCookie(TOKEN_COOKIE);
    res.json({ message: "Logged out" });
});

export default router;
