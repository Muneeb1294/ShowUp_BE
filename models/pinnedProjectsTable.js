import database from "../database/db.js";

export async function createPinnedProjectsTable() {
    try {
        const query = `
        CREATE TABLE IF NOT EXISTS pinned_projects (
            id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
            is_global   BOOLEAN NOT NULL DEFAULT false,
            pinned_by   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT pinned_projects_scope_check CHECK (
                (is_global = true AND user_id IS NULL) OR
                (is_global = false AND user_id IS NOT NULL)
            )
        );

        CREATE UNIQUE INDEX IF NOT EXISTS pinned_projects_personal_unique
            ON pinned_projects (project_id, user_id)
            WHERE is_global = false;

        CREATE UNIQUE INDEX IF NOT EXISTS pinned_projects_global_unique
            ON pinned_projects (project_id)
            WHERE is_global = true;
        `;
        await database.query(query);
    } catch (error) {
        console.error("❌ Failed To Create Pinned Projects Table.", error);
        process.exit(1);
    }
}
