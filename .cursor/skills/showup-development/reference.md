# ShowUp Development Reference

## Controller pattern

```javascript
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";

export const example = catchAsyncError(async (req, res, next) => {
  const { field } = req.body;
  if (!field) {
    return next(new ErrorHandler("Field is required", 400));
  }

  const result = await database.query("SELECT * FROM table WHERE field = $1", [
    field,
  ]);

  res.status(200).json({
    success: true,
    data: result.rows,
  });
});
```

## GitHub URL validation

```javascript
const match = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/);
if (!match) throw new ErrorHandler("Invalid GitHub repository URL", 400);
const [, owner, repo] = match;
```

## Normalized GitHub metadata shape

```javascript
{
  github_url: "https://github.com/owner/repo",
  repo_name: "repo",
  description: "...",
  language: "JavaScript",
  stars: 120,
  last_commit: "2026-05-19T12:00:00.000Z",
  topics: ["react", "nodejs"],
}
```

## React page pattern

```jsx
import { useEffect, useState } from "react";
import { fetchExample, getErrorMessage } from "../api/projects";

export default function ExamplePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchExample()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  return <div>{/* render data */}</div>;
}
```

## Important paths

| Area | Path |
|------|------|
| App entry | `server/app.js`, `client/src/App.jsx` |
| DB client | `server/database/db.js` |
| GitHub service | `server/services/githubRepoService.js` |
| Auth context | `client/src/context/AuthContext.jsx` |
| Axios instance | `client/src/api/axios.js` |
