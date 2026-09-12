/**
 * Every browser origin allowed to call the API.
 *
 * Both the CORS layer (apps/http-server) and better-auth's `trustedOrigins`
 * (packages/auth) read this, so they can never drift apart — a URL trusted by
 * one but not the other fails in confusing, half-working ways.
 *
 * `WEB_URL` is the deployed web app and may hold several comma-separated
 * origins (e.g. a Vercel URL plus a custom domain). Localhost dev ports are
 * always included: they cost nothing in production (no browser sends a
 * localhost `Origin` to a public API) and keep `bun run dev` working against a
 * deployed API without editing env vars.
 */

const LOCAL_ORIGINS = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3000",
];

/** Drop a trailing slash — `Origin` headers never carry one, so a configured
 *  "https://app.example.com/" would otherwise match nothing. */
const normalize = (value: string) => value.trim().replace(/\/+$/, "");

export const getAllowedOrigins = (): string[] => {
    const configured = (process.env.WEB_URL ?? "")
        .split(",")
        .map(normalize)
        .filter(Boolean);

    return Array.from(
        new Set([...(configured.length ? configured : LOCAL_ORIGINS.slice(0, 1)), ...LOCAL_ORIGINS])
    );
};

/** The single canonical web origin — for links and redirects, which need one
 *  value rather than a list. */
export const getPrimaryWebOrigin = (): string =>
    normalize((process.env.WEB_URL ?? "").split(",")[0] ?? "") ||
    "http://localhost:3001";
