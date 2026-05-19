import express from "express";
import {
    startGithubAuth,
    githubCallback,
    adminLogin,
    getUser,
} from "../controllers/authController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * /api/v1/auth/github:
 *   get:
 *     summary: Start GitHub OAuth sign-in
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: redirect
 *         schema:
 *           type: string
 *         description: Path to return to after sign-in (e.g. /submit)
 *     responses:
 *       302:
 *         description: Redirect to GitHub
 */
router.get("/github", startGithubAuth);

/**
 * @openapi
 * /api/v1/auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to frontend with JWT
 */
router.get("/github/callback", githubCallback);

/**
 * @openapi
 * /api/v1/auth/admin/login:
 *   post:
 *     summary: Admin email/password login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Admin logged in
 *       401:
 *         description: Invalid credentials
 */
router.post("/admin/login", adminLogin);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     summary: Get user details
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 */
router.get("/me", isAuthenticated, getUser);

export default router;
