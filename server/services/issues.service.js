const { pool } = require("../db/postgres");

const getPublicIssues = async () => {
  const { rows } = await pool.query(
    `SELECT id, code, label
     FROM issue_types
     WHERE is_active = TRUE
     ORDER BY label ASC`
  );

  return rows;
};

module.exports = {
  getPublicIssues,
};
