import crypto from "crypto";
import jwt from "jsonwebtoken";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { safeRedirect } from "../utils/safeRedirect.js";

const GITHUB_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN = "https://github.com/login/oauth/access_token";
const GITHUB_API = "https://api.github.com";

function requireEnv(name) {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new ErrorHandler(`Missing server configuration: ${name}`, 500);
    }
    return value;
}

export function buildOAuthState(redirectTo) {
    const secret = process.env.JWT_SECRET_KEY?.trim();
    return jwt.sign(
        { redirectTo, nonce: crypto.randomBytes(16).toString("hex") },
        secret,
        { expiresIn: "10m" }
    );
}

export function parseOAuthState(state) {
    try {
        const payload = jwt.verify(state, process.env.JWT_SECRET_KEY?.trim());
        return { redirectTo: safeRedirect(payload.redirectTo) };
    } catch {
        throw new ErrorHandler("OAuth state expired or invalid", 400);
    }
}

export function getGithubAuthorizeUrl(state) {
    const clientId = requireEnv("GITHUB_CLIENT_ID");
    const redirectUri = requireEnv("GITHUB_CALLBACK_URL");
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "read:user user:email",
        state,
    });
    return `${GITHUB_AUTHORIZE}?${params}`;
}

async function githubPostToken(code) {
    const clientId = requireEnv("GITHUB_CLIENT_ID");
    const clientSecret = requireEnv("GITHUB_CLIENT_SECRET");
    const redirectUri = requireEnv("GITHUB_CALLBACK_URL");

    let response;
    try {
        response = await fetch(GITHUB_TOKEN, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
            }),
        });
    } catch {
        throw new ErrorHandler("Unable to reach GitHub. Please try again.", 502);
    }

    const data = await response.json();
    if (!response.ok || data.error) {
        throw new ErrorHandler(
            data.error_description || data.error || "GitHub authorization failed",
            400
        );
    }
    if (!data.access_token) {
        throw new ErrorHandler("GitHub did not return an access token", 400);
    }
    return data.access_token;
}

async function githubApiGet(path, accessToken) {
    let response;
    try {
        response = await fetch(`${GITHUB_API}${path}`, {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${accessToken}`,
            },
        });
    } catch {
        throw new ErrorHandler("Unable to reach GitHub. Please try again.", 502);
    }

    if (!response.ok) {
        throw new ErrorHandler("Failed to load GitHub profile", 502);
    }
    return response.json();
}

async function fetchPrimaryEmail(accessToken) {
    try {
        const emails = await githubApiGet("/user/emails", accessToken);
        if (!Array.isArray(emails)) return null;
        const primary = emails.find((e) => e.primary && e.verified);
        if (primary) return primary.email;
        const verified = emails.find((e) => e.verified);
        return verified?.email ?? null;
    } catch {
        return null;
    }
}

export async function fetchGithubProfile(code) {
    const accessToken = await githubPostToken(code);
    const profile = await githubApiGet("/user", accessToken);

    if (!profile?.id || !profile?.login) {
        throw new ErrorHandler("Incomplete GitHub profile", 502);
    }

    let email = profile.email ?? null;
    if (!email) {
        email = await fetchPrimaryEmail(accessToken);
    }

    const name = (profile.name || profile.login || "GitHub User").trim();

    return {
        github_id: profile.id,
        github_login: profile.login,
        name,
        email,
        avatar_url: profile.avatar_url ?? null,
    };
}
