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
