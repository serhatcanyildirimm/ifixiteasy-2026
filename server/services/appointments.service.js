const { getClient, pool } = require("../db/postgres");

const createAppointment = async (payload) => {
  const client = await getClient();
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
    await client.query("BEGIN");

    const { rows: slotRows } = await client.query(
      `SELECT id, capacity, is_active
       FROM availability_slots
       WHERE id = $1
       FOR UPDATE`,
      [slotId]
    );
    const [slot] = slotRows;

    if (!slot || slot.is_active !== true) {
      throw new Error("Dit tijdslot is niet beschikbaar.");
    }

    const { rows: countRows } = await client.query(
      `SELECT COUNT(*) AS booked_count
       FROM appointments
       WHERE slot_id = $1
         AND status IN ('pending', 'confirmed')`,
      [slotId]
    );
    const [countResult] = countRows;

    if (Number(countResult.booked_count) >= slot.capacity) {
      throw new Error("Dit tijdslot is al volgeboekt.");
    }

    const { rows: insertRows } = await client.query(
      `INSERT INTO appointments
      (customer_name, customer_phone, customer_email, phone_id, issue_type_id, notes, slot_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING id`,
      [customerName, customerPhone, customerEmail || null, phoneId, issueTypeId, notes || null, slotId]
    );

    await client.query("COMMIT");
    return insertRows[0].id;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getAdminAppointments = async ({ status, dateFrom, dateTo, query }) => {
  let sql = `SELECT a.id, a.customer_name, a.customer_phone, a.customer_email, a.notes, a.status, a.created_at,
                    p.brand, p.model_name, p.image_url,
                    i.label AS issue_label,
                    TO_CHAR(s.slot_date, 'YYYY-MM-DD') AS slot_date, s.start_time, s.end_time
             FROM appointments a
             INNER JOIN phones p ON p.id = a.phone_id
             INNER JOIN issue_types i ON i.id = a.issue_type_id
             INNER JOIN availability_slots s ON s.id = a.slot_id
             WHERE 1 = 1`;
  const params = [];
  let paramIndex = 1;

  if (status) {
    sql += ` AND a.status = $${paramIndex}`;
    params.push(status);
    paramIndex += 1;
  }

  if (dateFrom) {
    sql += ` AND s.slot_date >= $${paramIndex}`;
    params.push(dateFrom);
    paramIndex += 1;
  }

  if (dateTo) {
    sql += ` AND s.slot_date <= $${paramIndex}`;
    params.push(dateTo);
    paramIndex += 1;
  }

  if (query) {
    sql += ` AND (a.customer_name ILIKE $${paramIndex} OR a.customer_phone ILIKE $${paramIndex + 1} OR p.model_name ILIKE $${paramIndex + 2})`;
    const like = `%${query}%`;
    params.push(like, like, like);
    paramIndex += 3;
  }

  const chronological = Boolean(dateFrom && dateTo);
  sql += chronological
    ? " ORDER BY s.slot_date ASC, s.start_time ASC"
    : " ORDER BY s.slot_date DESC, s.start_time DESC";

  const { rows } = await pool.query(sql, params);

  return rows;
};

const updateAppointmentStatus = async (id, status) => {
  await pool.query(
    `UPDATE appointments
     SET status = $1
     WHERE id = $2`,
    [status, id]
  );
};

const deleteAppointment = async (id) => {
  const result = await pool.query("DELETE FROM appointments WHERE id = $1", [id]);
  return result.rowCount > 0;
};

module.exports = {
  createAppointment,
  getAdminAppointments,
  updateAppointmentStatus,
  deleteAppointment,
};
