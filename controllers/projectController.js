import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";
import { fetchGitHubRepo } from "../services/githubRepoService.js";
import { getPage, PAGE_SIZE, buildPaginationMeta } from "../utils/pagination.js";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PROJECT_FROM = `
    FROM projects p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN users u ON u.id = p.submitted_by
`;

const COMMENT_COUNT_SQL = `(
    SELECT COUNT(*)::int FROM project_comments pc WHERE pc.project_id = p.id
) AS comment_count`;

const PROJECT_SELECT = `
    SELECT p.*, c.name AS category_name,
           u.name AS submitter_name,
           ${COMMENT_COUNT_SQL}
    ${PROJECT_FROM}
`;

function buildProjectSelect(params, userId) {
    let pinnedExpr = "false";
    if (userId) {
        params.push(userId);
        const i = params.length;
        pinnedExpr = `EXISTS (
            SELECT 1 FROM pinned_projects pin
            WHERE pin.project_id = p.id
              AND pin.user_id = $${i}
              AND pin.is_global = false
        )`;
    }
    return `
    SELECT p.*, c.name AS category_name,
           u.name AS submitter_name,
           ${pinnedExpr} AS is_pinned,
           ${COMMENT_COUNT_SQL}
    ${PROJECT_FROM}`;
}

const PENDING_PROJECT_SELECT = `
    SELECT p.*, c.name AS category_name,
           u.name AS submitter_name,
           u.email AS submitter_email,
           u.role AS submitter_role,
           u.created_at AS submitter_joined_at
    FROM projects p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN users u ON u.id = p.submitted_by
`;

function isValidProjectId(id, next) {
    if (!UUID_REGEX.test(id)) {
        next(new ErrorHandler("Invalid project id", 400));
        return false;
    }
    return true;
}

async function resolveCategoryId(category) {
    const value = String(category).trim();
    const query = UUID_REGEX.test(value)
        ? "SELECT id FROM categories WHERE id = $1"
        : "SELECT id FROM categories WHERE LOWER(name) = LOWER($1)";
    const result = await database.query(query, [value]);
    return result.rows[0]?.id ?? null;
}

const SORT_CLAUSES = {
    stars: "p.stars DESC NULLS LAST, p.created_at DESC",
    newest: "p.created_at DESC",
    name: "p.repo_name ASC",
    language: "p.language ASC NULLS LAST, p.repo_name ASC",
};

function getSortClause(sort) {
    return SORT_CLAUSES[sort] ?? SORT_CLAUSES.stars;
}

function appendSearchFilter(conditions, params, search) {
    const term = String(search ?? "")
        .trim()
        .slice(0, 100)
        .replace(/[%_]/g, "");
    if (!term) return;

    const pattern = `%${term}%`;
    params.push(pattern);
    const i = params.length;

    conditions.push(`(
        p.repo_name ILIKE $${i}
        OR COALESCE(p.description, '') ILIKE $${i}
        OR COALESCE(p.language, '') ILIKE $${i}
        OR p.github_url ILIKE $${i}
        OR COALESCE(p.owner_login, '') ILIKE $${i}
        OR COALESCE(p.submitter_note, '') ILIKE $${i}
        OR COALESCE(p.submitter_handle, '') ILIKE $${i}
        OR COALESCE(c.name, '') ILIKE $${i}
        OR COALESCE(u.name, '') ILIKE $${i}
        OR COALESCE(array_to_string(p.topics, ' '), '') ILIKE $${i}
        OR CAST(p.stars AS TEXT) ILIKE $${i}
    )`);
}

async function listApprovedProjects(req, res, next, { featuredOnly = false } = {}) {
    const page = getPage(req);

    const conditions = ["p.status = 'approved'"];
    const params = [];

    if (featuredOnly) {
        conditions.push("p.is_featured = true");
    }

    if (req.query.category) {
        const categoryId = await resolveCategoryId(req.query.category);
        if (!categoryId) {
            return next(new ErrorHandler("Category not found", 400));
        }
        params.push(categoryId);
        conditions.push(`p.category_id = $${params.length}`);
    }

    appendSearchFilter(conditions, params, req.query.search);

    const where = `WHERE ${conditions.join(" AND ")}`;
    const orderBy = getSortClause(req.query.sort);

    const countResult = await database.query(
        `SELECT COUNT(*) ${PROJECT_FROM} ${where}`,
        params
    );
    const total = parseInt(countResult.rows[0].count, 10) || 0;
    const pagination = buildPaginationMeta(total, page);
    const offset = (pagination.currentPage - 1) * PAGE_SIZE;
    const listParams = [...params];
    const select = buildProjectSelect(listParams, req.user?.id);
    const limitParam = listParams.length + 1;
    const offsetParam = listParams.length + 2;

    const projectsResult = await database.query(
        `${select} ${where}
         ORDER BY ${orderBy}
         LIMIT $${limitParam} OFFSET $${offsetParam}`,
        [...listParams, PAGE_SIZE, offset]
    );

    res.status(200).json({
        success: true,
        ...pagination,
        projects: projectsResult.rows,
    });
}

