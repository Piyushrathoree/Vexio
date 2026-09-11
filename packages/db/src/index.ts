import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "./generated/prisma/client.js";
import "@repo/common/env.ts";

declare global {
    var client: PrismaClient | undefined;
    var clientDbUrl: string | undefined;
}

const getConnectionString = () => {
    // Neon’s pooled endpoint is the right runtime connection for Cloud Run
    // services. DIRECT_URL is retained as a local-development fallback and
    // remains the connection Prisma uses for migrations in prisma.config.ts.
    const url = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
    if (!url) {
        throw new Error(
            "DATABASE_URL is required at runtime (DIRECT_URL is supported as a fallback)"
        );
    }
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
