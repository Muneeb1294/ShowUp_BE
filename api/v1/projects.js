import projectRoutes from "../../router/projectRoutes.js";
import { mountRoutes } from "../setup.js";

export default mountRoutes("/api/v1/projects", projectRoutes);
