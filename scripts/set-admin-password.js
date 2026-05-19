/**
 * Set or update password for an existing admin user.
 * Usage: node scripts/set-admin-password.js <email> <password>
 */
import bcrypt from "bcrypt";
import database from "../database/db.js";

const [email, password] = process.argv.slice(2);

if (!email || !password) {
    console.error("Usage: node scripts/set-admin-password.js <email> <password>");
    process.exit(1);
}

const normalizedEmail = email.trim();
const existing = await database.query(
    `SELECT id, role FROM users WHERE email = $1 LIMIT 1`,
    [normalizedEmail]
);

const hashed = await bcrypt.hash(password, 10);

if (!existing.rows.length) {
    await database.query(
        `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin')`,
        ["Admin", normalizedEmail, hashed]
    );
    process.stdout.write("Admin user created with password.\n");
} else {
    if (existing.rows[0].role !== "admin") {
        console.error("User exists but role is not admin. Update role in the database first.");
        process.exit(1);
    }
    await database.query(`UPDATE users SET password = $1 WHERE id = $2`, [
        hashed,
        existing.rows[0].id,
    ]);
    process.stdout.write("Admin password updated.\n");
}
await database.end();
