import app from "../app.js";
import { errorMiddleware } from "../middlewares/errorMiddleware.js";

export function mountRoutes(mountPath, router) {
    app.use(mountPath, router);
    app.use(errorMiddleware);
    return app;
}
