import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../config/swagger.js";
import authRoutes from "../router/authRoutes.js";
import adminRoutes from "../router/adminRoutes.js";
import projectRoutes from "../router/projectRoutes.js";
import categoryRoutes from "../router/categoryRoutes.js";

export function registerRoutes(app) {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/admin", adminRoutes);
    app.use("/api/v1/projects", projectRoutes);
    app.use("/api/v1/categories", categoryRoutes);
}
