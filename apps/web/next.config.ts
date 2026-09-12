import type { NextConfig } from "next";
import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env") });

const nextConfig: NextConfig = {};

export default nextConfig;
