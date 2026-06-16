import pg from "pg";
import "../config/loadEnv.js";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

function getConnectionString() {
  return (
    process.env.POSTGRES_URL
    || process.env.DATABASE_URL
    || process.env.POSTGRES_URL_NON_POOLING
  );
}

function getDbConfig() {
  const connectionString = getConnectionString();
  if (connectionString) {
    const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
    return {
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    };
  }

  return {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 10,
  };
}

const database = new Pool(getDbConfig());

export default database;
