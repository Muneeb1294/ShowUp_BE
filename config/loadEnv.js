import { config } from "dotenv";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const envPath = join(dirname(fileURLToPath(import.meta.url)), "config.env");

if (existsSync(envPath)) {
  config({ path: envPath });
}
