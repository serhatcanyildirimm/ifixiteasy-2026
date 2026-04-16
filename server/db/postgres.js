const pkg = require("pg");

const { Pool } = pkg;

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

if (!hasDatabaseUrl) {
  throw new Error("DATABASE_URL ontbreekt.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

module.exports = {
  getClient,
  pool,
  query,
};
