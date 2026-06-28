import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

/** Load the monorepo root .env regardless of which app/package started the process. */
export const loadRootEnv = () => {
    const rootEnv = resolve(
        dirname(fileURLToPath(import.meta.url)),
        "../../.env"
    );
    config({ path: rootEnv });
};

loadRootEnv();
