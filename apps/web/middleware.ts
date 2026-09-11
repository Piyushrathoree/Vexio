import { NextResponse, type NextRequest } from "next/server";
import { SESSION_MARKER_COOKIE } from "./lib/session-marker";

/**
 * Server-side route guard.
 *
 * This is a *presence* check only: it looks for the better-auth session
 * cookie and redirects unauthenticated requests before the React tree ever
 * renders. It does not validate the session against the database — that
 * still happens wherever the app calls the auth server (e.g. `useSession()`
 * in `components/AuthGuard.tsx`, or any server-side call to
 * `auth.api.getSession`). Treat this middleware as an optimistic,
 * "keep people off the page" gate, not the source of truth.
 *
 * --- Cookie visibility caveat (read before relying on this in prod) -----
 * better-auth (see `packages/auth/auth.ts`) is configured with no
 * `advanced.crossSubDomainCookies` option, so it issues a host-only
 * session cookie named `better-auth.session_token` (or
 * `__Secure-better-auth.session_token` over HTTPS) scoped to whatever host
 * served the auth response — i.e. the host behind `NEXT_PUBLIC_AUTH_URL` /
 * `BETTER_AUTH_URL`.
 *
 * - In local dev, the web app (`WEB_URL`, e.g. http://localhost:3001) and
 *   the auth server (`NEXT_PUBLIC_AUTH_URL`, e.g. http://localhost:8000)
 *   are both on the `localhost` hostname (only the port differs), and
 *   browsers scope cookies by hostname, not port. So the cookie set by the
 *   auth server IS sent along with requests to the Next.js app, and this
 *   middleware DOES see it.
 * - In any deployment where the web app and the auth API live on genuinely
 *   different hostnames (e.g. `app.vexio.com` vs `api.vexio.com`) without
 *   `crossSubDomainCookies` enabled on a shared parent domain, the cookie
 *   is host-only to the API's hostname and will NEVER be attached to
 *   requests to the web app's origin. In that topology this middleware
 *   cannot see the cookie at all, the presence check below always fails
 *   open to "no session", and `AuthGuard`'s client-side `useSession()`
 *   check (which talks to the auth server directly, cross-origin, with
 *   `credentials: "include"`) remains the real gate.
 *
 * If/when cross-subdomain deployment is set up, enable
 * `advanced.crossSubDomainCookies` in `packages/auth/auth.ts` with a shared
 * parent domain so this middleware becomes fully effective in production.
 */

const SESSION_COOKIE_NAMES = [
    "__Secure-better-auth.session_token",
    "better-auth.session_token",
    // First-party marker set by the web app itself; the only one visible when
    // the API lives on an unrelated site (see lib/session-marker.ts).
    SESSION_MARKER_COOKIE,
];

const PROTECTED_PATHS = ["/rooms", "/profile", "/whiteboard"];
const AUTH_PATHS = ["/login", "/signup"];

function hasSessionCookie(request: NextRequest): boolean {
    return SESSION_COOKIE_NAMES.some((name) =>
        Boolean(request.cookies.get(name)?.value),
    );
}

function matchesPath(pathname: string, prefixes: string[]): boolean {
    return prefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const authenticated = hasSessionCookie(request);

    if (matchesPath(pathname, PROTECTED_PATHS) && !authenticated) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
        return NextResponse.redirect(loginUrl);
    }

    if (matchesPath(pathname, AUTH_PATHS) && authenticated) {
        return NextResponse.redirect(new URL("/rooms", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/rooms",
        "/rooms/:path*",
        "/profile",
        "/profile/:path*",
        "/whiteboard",
        "/whiteboard/:path*",
        "/login",
        "/signup",
    ],
};
