import { createUserTable } from "../models/userTable.js";
import { createProjectsTable } from "../models/projectsTable.js";
import { createCategoriesTable } from "../models/categoriesTable.js";
import { createPinnedProjectsTable } from "../models/pinnedProjectsTable.js";
import { createProjectCommentsTable } from "../models/projectCommentsTable.js";

export async function createTables() {
    try {
        await createUserTable();
        await createCategoriesTable();
        await createProjectsTable();
        await createPinnedProjectsTable();
        await createProjectCommentsTable();
        console.log("All Tables Created Successfully");
    } catch (error) {
        console.error("❌ Failed To Create Tables.", error);
        throw error;
    }
}