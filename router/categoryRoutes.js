import express from "express";
import { getCategories } from "../controllers/categoryController.js";

const router = express.Router();

/**
 * @openapi
 * /api/v1/categories:
 *   get:
 *     summary: List all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Category list for project submission and filtering
 */
router.get("/", getCategories);

export default router;
