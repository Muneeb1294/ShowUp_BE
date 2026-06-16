import { createTables } from "../utils/createTables.js";
import { seedCategories } from "../utils/seedCategories.js";

await createTables();
await seedCategories();
process.exit(0);
