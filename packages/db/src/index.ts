import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "./generated/prisma/client.js";
import "@repo/common/env.ts";

declare global {
    var client: PrismaClient | undefined;
    var clientDbUrl: string | undefined;
}

const getConnectionString = () => {
    // Prefer DIRECT_URL (stable, non-pooled) since that's what the app is
    // documented to use; DATABASE_URL is reserved for a pooler and only
    // used as a fallback when DIRECT_URL isn't set.
    const url = (process.env.DIRECT_URL ?? process.env.DATABASE_URL)!;
    const params = new URLSearchParams(
        url.includes("?") ? url.split("?")[1] : ""
    );
    if (!params.has("connect_timeout")) params.set("connect_timeout", "15");
    if (!params.has("pool_timeout")) params.set("pool_timeout", "15");
    if (!params.has("sslmode")) params.set("sslmode", "require");
    const base = url.split("?")[0];
    return `${base}?${params.toString()}`;
};

const connectionString = getConnectionString();

const createClient = () => {
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({ adapter });
};

const client =
    process.env.NODE_ENV !== "production" &&
    globalThis.client &&
    globalThis.clientDbUrl === connectionString
        ? globalThis.client
        : createClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.client = client;
    globalThis.clientDbUrl = connectionString;
}

process.on("SIGINT", async () => {
    await client.$disconnect();
    process.exit(0);
});

export { client };
