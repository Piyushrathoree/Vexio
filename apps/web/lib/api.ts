import { getBearerToken } from "./auth-client";

const apiBaseUrl =
    process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:8000";

export const apiFetch = async (
    path: string,
    init: RequestInit = {}
): Promise<Response> => {
    const headers = new Headers(init.headers);
    const token = getBearerToken();

    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    if (!headers.has("Content-Type") && init.body) {
        headers.set("Content-Type", "application/json");
    }

    return fetch(`${apiBaseUrl}${path}`, {
        ...init,
        headers,
        credentials: "include",
    });
};
