import pkg from "pg";
import "../config/loadEnv.js";
import dotenv from "dotenv";
dotenv.config();

const { Client } = pkg;

function getDbConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    };
  }

  return {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
}

const database = new Client(getDbConfig());

try {
  await database.connect();
} catch (error) {
  console.error("Error connecting to the database", error);
  process.exit(1);
}

export default database;