export const createProject = catchAsyncError(async (req, res, next) => {
    const { githubUrl, category, note } = req.body;

    if (
        !githubUrl ||
        typeof githubUrl !== "string" ||
        category == null ||
        category === ""
    ) {
        return next(
            new ErrorHandler("githubUrl and category are required", 400)
        );
    }

    const categoryId = await resolveCategoryId(category);
    if (!categoryId) {
        return next(new ErrorHandler("Category not found", 400));
    }

    const githubData = await fetchGitHubRepo(githubUrl);

    const duplicate = await database.query(
        "SELECT id FROM projects WHERE github_url = $1",
        [githubData.github_url]
    );
    if (duplicate.rows.length > 0) {
        return next(
            new ErrorHandler("This repository has already been submitted", 400)
        );
    }

    let result;
    try {
        result = await database.query(
            `INSERT INTO projects (
                github_url, repo_name, owner_login, owner_avatar_url,
                description, language, stars, last_commit, topics,
                submitter_note, submitted_by, category_id, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
            RETURNING *`,
            [
                githubData.github_url,
                githubData.repo_name,
                githubData.owner_login,
                githubData.owner_avatar_url,
                githubData.description,
                githubData.language,
                githubData.stars,
                githubData.last_commit,
                githubData.topics,
                typeof note === "string" ? note.trim() || null : null,
                req.user.id,
                categoryId,
            ]
        );
    } catch (err) {
        if (err.code === "23505") {
            return next(
                new ErrorHandler(
                    "This repository has already been submitted",
                    400
                )
            );
        }
        throw err;
    }

    res.status(201).json({
        success: true,
        project: result.rows[0],
    });
});

export const getProjects = catchAsyncError(async (req, res, next) => {
    await listApprovedProjects(req, res, next);
});

export const getFeaturedProjects = catchAsyncError(async (req, res, next) => {
    await listApprovedProjects(req, res, next, { featuredOnly: true });
});

export const getProjectById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidProjectId(id, next)) return;

    const params = [id];
    const select = buildProjectSelect(params, req.user?.id);
    const result = await database.query(
        `${select} WHERE p.id = $1 AND p.status = 'approved'`,
        params
    );

    if (result.rows.length === 0) {
        return next(new ErrorHandler("Project not found", 404));
    }

    res.status(200).json({ success: true, project: result.rows[0] });
});

export const getReviewedProjects = catchAsyncError(async (req, res) => {
    const page = getPage(req);
    const offset = (page - 1) * PAGE_SIZE;

    const statusFilter =
        req.query.status === "approved" || req.query.status === "rejected"
            ? req.query.status
            : null;

    const conditions = ["p.status IN ('approved', 'rejected')"];
    const params = [];

    if (statusFilter) {
        params.push(statusFilter);
        conditions.push(`p.status = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const [countResult, projectsResult] = await Promise.all([
        database.query(
            `SELECT COUNT(*) FROM projects p ${where}`,
            params
        ),
        database.query(
            `${PENDING_PROJECT_SELECT}
             ${where}
             ORDER BY COALESCE(p.reviewed_at, p.created_at) DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, PAGE_SIZE, offset]
        ),
    ]);

    const total = parseInt(countResult.rows[0].count, 10) || 0;
    const pagination = buildPaginationMeta(total, page);

    res.status(200).json({
        success: true,
        ...pagination,
        projects: projectsResult.rows,
    });
});

export const getPendingProjects = catchAsyncError(async (req, res) => {
    const page = getPage(req);
    const offset = (page - 1) * PAGE_SIZE;

    const [countResult, projectsResult] = await Promise.all([
        database.query(
            "SELECT COUNT(*) FROM projects WHERE status = 'pending'"
        ),
        database.query(
            `${PENDING_PROJECT_SELECT}
             WHERE p.status = 'pending'
             ORDER BY p.created_at DESC
             LIMIT $1 OFFSET $2`,
            [PAGE_SIZE, offset]
        ),
    ]);

    res.status(200).json({
        success: true,
        totalProjects: parseInt(countResult.rows[0].count, 10) || 0,
        currentPage: page,
        projects: projectsResult.rows,
    });
});

