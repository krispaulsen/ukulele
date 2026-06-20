export async function apiRequest(path, options = {}) {
    const response = await fetch(path, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            ...(options.headers ?? {})
        },
        cache: "no-store",
        ...options
    });

    if (!response.ok && response.status !== 304) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
            const payload = await response.json();
            if (payload?.error) {
                errorMessage = payload.error;
            }
        } catch {
            // Ignore parse failures and keep status-based error.
        }
        throw new Error(errorMessage);
    }

    if (response.status === 204 || response.status === 304) {
        return null;
    }

    return response.json();
}
