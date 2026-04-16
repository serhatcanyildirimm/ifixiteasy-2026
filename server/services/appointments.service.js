const { getConnection, pool } = require("../db/mysql");

const createAppointment = async (payload) => {
  const connection = await getConnection();
  const {
    customerName,
    customerPhone,
    customerEmail,
    phoneId,
    issueTypeId,
    notes,
    slotId,
  } = payload;

  try {
    await connection.beginTransaction();

    const [[slot]] = await connection.query(
      `SELECT id, capacity, is_active
       FROM availability_slots
       WHERE id = ?
       FOR UPDATE`,
      [slotId]
    );

    if (!slot || slot.is_active !== 1) {
      throw new Error("Dit tijdslot is niet beschikbaar.");
    }

    const [[countResult]] = await connection.query(
      `SELECT COUNT(*) AS booked_count
       FROM appointments
       WHERE slot_id = ?
         AND status IN ('pending', 'confirmed')`,
      [slotId]
    );

    if (countResult.booked_count >= slot.capacity) {
      throw new Error("Dit tijdslot is al volgeboekt.");
    }

    const [insertResult] = await connection.query(
      `INSERT INTO appointments
      (customer_name, customer_phone, customer_email, phone_id, issue_type_id, notes, slot_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [customerName, customerPhone, customerEmail || null, phoneId, issueTypeId, notes || null, slotId]
    );

    await connection.commit();
    return insertResult.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getAdminAppointments = async ({ status, dateFrom, dateTo, query }) => {
  let sql = `SELECT a.id, a.customer_name, a.customer_phone, a.customer_email, a.notes, a.status, a.created_at,
                    p.brand, p.model_name, p.image_url,
                    i.label AS issue_label,
                    DATE_FORMAT(s.slot_date, '%Y-%m-%d') AS slot_date, s.start_time, s.end_time
             FROM appointments a
             INNER JOIN phones p ON p.id = a.phone_id
             INNER JOIN issue_types i ON i.id = a.issue_type_id
             INNER JOIN availability_slots s ON s.id = a.slot_id
             WHERE 1 = 1`;
  const params = [];

  if (status) {
    sql += " AND a.status = ?";
    params.push(status);
  }

  if (dateFrom) {
    sql += " AND s.slot_date >= ?";
    params.push(dateFrom);
  }

  if (dateTo) {
    sql += " AND s.slot_date <= ?";
    params.push(dateTo);
  }

  if (query) {
    sql += " AND (a.customer_name LIKE ? OR a.customer_phone LIKE ? OR p.model_name LIKE ?)";
    const like = `%${query}%`;
    params.push(like, like, like);
  }

  const chronological = Boolean(dateFrom && dateTo);
  sql += chronological
    ? " ORDER BY s.slot_date ASC, s.start_time ASC"
    : " ORDER BY s.slot_date DESC, s.start_time DESC";

  const [rows] = await pool.query(sql, params);

  return rows;
};

const updateAppointmentStatus = async (id, status) => {
  await pool.query(
    `UPDATE appointments
     SET status = ?
     WHERE id = ?`,
    [status, id]
  );
};

const deleteAppointment = async (id) => {
  const [result] = await pool.query("DELETE FROM appointments WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

module.exports = {
  createAppointment,
  getAdminAppointments,
  updateAppointmentStatus,
  deleteAppointment,
};
