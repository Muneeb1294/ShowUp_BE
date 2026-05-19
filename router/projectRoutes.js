import express from "express";
import {
    createProject,
    getProjects,
    getFeaturedProjects,
    getProjectById,
    getPendingProjects,
    getPinnedProjects,
    approveProject,
    rejectProject,
    featureProject,
    syncProject,
    deleteProject,
    pinProject,
    unpinProject,
} from "../controllers/projectController.js";
import {
    getProjectComments,
    createProjectComment,
    deleteProjectComment,
} from "../controllers/commentController.js";
import {
    authorizedRoles,
    isAuthenticated,
    optionalAuth,
} from "../middlewares/authMiddleware.js";

const router = express.Router();
const admin = [isAuthenticated, authorizedRoles("admin")];
const userOnly = [isAuthenticated, authorizedRoles("user")];

router.post("/", ...userOnly, createProject);
router.get("/", optionalAuth, getProjects);
router.get("/featured", optionalAuth, getFeaturedProjects);
router.get("/pending", ...admin, getPendingProjects);
router.get("/pinned", isAuthenticated, getPinnedProjects);

router.patch("/:id/approve", ...admin, approveProject);
router.patch("/:id/reject", ...admin, rejectProject);
router.patch("/:id/feature", ...admin, featureProject);
router.patch("/:id/sync", ...admin, syncProject);

router.post("/:id/pin", isAuthenticated, pinProject);
router.delete("/:id/pin", isAuthenticated, unpinProject);
router.delete("/:id", ...admin, deleteProject);

/**
 * @openapi
 * /api/v1/projects/{id}/comments:
 *   get:
 *     summary: List comments on an approved project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Paginated comments
 *   post:
 *     summary: Add a comment (authenticated)
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body: { type: string }
 *     responses:
 *       201:
 *         description: Comment created
 */
router.get("/:id/comments", getProjectComments);
router.post("/:id/comments", isAuthenticated, createProjectComment);
router.delete(
    "/:id/comments/:commentId",
    isAuthenticated,
    deleteProjectComment
);
router.get("/:id", optionalAuth, getProjectById);

export default router;
