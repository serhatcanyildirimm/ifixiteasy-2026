const crypto = require("crypto");
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

// Vindt-of-maakt een verborgen issue-type voor een door de klant zelf getypt
// probleem (is_active = FALSE zodat het niet in de publieke lijst komt, maar de
// afspraak wel een geldige issue_type_id heeft).
const resolveCustomIssueId = async (label) => {
  const trimmed = String(label || "").trim().slice(0, 120);
  if (!trimmed) {
    throw new Error("Omschrijf je probleem.");
  }
  const { rows: existing } = await pool.query(
    `SELECT id FROM issue_types WHERE is_active = FALSE AND label = $1 LIMIT 1`,
    [trimmed]
  );
  if (existing[0]) {
    return existing[0].id;
  }
  const code = `custom-${crypto.randomBytes(8).toString("hex").slice(0, 12)}`;
  const { rows } = await pool.query(
    `INSERT INTO issue_types (code, label, is_active)
     VALUES ($1, $2, FALSE)
     RETURNING id`,
    [code, trimmed]
  );
  return rows[0].id;
};

module.exports = {
  getPublicIssues,
  resolveCustomIssueId,
};