export const getPinnedProjects = catchAsyncError(async (req, res) => {
    const page = getPage(req);
    const total = parseInt(
        (
            await database.query(
                `SELECT COUNT(*) FROM pinned_projects pin
                 WHERE pin.user_id = $1 AND pin.is_global = false`,
                [req.user.id]
            )
        ).rows[0].count,
        10
    ) || 0;
    const pagination = buildPaginationMeta(total, page);
    const offset = (pagination.currentPage - 1) * PAGE_SIZE;

    const projectsResult = await database.query(
        `SELECT p.*, c.name AS category_name,
                u.name AS submitter_name,
                true AS is_pinned
         ${PROJECT_FROM}
         JOIN pinned_projects pin ON pin.project_id = p.id
         WHERE pin.user_id = $1 AND pin.is_global = false AND p.status = 'approved'
         ORDER BY pin.created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, PAGE_SIZE, offset]
    );

    res.status(200).json({
        success: true,
        ...pagination,
        projects: projectsResult.rows,
    });
});

export const approveProject = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidProjectId(id, next)) return;

    const result = await database.query(
        `UPDATE projects SET status = 'approved', rejection_note = NULL,
                reviewed_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'pending'
         RETURNING *`,
        [id]
    );

    if (result.rows.length === 0) {
        return next(new ErrorHandler("Pending project not found", 404));
    }

    res.status(200).json({ success: true, project: result.rows[0] });
});

export const rejectProject = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidProjectId(id, next)) return;

    const rejectionNote =
        typeof req.body?.rejectionNote === "string"
            ? req.body.rejectionNote.trim() || null
            : null;

    const result = await database.query(
        `UPDATE projects SET status = 'rejected', rejection_note = $2,
                reviewed_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'pending'
         RETURNING *`,
        [id, rejectionNote]
    );

    if (result.rows.length === 0) {
        return next(new ErrorHandler("Pending project not found", 404));
    }

    res.status(200).json({ success: true, project: result.rows[0] });
});

export const syncProject = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidProjectId(id, next)) return;

    const existing = await database.query(
        `${PROJECT_SELECT} WHERE p.id = $1`,
        [id]
    );
    if (existing.rows.length === 0) {
        return next(new ErrorHandler("Project not found", 404));
    }

    const githubData = await fetchGitHubRepo(existing.rows[0].github_url);

    await database.query(
        `UPDATE projects SET
            repo_name = $2,
            owner_login = $3,
            owner_avatar_url = $4,
            description = $5,
            language = $6,
            stars = $7,
            last_commit = $8,
            topics = $9,
            synced_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [
            id,
            githubData.repo_name,
            githubData.owner_login,
            githubData.owner_avatar_url,
            githubData.description,
            githubData.language,
            githubData.stars,
            githubData.last_commit,
            githubData.topics,
        ]
    );

    const result = await database.query(
        `${PROJECT_SELECT} WHERE p.id = $1`,
        [id]
    );

    res.status(200).json({ success: true, project: result.rows[0] });
});

export const featureProject = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidProjectId(id, next)) return;

    const featured =
        typeof req.body?.featured === "boolean" ? req.body.featured : true;

    const result = await database.query(
        `UPDATE projects SET is_featured = $2
         WHERE id = $1 AND status = 'approved'
         RETURNING *`,
        [id, featured]
    );

    if (result.rows.length === 0) {
        return next(new ErrorHandler("Approved project not found", 404));
    }

    res.status(200).json({ success: true, project: result.rows[0] });
});

async function ensureApprovedProject(id, next) {
    const result = await database.query(
        "SELECT id FROM projects WHERE id = $1 AND status = 'approved'",
        [id]
    );
    if (result.rows.length === 0) {
        return next(new ErrorHandler("Approved project not found", 404));
    }
    return true;
}

export const pinProject = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidProjectId(id, next)) return;
    if ((await ensureApprovedProject(id, next)) !== true) return;

    try {
        await database.query(
            `INSERT INTO pinned_projects (project_id, user_id, is_global, pinned_by)
             VALUES ($1, $2, false, $3)`,
            [id, req.user.id, req.user.id]
        );
    } catch (err) {
        if (err.code === "23505") {
            return next(new ErrorHandler("Project is already pinned", 400));
        }
        throw err;
    }

    res.status(201).json({ success: true, message: "Project pinned" });
});

export const unpinProject = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidProjectId(id, next)) return;

    const result = await database.query(
        `DELETE FROM pinned_projects
         WHERE project_id = $1 AND user_id = $2 AND is_global = false
         RETURNING id`,
        [id, req.user.id]
    );

    if (result.rows.length === 0) {
        return next(new ErrorHandler("Pinned project not found", 404));
    }

    res.status(200).json({ success: true, message: "Project unpinned" });
});

export const deleteProject = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    if (!isValidProjectId(id, next)) return;

    const result = await database.query(
        "DELETE FROM projects WHERE id = $1 RETURNING id",
        [id]
    );

    if (result.rows.length === 0) {
        return next(new ErrorHandler("Project not found", 404));
    }

    res.status(200).json({ success: true, message: "Project deleted" });
});
