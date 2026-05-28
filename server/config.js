import "dotenv/config";

const env = process.env;

export const config = {
    port: Number(env.API_PORT ?? 5000),
    sessionSecret: env.SESSION_SECRET ?? "dev-only-session-secret",
};
