import bcrypt from "bcrypt";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";
import { safeRedirect } from "../utils/safeRedirect.js";
import { signToken } from "../utils/jwtToken.js";
import {
    buildOAuthState,
    parseOAuthState,
    getGithubAuthorizeUrl,
    fetchGithubProfile,
} from "../services/githubAuthService.js";

function frontendUrl(path = "") {
    const base = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    return `${base}${path}`;
}

function redirectWithError(message, redirectTo = "/login") {
    const params = new URLSearchParams({
        error: message,
        redirect: redirectTo,
    });
    return `${frontendUrl("/auth/callback")}?${params}`;
}

function redirectWithToken(token, redirectTo) {
    const params = new URLSearchParams({
        token,
        redirect: redirectTo,
    });
    return `${frontendUrl("/auth/callback")}?${params}`;
}

function oauthErrorMessage(err) {
    if (err instanceof ErrorHandler) return err.message;
    if (err?.code === "23505") {
        return "An account with this email or GitHub username already exists";
    }
    return "GitHub sign-in failed";
}

async function upsertGithubUser(profile) {
    if (profile.email) {
        const legacy = await database.query(
            `SELECT id FROM users WHERE email = $1 AND github_id IS NULL AND role = 'user' LIMIT 1`,
            [profile.email]
        );
        if (legacy.rows.length > 0) {
            const linked = await database.query(
                `UPDATE users SET
                    name = $1,
                    github_id = $2,
                    github_login = $3,
                    avatar_url = $4
                 WHERE id = $5
                 RETURNING *`,
                [
                    profile.name,
                    profile.github_id,
                    profile.github_login,
                    profile.avatar_url,
                    legacy.rows[0].id,
                ]
            );
            return linked.rows[0];
        }
    }

    const result = await database.query(
        `INSERT INTO users (name, email, github_id, github_login, avatar_url, role)
         VALUES ($1, $2, $3, $4, $5, 'user')
         ON CONFLICT (github_id) DO UPDATE SET
            name = EXCLUDED.name,
            email = COALESCE(EXCLUDED.email, users.email),
            github_login = EXCLUDED.github_login,
            avatar_url = EXCLUDED.avatar_url
         RETURNING *`,
        [
            profile.name,
            profile.email,
            profile.github_id,
            profile.github_login,
            profile.avatar_url,
        ]
    );
    return result.rows[0];
}

export const startGithubAuth = catchAsyncError(async (req, res) => {
    const redirectTo = safeRedirect(req.query.redirect);
    const state = buildOAuthState(redirectTo);
    res.redirect(getGithubAuthorizeUrl(state));
});

export const githubCallback = catchAsyncError(async (req, res) => {
    const { code, state, error, error_description: errorDescription } = req.query;
    let redirectTo = "/";

    try {
        if (!state) {
            throw new ErrorHandler("Invalid sign-in session", 400);
        }
        ({ redirectTo } = parseOAuthState(state));

        if (error) {
            throw new ErrorHandler(
                errorDescription || error || "GitHub sign-in was cancelled",
                400
            );
        }

        if (!code) {
            throw new ErrorHandler("Missing authorization code from GitHub", 400);
        }

        const profile = await fetchGithubProfile(code);
        const user = await upsertGithubUser(profile);
        const token = signToken(user.id);
        return res.redirect(redirectWithToken(token, redirectTo));
    } catch (err) {
        return res.redirect(redirectWithError(oauthErrorMessage(err), redirectTo));
    }
});

export const adminLogin = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
    }

    const result = await database.query(
        `SELECT * FROM users WHERE email = $1 AND role = 'admin' LIMIT 1`,
        [email.trim()]
    );

    if (!result.rows.length || !result.rows[0].password) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    const user = result.rows[0];
    if (!user.password.startsWith("$2")) {
        return next(
            new ErrorHandler(
                "Admin password must be set with scripts/set-admin-password.js (bcrypt hash required)",
                500
            )
        );
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    res.status(200).json({
        success: true,
        user: sanitizeUser(user),
        token: signToken(user.id),
    });
});

export const getUser = catchAsyncError(async (req, res) => {
    res.status(200).json({
        success: true,
        user: sanitizeUser(req.user),
    });
});
