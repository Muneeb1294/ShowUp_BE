import app from "./app.js";
import { registerRoutes } from "./routes/index.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { createTables } from "./utils/createTables.js";

registerRoutes(app);
app.use(errorMiddleware);

await createTables();

const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started. Go to http://localhost:${PORT}/api-docs`);
});
