/** Name of the JWT session cookie. */
export const TOKEN_COOKIE = "session";

/**
 * Cookie options for the session JWT.
 *
 * Preferred production setup: Vercel rewrites `/api/*` to the Render API so the
 * browser only talks to the frontend origin (same-site). SameSite=Lax works.
 *
 * If the frontend calls the API host directly (no rewrite), set
 * CROSS_ORIGIN_COOKIES=true so cookies use SameSite=None; Secure.
 */
export function getSessionCookieOptions(req) {
  const isHttps = isHttpsRequest(req);
  const crossOrigin = process.env.CROSS_ORIGIN_COOKIES === "true";

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps && crossOrigin ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

/** Options for clearCookie — must match attributes used when setting the cookie. */
export function getSessionCookieClearOptions(req) {
  const { httpOnly, secure, sameSite, path } = getSessionCookieOptions(req);
  return { httpOnly, secure, sameSite, path };
}

function isHttpsRequest(req) {
  if (process.env.NODE_ENV === "production") return true;
  // Render sets RENDER=true; TLS is terminated at the proxy.
  if (process.env.RENDER === "true") return true;

  if (req?.secure === true) return true;

  const forwarded = req?.headers?.["x-forwarded-proto"];
  if (typeof forwarded === "string") {
    const proto = forwarded.split(",")[0].trim().toLowerCase();
    if (proto === "https") return true;
  }

  return false;
}
