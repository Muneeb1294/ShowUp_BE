import database from "../database/db.js";

export async function createProjectCommentsTable() {
    try {
        const query = `
        CREATE TABLE IF NOT EXISTS project_comments (
            id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            body        TEXT NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS project_comments_project_id_idx
            ON project_comments (project_id, created_at DESC);
        `;
        await database.query(query);
    } catch (error) {
        console.error("❌ Failed To Create Project Comments Table.", error);
        process.exit(1);
    }
}
