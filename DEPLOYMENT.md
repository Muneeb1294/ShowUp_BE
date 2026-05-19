# ShowUp Backend — Deployment (Railway)

Repo: **ShowUp_BE** — Express API at repo root.

## Railway setup

1. [railway.app](https://railway.app) → new project → **PostgreSQL** → deploy from `Muneeb1294/ShowUp_BE`.
2. No root subdirectory — `package.json` is at repo root.
3. Starts with `npm start` (`railway.toml`).

## Environment

| Variable | Value |
|----------|--------|
| `FRONTEND_URL` | `https://show-up-fe.vercel.app` |
| `JWT_SECRET_KEY` | Long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `GITHUB_CLIENT_ID` | GitHub OAuth app |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app |
| `GITHUB_CALLBACK_URL` | `https://<railway-domain>/api/v1/auth/github/callback` |
| `GITHUB_TOKEN` | Optional |
| `NODE_ENV` | `production` |

`DATABASE_URL` and `PORT` come from Railway.

Generate a public domain under **Settings → Networking**.

Tables are created on startup via `createTables()`.

## Admin password (production)

```bash
DATABASE_URL="postgresql://..." node scripts/set-admin-password.js admin@example.com your-password
```

## Local dev

```bash
cp config/config.env.example config/config.env
npm install
npm run dev
```

## Publish from monorepo

```bash
./scripts/publish-repos.sh
git -C ../showup-back-end push origin main
```

## GitHub OAuth App (developer settings)

In [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers), edit your ShowUp app:

| Field | Value |
|--------|--------|
| **Homepage URL** | `https://show-up-fe.vercel.app` |
| **Authorization callback URL** | `https://showupbe-production.up.railway.app/api/v1/auth/github/callback` |

The callback URL must match `GITHUB_CALLBACK_URL` on Railway **exactly** (https, no trailing slash on the path).

After sign-in, GitHub redirects to the **backend** callback; the API then redirects to `FRONTEND_URL/auth/callback` with the JWT.

## Verify

- `https://showupbe-production.up.railway.app/api-docs` — Swagger UI
- `curl -I "https://showupbe-production.up.railway.app/api/v1/auth/github"` — should `302` to `github.com`
