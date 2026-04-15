const { pool } = require("../db/mysql");

const getPublicIssues = async () => {
  const [rows] = await pool.query(
    `SELECT id, code, label
     FROM issue_types
     WHERE is_active = 1
     ORDER BY label ASC`
  );

  return rows;
};

module.exports = {
  getPublicIssues,
};
