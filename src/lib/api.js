const API_BASE = import.meta.env.VITE_API_URL || '';

export async function apiRequest(path, options = {}) {
    // Ensure path starts with /
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${API_BASE}${fullPath}`;

    const response = await fetch(url, {
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

    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
            const payload = await response.json();
            if (payload?.error) {
                errorMessage = payload.error;
            }
        } catch {
            // Ignore parse failures
        }
        throw new Error(errorMessage);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}