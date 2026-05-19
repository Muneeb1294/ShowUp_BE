import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";

export const getCategories = catchAsyncError(async (req, res) => {
    const result = await database.query(
        "SELECT id, name FROM categories ORDER BY name ASC"
    );

    res.status(200).json({
        success: true,
        categories: result.rows,
    });
});
