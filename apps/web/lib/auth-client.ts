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
    useSession,
    requestPasswordReset,
    resetPassword,
    sendVerificationEmail,
} = authClient;

export const getBearerToken = () =>
    typeof window !== "undefined"
        ? localStorage.getItem("bearer_token")
        : null;
