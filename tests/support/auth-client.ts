// Shared helpers for tests/integration/*.test.ts — thin wrappers around the
// better-auth REST surface mounted at /api/auth/* by apps/http-server
// (apps/http-server/index.ts: `app.all("/api/auth/*splat", toNodeHandler(auth))`).
//
// Adapted from the manual E2E script at /mnt/a/Codebase/Vexio/scratch-wstest.mjs.
// Read-only against application source — these only ever call the HTTP API.

export type Credentials = {
    email: string;
    password: string;
    name: string;
};

/** POST /api/auth/sign-up/email. Does not return a session — sign in after. */
export async function signUp(httpBase: string, creds: Credentials): Promise<Response> {
    return fetch(`${httpBase}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(creds),
    });
}

/**
 * POST /api/auth/sign-in/email and capture the bearer token from the
 * `set-auth-token` response header (better-auth's bearer plugin — see the
 * CORS `exposedHeaders: ["set-auth-token"]` in apps/http-server/index.ts).
 */
export async function signIn(
    httpBase: string,
    email: string,
    password: string
): Promise<string> {
    const res = await fetch(`${httpBase}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const bearer = res.headers.get("set-auth-token");
    if (!bearer) {
        const body = await res.text().catch(() => "<unreadable body>");
        throw new Error(
            `sign-in for ${email} did not return a set-auth-token header (status ${res.status}): ${body}`
        );
    }
    return bearer;
}

/** Convenience: sign up a throwaway user, then sign in and return their bearer token. */
export async function signUpAndSignIn(httpBase: string, creds: Credentials): Promise<string> {
    const signUpRes = await signUp(httpBase, creds);
    if (!signUpRes.ok) {
        const body = await signUpRes.text().catch(() => "<unreadable body>");
        throw new Error(`sign-up for ${creds.email} failed (status ${signUpRes.status}): ${body}`);
    }
    return signIn(httpBase, creds.email, creds.password);
}

/** A throwaway-but-recognizable set of credentials for a single test run. */
export function makeThrowawayUser(label: string, runId: number | string): Credentials {
    return {
        email: `vexio-it-${label}-${runId}@example.com`,
        password: "Password123!",
        name: `Vexio IT ${label}`,
    };
}
