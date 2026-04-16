const { pool } = require("../db/mysql");

const getDashboardSummary = async () => {
  const [[counts]] = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM appointments) AS totalAppointments,
      (SELECT COUNT(*) FROM appointments WHERE status IN ('pending', 'confirmed')) AS openAppointments,
      (SELECT COUNT(*) FROM availability_slots WHERE is_active = 1) AS activeSlots,
      (SELECT COUNT(*) FROM phones WHERE is_active = 1) AS activePhones`
  );

  const [statusBreakdown] = await pool.query(
    `SELECT status, COUNT(*) AS total
     FROM appointments
     GROUP BY status
     ORDER BY total DESC`
  );

  const [upcomingAppointments] = await pool.query(
    `SELECT a.id, a.customer_name, a.status, DATE_FORMAT(s.slot_date, '%Y-%m-%d') AS slot_date, s.start_time, s.end_time, p.brand, p.model_name
     FROM appointments a
     INNER JOIN availability_slots s ON s.id = a.slot_id
     INNER JOIN phones p ON p.id = a.phone_id
     WHERE s.slot_date >= CURDATE()
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
