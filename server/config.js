import "dotenv/config";

const env = process.env;

const smtpPort = Number(env.SMTP_PORT ?? 587);

export const config = {
    port: Number(env.API_PORT ?? 5000),
    sessionSecret: env.SESSION_SECRET ?? "dev-only-session-secret",
    frontendUrl: env.FRONTEND_URL || "http://localhost:5173",
    passwordResetTtlMs: 60 * 60 * 1000,
    exposePasswordResetLink: resolveExposePasswordResetLink(env),
    smtp: {
        host: env.SMTP_HOST || "",
        port: Number.isFinite(smtpPort) ? smtpPort : 587,
        user: env.SMTP_USER || "",
        pass: env.SMTP_PASS || "",
        from: env.MAIL_FROM || "My Ukulele Songbook <noreply@localhost>",
        secure: env.SMTP_SECURE === "true" || smtpPort === 465,
    },
};

function resolveExposePasswordResetLink(processEnv) {
    if (processEnv.EXPOSE_PASSWORD_RESET_LINK === "true") return true;
    if (processEnv.EXPOSE_PASSWORD_RESET_LINK === "false") return false;
    return processEnv.NODE_ENV !== "production";
}
