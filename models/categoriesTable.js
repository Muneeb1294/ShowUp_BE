import database from "../database/db.js";

export async function createCategoriesTable() {
    try {
        const query = `CREATE TABLE IF NOT EXISTS categories (
id     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
name   TEXT NOT NULL UNIQUE
);`;
        await database.query(query);
    } catch (error) {
        console.error("❌ Failed To Create Categories Table.", error);
        process.exit(1);
    }
}
