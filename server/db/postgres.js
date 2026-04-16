const pkg = require("pg");

const { Pool } = pkg;

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const isProduction = process.env.NODE_ENV === "production";

if (!hasDatabaseUrl) {
  throw new Error("DATABASE_URL ontbreekt.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction
    ? {
        rejectUnauthorized: false,
      }
    : false,
});

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

module.exports = {
  getClient,
  pool,
  query,
};
