import database from "../database/db.js";

export async function createProjectsTable() {
    try {
        const query = `CREATE TABLE IF NOT EXISTS projects (
id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
github_url    TEXT NOT NULL UNIQUE,
repo_name     TEXT NOT NULL,
owner_login   TEXT,
owner_avatar_url TEXT,
description   TEXT, 
language      TEXT,
stars         INTEGER DEFAULT 0,
last_commit   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
topics        TEXT[],
submitter_note TEXT,
submitter_handle TEXT,
submitted_by  UUID REFERENCES users(id),
category_id   UUID REFERENCES categories(id),
status        TEXT DEFAULT 'pending',  -- pending / approved / rejected / archived
is_featured   BOOLEAN DEFAULT false,
rejection_note TEXT,
synced_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;
        await database.query(query);
        await database.query(
            "ALTER TABLE projects ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id)"
        );
        await database.query(
            "ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_login TEXT"
        );
        await database.query(
            "ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_avatar_url TEXT"
        );
        await database.query(
            "ALTER TABLE projects ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP"
        );
    } catch (error) {
        console.error("❌ Failed To Create Projects Table.", error);
        process.exit(1);
    }
}
