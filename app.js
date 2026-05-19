import express from 'express';
import cors from 'cors';
import { createTables } from './utils/createTables.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import authRoutes from './router/authRoutes.js';
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import adminRoutes from './router/adminRoutes.js';
import projectRoutes from './router/projectRoutes.js';
import categoryRoutes from './router/categoryRoutes.js';

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/categories", categoryRoutes);

await createTables();

app.use(errorMiddleware);

export default app;