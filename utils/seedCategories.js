import database from "../database/db.js";

const DEFAULT_CATEGORIES = ["AI", "Backend", "Frontend"];

export async function seedCategories() {
  for (const name of DEFAULT_CATEGORIES) {
    await database.query(
      "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
      [name]
    );
  }
  console.log("Default categories seeded");
}
