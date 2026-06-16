import authRoutes from "../../router/authRoutes.js";
import { mountRoutes } from "../setup.js";

export default mountRoutes("/api/v1/auth", authRoutes);
