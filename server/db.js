import nano from "nano";
import { config } from "./config.js";

const couch = nano(config.couchUrl);

export async function ensureDb() {
    const dbs = await couch.db.list();
    if (!dbs.includes(config.dbName)) {
        await couch.db.create(config.dbName);
    }
}

export function songsDb() {
    return couch.db.use(config.dbName);
}
