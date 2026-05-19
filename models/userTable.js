import database from "../database/db.js";

export async function createUserTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 1),
            email VARCHAR(100) UNIQUE,
            password TEXT,
            github_id BIGINT UNIQUE,
            github_login VARCHAR(39) UNIQUE,
            avatar_url TEXT,
            role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`;
    await database.query(query);
    await migrateUserTable();
}

async function migrateUserTable() {
    await database.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id BIGINT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS github_login VARCHAR(39);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
        ALTER TABLE users ALTER COLUMN github_id DROP NOT NULL;
        ALTER TABLE users ALTER COLUMN github_login DROP NOT NULL;
        ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
    `);

    await database.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS users_github_id_idx ON users (github_id);
        CREATE UNIQUE INDEX IF NOT EXISTS users_github_login_idx ON users (github_login);
    `);
}
