import categoryRoutes from "../../router/categoryRoutes.js";
import { mountRoutes } from "../setup.js";

export default mountRoutes("/api/v1/categories", categoryRoutes);
