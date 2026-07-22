"use client";

import { createAuthClient } from "better-auth/react";

const authBaseUrl =
    process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:8000";

export const authClient = createAuthClient({
    baseURL: authBaseUrl,
    fetchOptions: {
        credentials: "include",
        auth: {
            type: "Bearer",
            token: () =>
                typeof window !== "undefined"
                    ? localStorage.getItem("bearer_token") ?? ""
                    : "",
        },
        onSuccess: (ctx) => {
            const authToken = ctx.response.headers.get("set-auth-token");
            if (authToken) {
                localStorage.setItem("bearer_token", authToken);
            }
        },
        onResponse: (ctx) => {
            const authToken = ctx.response.headers.get("set-auth-token");
            if (authToken) {
                localStorage.setItem("bearer_token", authToken);
            }
        },
    },
});

export const {
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    resetPassword,
    sendVerificationEmail,
} = authClient;

// Annotate explicitly against the local `authClient` value. Destructuring
// `useSession` lets TS infer a type that points into better-auth's internal
// `dist/client/types.d.mts`, which isn't portable in emitted declarations
// (TS2742). `typeof authClient.useSession` names it via a symbol in this file.
export const useSession: typeof authClient.useSession = authClient.useSession;

export const getBearerToken = () =>
    typeof window !== "undefined"
        ? localStorage.getItem("bearer_token")
        : null;

export const clearBearerToken = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("bearer_token");
    }
};

// The ws-server authenticates from the bearer token in localStorage, but
// better-auth only emits `set-auth-token` on **sign-in** — not on sign-up, and
// not on get-session. So a user who just signed up has no token at all, and an
// expired one is never replaced. Either way the socket is rejected with close
// code 4001 while REST keeps working off the session cookie, which is exactly
// the "everything loads but it says offline" failure.
//
// `GET /api/v1/ws-token` (apps/http-server) hands back the current session's
// token for any cookie- or bearer-authenticated caller, so we can always mint
// a working one. Returns null when the session is genuinely gone.
export const refreshBearerToken = async (): Promise<string | null> => {
    if (typeof window === "undefined") return null;

    try {
        const res = await fetch(`${authBaseUrl}/api/v1/ws-token`, {
            credentials: "include",
            headers: getBearerToken()
                ? { authorization: `Bearer ${getBearerToken()}` }
                : undefined,
        });
        if (!res.ok) return null;

        const token = (await res.json())?.data?.token;
        if (typeof token !== "string" || !token) return null;

        localStorage.setItem("bearer_token", token);
        return token;
    } catch {
        return null;
    }
};
