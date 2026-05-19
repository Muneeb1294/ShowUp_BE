import ErrorHandler from "../middlewares/errorMiddleware.js";

const GITHUB_API = "https://api.github.com";

function parseGitHubRepoUrl(url) {
    const match =
        typeof url === "string"
            ? url.trim().match(
                  /^https:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?\/?$/
              )
            : null;

    if (!match) {
        throw new ErrorHandler("Invalid GitHub repository URL", 400);
    }

    const [, owner, repo] = match;

    return {
        owner,
        repo,
        github_url: `https://github.com/${owner}/${repo}`,
    };
}

async function githubRequest(
    path,
    accept = "application/vnd.github+json",
    { allowEmpty = false } = {}
) {
    const headers = {
        Accept: accept,
        "User-Agent": "ShowUp",
    };

    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    let response;
    try {
        response = await fetch(`${GITHUB_API}${path}`, { headers });
    } catch {
        throw new ErrorHandler(
            "Unable to reach GitHub. Please try again later.",
            502
        );
    }

    if (allowEmpty && response.status === 409) {
        return null;
    }

    if (response.status === 404) {
        throw new ErrorHandler("Repository not found", 404);
    }

    if (response.status === 401) {
        throw new ErrorHandler(
            "Failed to fetch repository data from GitHub",
            502
        );
    }

    if (response.status === 403) {
        const remaining = response.headers.get("x-ratelimit-remaining");
        if (remaining === "0") {
            throw new ErrorHandler(
                "GitHub API rate limit exceeded. Try again later.",
                429
            );
        }
        throw new ErrorHandler("Access to this repository is forbidden", 403);
    }

    if (!response.ok) {
        throw new ErrorHandler(
            "Failed to fetch repository data from GitHub",
            502
        );
    }

    return response.json();
}

export async function fetchGitHubRepo(url) {
    const { owner, repo, github_url } = parseGitHubRepoUrl(url);

    const [repoData, commits, topicsData] = await Promise.all([
        githubRequest(`/repos/${owner}/${repo}`),
        githubRequest(
            `/repos/${owner}/${repo}/commits?per_page=1`,
            "application/vnd.github+json",
            { allowEmpty: true }
        ),
        githubRequest(
            `/repos/${owner}/${repo}/topics`,
            "application/vnd.github.mercy-preview+json"
        ),
    ]);

    const lastCommit =
        commits?.[0]?.commit?.committer?.date ??
        commits?.[0]?.commit?.author?.date ??
        null;

    return {
        github_url,
        repo_name: repoData.name,
        description: repoData.description ?? null,
        language: repoData.language ?? null,
        stars: repoData.stargazers_count ?? 0,
        last_commit: lastCommit,
        topics: topicsData.names ?? [],
        owner_login: repoData.owner?.login ?? owner,
        owner_avatar_url: repoData.owner?.avatar_url ?? null,
    };
}
