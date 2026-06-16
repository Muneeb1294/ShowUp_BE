# ShowUp Backend — Deployment

Repo: **ShowUp_BE** — Express API at repo root.

## Vercel (recommended)

Each route group is deployed as its own serverless function under `api/` (see [this guide](https://medium.com/geekculture/deploy-express-project-with-multiple-routes-to-vercel-as-multiple-serverless-functions-567c6ea9eb36)).

### Setup

1. [vercel.com](https://vercel.com) → **Add New Project** → import `Muneeb1294/ShowUp_BE`.
2. Root directory: repo root (`package.json` is at root).
3. Framework preset: **Other** (no build step).
4. Add a **PostgreSQL** database (Neon, Supabase, or Vercel Postgres) and set `DATABASE_URL`.

### Environment variables

| Variable | Value |
|----------|--------|
| `FRONTEND_URL` | `https://show-up-fe.vercel.app` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `GITHUB_CLIENT_ID` | GitHub OAuth app |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app |
| `GITHUB_CALLBACK_URL` | `https://showupbe.vercel.app/api/v1/auth/github/callback` |
| `GITHUB_TOKEN` | Optional |
| `NODE_ENV` | `production` |

After the first deploy, run table setup once (locally with production `DATABASE_URL`, or from CI):

```bash
DATABASE_URL="postgresql://..." npm run setup-db
```

Update the frontend `VITE_API_URL` to `https://showupbe.vercel.app` (see `showup-front-end/.env.production`).

### Serverless functions

| Path | Function |
|------|----------|
| `/api/v1/auth/*` | `api/v1/auth.js` |
| `/api/v1/admin/*` | `api/v1/admin.js` |
| `/api/v1/projects/*` | `api/v1/projects.js` |
| `/api/v1/categories/*` | `api/v1/categories.js` |
| `/api-docs/*` | `api/api-docs.js` |

Rewrites are configured in `vercel.json`. Free plan allows up to 12 functions per deployment.

### GitHub OAuth App

| Field | Value |
|--------|--------|
| **Homepage URL** | `https://show-up-fe.vercel.app` |
| **Authorization callback URL** | `https://showupbe.vercel.app/api/v1/auth/github/callback` |

Must match `GITHUB_CALLBACK_URL` exactly (https, no trailing slash on the path).

### Verify

- `https://showupbe.vercel.app/api-docs` — Swagger UI
- `curl -I "https://showupbe.vercel.app/api/v1/auth/github"` — should `302` to `github.com`

---

## Railway (alternative)

1. [railway.app](https://railway.app) → new project → **PostgreSQL** → deploy from `Muneeb1294/ShowUp_BE`.
2. No root subdirectory — `package.json` is at repo root.
3. Starts with `npm start` (`railway.toml`).

### Environment

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

Tables are created on startup via `createTables()` when using `npm start` / `npm run dev`.

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

Local dev uses `server.js`, which mounts all routes on a single Express app (same as before).

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
| **Authorization callback URL** | Your backend callback URL (Vercel or Railway) |

After sign-in, GitHub redirects to the **backend** callback; the API then redirects to `FRONTEND_URL/auth/callback` with the JWT.

## Verify (Railway)

- `https://showupbe-production.up.railway.app/api-docs` — Swagger UI
- `curl -I "https://showupbe-production.up.railway.app/api/v1/auth/github"` — should `302` to `github.com`
