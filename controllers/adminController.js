import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";

export const createCategory = catchAsyncError(async (req, res, next) => {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
        return next(new ErrorHandler("Category name is required", 400));
    }

    const trimmed = name.trim();
    const existing = await database.query(
        "SELECT id FROM categories WHERE LOWER(name) = LOWER($1)",
        [trimmed]
    );
    if (existing.rows.length > 0) {
        return next(new ErrorHandler("Category already exists", 400));
    }

    const result = await database.query(
        "INSERT INTO categories (name) VALUES ($1) RETURNING *",
        [trimmed]
    );
    res.status(201).json({ success: true, category: result.rows[0] });
});
