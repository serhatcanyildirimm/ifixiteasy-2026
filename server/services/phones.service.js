const { pool } = require("../db/postgres");

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
  const { rows } = await pool.query(
    `SELECT id, brand, model_name, image_url, device_category
     FROM phones
     WHERE is_active = TRUE
     ORDER BY brand ASC, model_name ASC`
  );

  return rows;
};

const getAdminPhones = async () => {
  const { rows } = await pool.query(
    `SELECT id, brand, model_name, image_url, device_category, is_active, created_at, updated_at
     FROM phones
     ORDER BY brand ASC, model_name ASC`
  );

  return rows;
};

const createPhone = async ({ brand, modelName, imageUrl, deviceCategory }) => {
  const category = normalizeDeviceCategory(deviceCategory);
  const { rows } = await pool.query(
    `INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
     VALUES ($1, $2, $3, $4, TRUE)
     RETURNING id`,
    [brand, modelName, imageUrl || null, category]
  );

  return rows[0].id;
};

const updatePhone = async (id, { brand, modelName, isActive, imageUrl, deviceCategory }) => {
  const active = Boolean(isActive);
  if (deviceCategory === undefined) {
    await pool.query(
      `UPDATE phones
       SET brand = $1, model_name = $2, image_url = $3, is_active = $4
       WHERE id = $5`,
      [brand, modelName, imageUrl || null, active, id]
    );
    return;
  }
  const category = normalizeDeviceCategory(deviceCategory);
  await pool.query(
    `UPDATE phones
     SET brand = $1, model_name = $2, image_url = $3, device_category = $4, is_active = $5
     WHERE id = $6`,
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
