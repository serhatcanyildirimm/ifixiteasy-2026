const { pool } = require("../db/mysql");

const DEVICE_CATEGORIES = [
  "smartphone",
  "laptop",
  "tablet",
  "console",
  "computer",
  "watch",
];

const normalizeDeviceCategory = (value) => {
  const v = String(value || "smartphone").toLowerCase().trim();
  return DEVICE_CATEGORIES.includes(v) ? v : "smartphone";
};

const getPublicPhones = async () => {
  const [rows] = await pool.query(
    `SELECT id, brand, model_name, image_url, device_category
     FROM phones
     WHERE is_active = 1
     ORDER BY brand ASC, model_name ASC`
  );

  return rows;
};

const getAdminPhones = async () => {
  const [rows] = await pool.query(
    `SELECT id, brand, model_name, image_url, device_category, is_active, created_at, updated_at
     FROM phones
     ORDER BY brand ASC, model_name ASC`
  );

  return rows;
};

const createPhone = async ({ brand, modelName, imageUrl, deviceCategory }) => {
  const category = normalizeDeviceCategory(deviceCategory);
  const [result] = await pool.query(
    `INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [brand, modelName, imageUrl || null, category]
  );

  return result.insertId;
};

const updatePhone = async (id, { brand, modelName, isActive, imageUrl, deviceCategory }) => {
  const active = isActive ? 1 : 0;
  if (deviceCategory === undefined) {
    await pool.query(
      `UPDATE phones
       SET brand = ?, model_name = ?, image_url = ?, is_active = ?
       WHERE id = ?`,
      [brand, modelName, imageUrl || null, active, id]
    );
    return;
  }
  const category = normalizeDeviceCategory(deviceCategory);
  await pool.query(
    `UPDATE phones
     SET brand = ?, model_name = ?, image_url = ?, device_category = ?, is_active = ?
     WHERE id = ?`,
    [brand, modelName, imageUrl || null, category, active, id]
  );
};

module.exports = {
  DEVICE_CATEGORIES,
  normalizeDeviceCategory,
  getPublicPhones,
  getAdminPhones,
  createPhone,
  updatePhone,
};
