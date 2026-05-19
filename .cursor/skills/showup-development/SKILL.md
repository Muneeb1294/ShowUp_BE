---
name: showup-development
description: Builds ShowUp API endpoints, GitHub repo metadata, and React pages. Use when adding server routes, controllers, GitHub integrations, database tables, or client pages in this monorepo.
---

# ShowUp Development

Read applicable rules first:

- Always: [.cursor/rules/project-core.mdc](../../rules/project-core.mdc)
- Server work: [.cursor/rules/backend.mdc](../../rules/backend.mdc)
- Client work: [.cursor/rules/frontend.mdc](../../rules/frontend.mdc)

For code templates and field mappings, see [reference.md](reference.md).

## API endpoint workflow

1. Add route in `server/router/` and register in `server/app.js` under `/api/v1/...`
2. Implement controller with `catchAsyncError` and `ErrorHandler` for validation
3. Query with parameterized SQL via `server/database/db.js`
4. Return `{ success: true, ...data }` on success
5. Add `@openapi` comments if sibling routes in that file already document the API

## GitHub repo fetch workflow

1. Validate URL: `https://github.com/{owner}/{repo}`
2. Fetch via `server/services/githubRepoService.js` (or extend it)
3. Normalize to project fields: `github_url`, `repo_name`, `description`, `language`, `stars`, `last_commit`, `topics`
4. Handle rate limits and invalid repos with clear operational errors — never expose tokens

## React page workflow

1. Create page in `client/src/pages/`
2. Fetch through `client/src/api/*` helpers (not raw `fetch`)
3. Handle loading, error, and success states
4. Wire route in `client/src/App.jsx`; use `UserRoute` or `AdminRoute` when role-gated
5. Reuse layout and existing components from `client/src/components/`
