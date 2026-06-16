# ShowUp Backend — Deployment (Vercel)

Repo: **ShowUp_BE** — Express API at repo root.

Production URL: **https://showupbe.vercel.app**

## 1. Vercel project

1. [vercel.com](https://vercel.com) → import `Muneeb1294/ShowUp_BE`.
2. Framework preset: **Other** (no build step).
3. Each route group deploys as its own serverless function under `api/` (see `vercel.json`).

## 2. Database (Vercel + Neon)

Use **Neon Postgres** from the Vercel Marketplace (replaces Railway).

### From the dashboard

1. Vercel → **showupbe** project → **Storage** → **Create Database** → **Neon**.
2. Choose the **Free** plan and region (e.g. `iad1`).
3. Connect the database to **showupbe**. Vercel injects `DATABASE_URL`, `POSTGRES_URL`, etc.

### From the CLI (linked repo)

```bash
cd showup-back-end
npx vercel link --project showupbe
npx vercel install neon --name showup-db --plan free_v3 -e production -e preview -m region=iad1 -m auth=false
```

If prompted, accept Neon marketplace terms in the browser, then retry the install command.

Pull credentials locally:

```bash
npx vercel env pull .env.local
```

## 3. Environment variables

Set these on the **showupbe** Vercel project (Production + Preview):

| Variable | Value |
|----------|--------|
| `FRONTEND_URL` | `https://show-up-fe.vercel.app` |
| `JWT_SECRET_KEY` | Long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `GITHUB_CLIENT_ID` | GitHub OAuth app |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app |
| `GITHUB_CALLBACK_URL` | `https://showupbe.vercel.app/api/v1/auth/github/callback` |
| `GITHUB_TOKEN` | Optional |
| `NODE_ENV` | `production` |

`DATABASE_URL` / `POSTGRES_URL` come from the Neon integration automatically.

## 4. Create tables (once per new database)

After Neon is connected, run locally:

```bash
npx vercel env pull .env.local
export $(grep -v '^#' .env.local | xargs)
npm run setup-db
```

This creates all tables and seeds default categories (AI, Backend, Frontend). **Existing Railway data cannot be recovered** after that Postgres was deleted — this is a fresh database.

## 5. Admin password

```bash
export $(grep -v '^#' .env.local | xargs)
node scripts/set-admin-password.js admin@example.com your-password
```

## 6. Frontend

Set `VITE_API_URL=https://showupbe.vercel.app` in `showup-front-end/.env.production` and redeploy the frontend.

## 7. GitHub OAuth App

| Field | Value |
|--------|--------|
| **Homepage URL** | `https://show-up-fe.vercel.app` |
| **Authorization callback URL** | `https://showupbe.vercel.app/api/v1/auth/github/callback` |

## Serverless functions

| Path | Function |
|------|----------|
| `/api/v1/auth/*` | `api/v1/auth.js` |
| `/api/v1/admin/*` | `api/v1/admin.js` |
| `/api/v1/projects/*` | `api/v1/projects.js` |
| `/api/v1/categories/*` | `api/v1/categories.js` |
| `/api-docs/*` | `api/api-docs.js` |

## Local dev

```bash
cp config/config.env.example config/config.env
# Set DATABASE_URL to your Neon connection string (or use vercel env pull)
npm install
npm run dev
```

Local dev uses `server.js` (single Express app). Production uses `api/` serverless functions.

## Verify

- `https://showupbe.vercel.app/api/v1/categories` — JSON with categories
- `https://showupbe.vercel.app/api-docs/` — Swagger UI
- `curl -I "https://showupbe.vercel.app/api/v1/auth/github"` — `302` to GitHub

## Publish from monorepo

```bash
./scripts/publish-repos.sh
git -C ../showup-back-end push origin main
```
