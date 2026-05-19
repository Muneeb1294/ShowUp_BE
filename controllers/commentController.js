import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";
import { getPage, PAGE_SIZE, buildPaginationMeta } from "../utils/pagination.js";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_BODY_LENGTH = 2000;

function isValidUuid(id, next, label = "id") {
    if (!UUID_REGEX.test(id)) {
        next(new ErrorHandler(`Invalid ${label}`, 400));
        return false;
    }
    return true;
}

async function ensureApprovedProject(projectId, next) {
    const result = await database.query(
        "SELECT id FROM projects WHERE id = $1 AND status = 'approved'",
        [projectId]
    );
    if (result.rows.length === 0) {
        next(new ErrorHandler("Project not found", 404));
        return false;
    }
    return true;
}

export const getProjectComments = catchAsyncError(async (req, res, next) => {
    const { id: projectId } = req.params;
    if (!isValidUuid(projectId, next, "project id")) return;
    if (!(await ensureApprovedProject(projectId, next))) return;

    const page = getPage(req);
    const countResult = await database.query(
        "SELECT COUNT(*) FROM project_comments WHERE project_id = $1",
        [projectId]
    );
    const total = parseInt(countResult.rows[0].count, 10) || 0;
    const pagination = buildPaginationMeta(total, page);
    const offset = (pagination.currentPage - 1) * PAGE_SIZE;

    const commentsResult = await database.query(
        `SELECT c.id, c.project_id, c.user_id, c.body, c.created_at,
                u.name AS author_name
         FROM project_comments c
         JOIN users u ON u.id = c.user_id
         WHERE c.project_id = $1
         ORDER BY c.created_at DESC
         LIMIT $2 OFFSET $3`,
        [projectId, PAGE_SIZE, offset]
    );

    res.status(200).json({
        success: true,
        totalComments: pagination.totalProjects,
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize,
        totalPages: pagination.totalPages,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage,
        comments: commentsResult.rows,
    });
});

export const createProjectComment = catchAsyncError(async (req, res, next) => {
    const { id: projectId } = req.params;
    if (!isValidUuid(projectId, next, "project id")) return;
    if (!(await ensureApprovedProject(projectId, next))) return;

    const body =
        typeof req.body?.body === "string" ? req.body.body.trim() : "";
    if (!body) {
        return next(new ErrorHandler("Comment body is required", 400));
    }
    if (body.length > MAX_BODY_LENGTH) {
        return next(
            new ErrorHandler(
                `Comment must be at most ${MAX_BODY_LENGTH} characters`,
                400
            )
        );
    }

    const result = await database.query(
        `INSERT INTO project_comments (project_id, user_id, body)
         VALUES ($1, $2, $3)
         RETURNING id, project_id, user_id, body, created_at`,
        [projectId, req.user.id, body]
    );

    const comment = {
        ...result.rows[0],
        author_name: req.user.name,
    };

    res.status(201).json({ success: true, comment });
});

export const deleteProjectComment = catchAsyncError(async (req, res, next) => {
    const { id: projectId, commentId } = req.params;
    if (!isValidUuid(projectId, next, "project id")) return;
    if (!isValidUuid(commentId, next, "comment id")) return;
    if (!(await ensureApprovedProject(projectId, next))) return;

    const existing = await database.query(
        `SELECT user_id FROM project_comments
         WHERE id = $1 AND project_id = $2`,
        [commentId, projectId]
    );
    if (existing.rows.length === 0) {
        return next(new ErrorHandler("Comment not found", 404));
    }

    const isOwner = existing.rows[0].user_id === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
        return next(new ErrorHandler("Not allowed to delete this comment", 403));
    }

    await database.query(
        "DELETE FROM project_comments WHERE id = $1 AND project_id = $2",
        [commentId, projectId]
    );

    res.status(200).json({ success: true, message: "Comment deleted" });
});
