/**
 * First-party "probably signed in" marker.
 *
 * better-auth's session cookie belongs to the API's host. When the web app is
 * served from a different site (e.g. *.vercel.app while the API is on
 * *.onrender.com) the browser never attaches that cookie to requests for the
 * web app, so `middleware.ts` cannot see it. The client sets this cookie on
 * the web app's own origin whenever it learns it has a session, and clears it
 * on sign-out or when the session is found to be gone. It carries no secret —
 * it is a hint for the optimistic middleware gate; `AuthGuard` remains the
 * source of truth.
 */
export const SESSION_MARKER_COOKIE = "vexio_session";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

const secureSuffix = () =>
    typeof window !== "undefined" && window.location.protocol === "https:"
        ? "; Secure"
        : "";

export const setSessionMarker = () => {
    if (typeof document === "undefined") return;
    document.cookie = `${SESSION_MARKER_COOKIE}=1; Path=/; Max-Age=${THIRTY_DAYS}; SameSite=Lax${secureSuffix()}`;
};

export const clearSessionMarker = () => {
    if (typeof document === "undefined") return;
    document.cookie = `${SESSION_MARKER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secureSuffix()}`;
};
