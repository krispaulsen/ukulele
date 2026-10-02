/** Read a password-reset token from the reset page URL (hash preferred, query fallback). */
export function parseResetToken({ search = "", hash = "" } = {}) {
    const query = String(search ?? "");
    const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
    const fromQuery = String(params.get("token") ?? "").trim();
    if (fromQuery) return fromQuery;

    const rawHash = String(hash ?? "").replace(/^#/, "");
    if (!rawHash) return "";
    if (rawHash.startsWith("token=")) {
        const value = rawHash.slice("token=".length);
        try {
            return decodeURIComponent(value);
        } catch {
            return value;
        }
    }
    return rawHash.trim();
}
