import ErrorHandler from "../middlewares/errorMiddleware.js";

export function getFrontendUrl(path = "") {
    const base = process.env.FRONTEND_URL?.trim();
    if (!base) {
        throw new ErrorHandler("Missing server configuration: FRONTEND_URL", 500);
    }
    const origin = base.replace(/\/$/, "");
    if (!path) return origin;
    return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
