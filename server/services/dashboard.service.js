const { pool } = require("../db/postgres");

const getDashboardSummary = async () => {
  const { rows: countRows } = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM appointments) AS totalAppointments,
      (SELECT COUNT(*) FROM appointments WHERE status IN ('pending', 'confirmed')) AS openAppointments,
      (SELECT COUNT(*) FROM availability_slots WHERE is_active = TRUE) AS activeSlots,
      (SELECT COUNT(*) FROM phones WHERE is_active = TRUE) AS activePhones`
  );
  const [counts] = countRows;

  const { rows: statusBreakdown } = await pool.query(
    `SELECT status, COUNT(*) AS total
     FROM appointments
     GROUP BY status
     ORDER BY total DESC`
  );

  const { rows: upcomingAppointments } = await pool.query(
    `SELECT a.id, a.customer_name, a.status, TO_CHAR(s.slot_date, 'YYYY-MM-DD') AS slot_date, s.start_time, s.end_time, p.brand, p.model_name
     FROM appointments a
     INNER JOIN availability_slots s ON s.id = a.slot_id
     INNER JOIN phones p ON p.id = a.phone_id
     WHERE s.slot_date >= CURRENT_DATE
     ORDER BY s.slot_date ASC, s.start_time ASC
     LIMIT 6`
  );

  return {
    counts,
    statusBreakdown,
    upcomingAppointments,
  };
};

module.exports = {
  getDashboardSummary,
};
