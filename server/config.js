import "dotenv/config";

const env = process.env;

export const config = {
  port: Number(env.API_PORT ?? 3001),
  couchUrl: env.COUCHDB_URL ?? "http://admin:password@127.0.0.1:5984",
  dbName: env.COUCHDB_DB_NAME ?? "songs",
  sessionSecret: env.SESSION_SECRET ?? "dev-only-session-secret"
};
