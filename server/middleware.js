import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { TOKEN_COOKIE, getSessionCookieClearOptions } from "./sessionCookie.js";

// Attach req.user if a valid session cookie is present (non-blocking)
export const attachUser = (req, _res, next) => {
    const token = req.cookies[TOKEN_COOKIE];
    if (!token) {
        req.user = null;
        return next();
    }
    try {
        req.user = jwt.verify(token, config.sessionSecret);
    } catch {
        req.user = null;
    }
    next();
};

// Require a valid session or reject with 401
export const requireAuth = (req, res, next) => {
    if (!req.user) {
        res.clearCookie(TOKEN_COOKIE, getSessionCookieClearOptions(req));
        return res.status(401).json({ error: "Authentication required" });
    }
    next();
};
