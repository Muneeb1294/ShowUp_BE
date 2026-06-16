import { config } from "dotenv";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const configEnv = join(rootDir, "config", "config.env");
const envLocal = join(rootDir, ".env.local");

if (existsSync(configEnv)) {
  config({ path: configEnv });
}

if (existsSync(envLocal)) {
  config({ path: envLocal, override: true });
}
