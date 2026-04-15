const { pool } = require("../db/mysql");

const getPublicPhones = async () => {
  const [rows] = await pool.query(
    `SELECT id, brand, model_name, image_url
     FROM phones
     WHERE is_active = 1
     ORDER BY brand ASC, model_name ASC`
  );

  return rows;
};

const getAdminPhones = async () => {
  const [rows] = await pool.query(
    `SELECT id, brand, model_name, image_url, is_active, created_at, updated_at
     FROM phones
     ORDER BY brand ASC, model_name ASC`
  );

  return rows;
};

const createPhone = async ({ brand, modelName, imageUrl }) => {
  const [result] = await pool.query(
    `INSERT INTO phones (brand, model_name, image_url, is_active)
     VALUES (?, ?, ?, 1)`,
    [brand, modelName, imageUrl || null]
  );

  return result.insertId;
};

const updatePhone = async (id, { brand, modelName, isActive, imageUrl }) => {
  await pool.query(
    `UPDATE phones
     SET brand = ?, model_name = ?, image_url = ?, is_active = ?
     WHERE id = ?`,
    [brand, modelName, imageUrl || null, isActive ? 1 : 0, id]
  );
};

module.exports = {
  getPublicPhones,
  getAdminPhones,
  createPhone,
  updatePhone,
};
