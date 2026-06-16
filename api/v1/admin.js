import adminRoutes from "../../router/adminRoutes.js";
import { mountRoutes } from "../setup.js";

export default mountRoutes("/api/v1/admin", adminRoutes);
