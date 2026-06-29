const pkg = require("pg");

const { Pool } = pkg;

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

if (!hasDatabaseUrl) {
  throw new Error("DATABASE_URL ontbreekt.");
}

const resolveSsl = () => {
  if (process.env.DATABASE_SSL === "true") {
    return { rejectUnauthorized: false };
  }
  if (process.env.DATABASE_SSL === "false") {
    return false;
  }

  try {
    const url = new URL(process.env.DATABASE_URL.replace(/^postgresql:/, "postgres:"));
    const host = url.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return false;
    }
  } catch {
    // fall through to SSL for unparseable remote URLs
  }

  return { rejectUnauthorized: false };
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: resolveSsl(),
});

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

module.exports = {
  getClient,
  pool,
  query,
};
