import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
config();

declare global {
    var client: PrismaClient | undefined;
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

const client = globalThis.client ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
    globalThis.client = client;
}

process.on("SIGINT", async () => {
    await client.$disconnect();
    process.exit(0);
});

export { client };
