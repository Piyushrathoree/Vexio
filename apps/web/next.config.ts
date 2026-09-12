import type { NextConfig } from "next";
import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env") });

// Where the Express API actually lives. Server-side only — the browser never
// sees it, which is the whole point: every request the browser makes goes to
// this app's own origin and is forwarded here by the rewrites below.
//
// Without this proxy the browser would talk to the API cross-site
// (*.vercel.app -> *.onrender.com). Modern browsers partition or block
// cookies set in that context, so better-auth's OAuth `state` cookie was
// written into one jar and read from another — every Google/GitHub sign-in
// came back `state_mismatch` and bounced to the API root. Same-origin
// requests make the session and state cookies first-party, which works in
// every browser without a shared parent domain.
//
// Read at BUILD time — rewrites are baked into the routes manifest — so an
// API_ORIGIN that only exists at runtime is too late. The deployed API is the
// default rather than localhost: a missing build var used to silently produce
// a build that proxied to 127.0.0.1, which Vercel rejects with
// DNS_HOSTNAME_RESOLVED_PRIVATE and looks exactly like a 404. Local dev sets
// API_ORIGIN in the root .env, loaded just above.
const apiOrigin = (
    process.env.API_ORIGIN?.trim() || "https://vexio-api-9a66.onrender.com"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            { source: "/api/auth/:path*", destination: `${apiOrigin}/api/auth/:path*` },
            { source: "/api/v1/:path*", destination: `${apiOrigin}/api/v1/:path*` },
            { source: "/api/me", destination: `${apiOrigin}/api/me` },
        ];
    },
};

export default nextConfig;
