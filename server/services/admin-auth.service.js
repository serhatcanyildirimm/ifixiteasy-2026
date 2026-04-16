const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db/postgres");

const ensureDefaultAdmin = async () => {
  const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL;
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD;

  if (!defaultEmail || !defaultPassword) return;

  const { rows: existingRows } = await pool.query("SELECT id FROM admin_users LIMIT 1");
  const [existing] = existingRows;
  if (existing) return;

  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  await pool.query(
    `INSERT INTO admin_users (email, password_hash, role, is_active)
     VALUES ($1, $2, 'admin', TRUE)`,
    [defaultEmail, passwordHash]
  );
};

const loginAdmin = async ({ email, password }) => {
  const { rows: adminRows } = await pool.query(
    `SELECT id, email, password_hash, role, is_active
     FROM admin_users
     WHERE email = $1`,
    [email]
  );
  const [admin] = adminRows;

  if (!admin || admin.is_active !== true) {
    throw new Error("Onjuiste inloggegevens.");
  }

  const isValid = await bcrypt.compare(password, admin.password_hash);
  if (!isValid) {
    throw new Error("Onjuiste inloggegevens.");
  }

  const token = jwt.sign(
    {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );

  return token;
};

const changeAdminPassword = async ({ adminId, currentPassword, newPassword }) => {
  const { rows: adminRows } = await pool.query(
    `SELECT id, password_hash, is_active
     FROM admin_users
     WHERE id = $1`,
    [adminId]
  );
  const [admin] = adminRows;

  if (!admin || admin.is_active !== true) {
    throw new Error("Admin account niet beschikbaar.");
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, admin.password_hash);
  if (!isCurrentValid) {
    throw new Error("Huidig wachtwoord is onjuist.");
  }

  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);

  if (!hasMinLength || !hasLetter || !hasNumber) {
    throw new Error("Nieuw wachtwoord moet minimaal 8 tekens, letters en cijfers bevatten.");
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await pool.query(
    `UPDATE admin_users
     SET password_hash = $1
     WHERE id = $2`,
    [newHash, adminId]
  );
};

module.exports = {
  ensureDefaultAdmin,
  loginAdmin,
  changeAdminPassword,
};
