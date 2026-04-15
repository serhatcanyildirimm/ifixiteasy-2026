const { pool } = require("../db/mysql");

const toDateString = (value) => {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && value.includes("T")) return value.slice(0, 10);
  return value;
};

const SLOT_DURATION_MINUTES = 30;
const DEFAULT_SLOT_CAPACITY = 1;
const AUTO_GENERATE_DAYS_AHEAD = 45;
const OPENING_HOURS_BY_WEEKDAY = {
  1: { start: "09:00:00", end: "17:30:00" }, // maandag
  2: { start: "09:00:00", end: "17:30:00" }, // dinsdag
  3: { start: "09:00:00", end: "17:30:00" }, // woensdag
  4: { start: "09:00:00", end: "17:30:00" }, // donderdag
  5: { start: "09:00:00", end: "17:30:00" }, // vrijdag
  6: { start: "09:00:00", end: "17:00:00" }, // zaterdag
  // zondag (0) is gesloten
};

const parseDateString = (dateString) => {
  const [year, month, day] = String(dateString).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDateString = (dateValue) => {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const timeToMinutes = (timeValue) => {
  const [hours, minutes] = timeValue.split(":").map(Number);
  return (hours * 60) + minutes;
};

const minutesToTimeString = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
};

const buildDaySlots = (slotDate) => {
  const dateObject = parseDateString(slotDate);
  if (!dateObject) return [];
  const openingConfig = OPENING_HOURS_BY_WEEKDAY[dateObject.getDay()];
  if (!openingConfig) {
    return [];
  }

  const startMinutes = timeToMinutes(openingConfig.start);
  const endMinutes = timeToMinutes(openingConfig.end);
  const slots = [];

  for (let cursor = startMinutes; cursor + SLOT_DURATION_MINUTES <= endMinutes; cursor += SLOT_DURATION_MINUTES) {
    slots.push({
      slotDate,
      startTime: minutesToTimeString(cursor),
      endTime: minutesToTimeString(cursor + SLOT_DURATION_MINUTES),
      capacity: DEFAULT_SLOT_CAPACITY,
    });
  }

  return slots;
};

const ensureAvailabilityForDate = async (dateValue) => {
  const slotDate = toDateString(dateValue);
  if (!slotDate) return;

  const daySlots = buildDaySlots(slotDate);
  if (!daySlots.length) return;

  const [existing] = await pool.query(
    "SELECT id FROM availability_slots WHERE slot_date = ? LIMIT 1",
    [slotDate]
  );
  if (existing.length) {
    return;
  }

  const values = daySlots.map((slot) => [slot.slotDate, slot.startTime, slot.endTime, slot.capacity, 1]);
  await pool.query(
    `INSERT INTO availability_slots (slot_date, start_time, end_time, capacity, is_active)
     VALUES ?`,
    [values]
  );
};

const ensureAvailabilityWindow = async (daysAhead = AUTO_GENERATE_DAYS_AHEAD) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 0; offset <= daysAhead; offset += 1) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + offset);
    const slotDate = formatDateString(targetDate);
    await ensureAvailabilityForDate(slotDate);
  }
};

const getPublicAvailabilityByDate = async (date) => {
  await ensureAvailabilityForDate(date);
  const [rows] = await pool.query(
    `SELECT s.id, s.slot_date, s.start_time, s.end_time, s.capacity,
            COUNT(a.id) AS booked_count
     FROM availability_slots s
     LEFT JOIN appointments a
       ON a.slot_id = s.id
       AND a.status IN ('pending', 'confirmed')
     WHERE s.slot_date = ?
       AND s.is_active = 1
     GROUP BY s.id
     HAVING booked_count < s.capacity
     ORDER BY s.start_time ASC`,
    [date]
  );

  return rows;
};

const getAdminAvailability = async () => {
  await ensureAvailabilityWindow();
  const [rows] = await pool.query(
    `SELECT id, slot_date, start_time, end_time, capacity, is_active, updated_at
     FROM availability_slots
     ORDER BY slot_date ASC, start_time ASC`
  );

  return rows;
};

const createAvailability = async ({ slotDate, startTime, endTime, capacity }) => {
  const [result] = await pool.query(
    `INSERT INTO availability_slots (slot_date, start_time, end_time, capacity, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [toDateString(slotDate), startTime, endTime, capacity]
  );

  return result.insertId;
};

const updateAvailability = async (id, { slotDate, startTime, endTime, capacity, isActive }) => {
  await pool.query(
    `UPDATE availability_slots
     SET slot_date = ?, start_time = ?, end_time = ?, capacity = ?, is_active = ?
     WHERE id = ?`,
    [toDateString(slotDate), startTime, endTime, capacity, isActive ? 1 : 0, id]
  );
};

const toggleDayAvailability = async (date, isActive) => {
  const slotDate = toDateString(date);
  await pool.query(
    "UPDATE availability_slots SET is_active = ? WHERE slot_date = ?",
    [isActive ? 1 : 0, slotDate]
  );
};

module.exports = {
  getPublicAvailabilityByDate,
  getAdminAvailability,
  createAvailability,
  updateAvailability,
  toggleDayAvailability,
};
