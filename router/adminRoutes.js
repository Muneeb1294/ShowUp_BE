import express from "express";
import { createCategory } from "../controllers/adminController.js";
import { authorizedRoles, isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();
const admin = [isAuthenticated, authorizedRoles("admin")];

/**
 * @openapi
 * /api/v1/admin/categories:
 *   post:
 *     summary: Create a category (admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "DevTools" }
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Invalid or duplicate name
 *       403:
 *         description: Admin role required
 */
router.post("/categories", ...admin, createCategory);

export default router;
