import ErrorHandler from "../middlewares/errorMiddleware.js";
import dotenv from "dotenv";
dotenv.config();

export function getFrontendUrl(path = "") {
    const base = process.env.FRONTEND_URL;
    if (!base) {
        throw new ErrorHandler("Missing server configuration: FRONTEND_URL", 500);
    }
    const origin = base.replace(/\/$/, "");
    if (!path) return origin;
    return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
