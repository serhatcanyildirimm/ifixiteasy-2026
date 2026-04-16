const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { requireAdminAuth } = require("../middleware/auth.middleware");
const { loginAdmin, changeAdminPassword } = require("../services/admin-auth.service");
const {
  getAdminPhones,
  createPhone,
  updatePhone,
} = require("../services/phones.service");
const {
  getAdminAvailability,
  createAvailability,
  updateAvailability,
  toggleDayAvailability,
} = require("../services/availability.service");
const {
  getAdminAppointments,
  updateAppointmentStatus,
  deleteAppointment,
} = require("../services/appointments.service");
const { getDashboardSummary } = require("../services/dashboard.service");

const router = express.Router();
const uploadsDirectory = path.resolve(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDirectory),
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "-");
      cb(null, `${Date.now()}-${safeName}`);
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error("Alleen jpg, png of webp is toegestaan."));
      return;
    }
    cb(null, true);
  },
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "E-mail en wachtwoord zijn verplicht." });
  }

  try {
    const token = await loginAdmin({ email, password });
    return res.json({ token });
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
});

router.use(requireAdminAuth);

router.post("/phones/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Geen bestand geupload." });
  }

  const publicPath = `/server/uploads/${req.file.filename}`;
  return res.status(201).json({ imageUrl: publicPath });
});

router.post("/auth/change-password", async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Alle wachtwoordvelden zijn verplicht." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Nieuw wachtwoord en bevestiging komen niet overeen." });
  }

  try {
    await changeAdminPassword({
      adminId: req.admin.sub,
      currentPassword,
      newPassword,
    });
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/phones", async (req, res) => {
  const rows = await getAdminPhones();
  res.json(rows);
});

router.post("/phones", async (req, res) => {
  const { brand, modelName, imageUrl, deviceCategory } = req.body || {};
  if (!brand || !modelName) {
    return res.status(400).json({ message: "Merk en model zijn verplicht." });
  }

  const id = await createPhone({ brand, modelName, imageUrl, deviceCategory });
  return res.status(201).json({ id });
});

router.patch("/phones/:id", async (req, res) => {
  const { brand, modelName, isActive, imageUrl, deviceCategory } = req.body || {};
  const id = Number(req.params.id);

  if (!brand || !modelName || typeof isActive !== "boolean") {
    return res.status(400).json({ message: "Ongeldige gegevens voor telefoonupdate." });
  }

  await updatePhone(id, { brand, modelName, isActive, imageUrl, deviceCategory });
  return res.status(204).send();
});

router.get("/availability", async (req, res) => {
  const rows = await getAdminAvailability();
  return res.json(rows);
});

router.post("/availability", async (req, res) => {
  const { slotDate, startTime, endTime, capacity } = req.body || {};
  if (!slotDate || !startTime || !endTime || !capacity) {
    return res.status(400).json({ message: "Onvolledige slotgegevens." });
  }

  const id = await createAvailability({
    slotDate,
    startTime,
    endTime,
    capacity: Number(capacity),
  });
  return res.status(201).json({ id });
});

router.patch("/availability/:id", async (req, res) => {
  const { slotDate, startTime, endTime, capacity, isActive } = req.body || {};
  const id = Number(req.params.id);
  if (!slotDate || !startTime || !endTime || !capacity || typeof isActive !== "boolean") {
    return res.status(400).json({ message: "Onvolledige slotgegevens." });
  }

  await updateAvailability(id, {
    slotDate,
    startTime,
    endTime,
    capacity: Number(capacity),
    isActive,
  });
  return res.status(204).send();
});

router.patch("/availability/day/:date", async (req, res) => {
  const { isActive } = req.body || {};
  const date = req.params.date;
  if (!date || typeof isActive !== "boolean") {
    return res.status(400).json({ message: "Datum en isActive zijn verplicht." });
  }
  await toggleDayAvailability(date, isActive);
  return res.status(204).send();
});

router.get("/appointments", async (req, res) => {
  const { status, dateFrom, dateTo, q } = req.query;
  const rows = await getAdminAppointments({
    status: status || "",
    dateFrom: dateFrom || "",
    dateTo: dateTo || "",
    query: q || "",
  });
  return res.json(rows);
});

router.get("/dashboard/summary", async (req, res) => {
  const summary = await getDashboardSummary();
  return res.json(summary);
});

router.patch("/appointments/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  const allowedStatuses = ["pending", "confirmed", "done", "cancelled"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Ongeldige status." });
  }

  await updateAppointmentStatus(id, status);
  return res.status(204).send();
});

router.delete("/appointments/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: "Ongeldig afspraak-id." });
  }
  const removed = await deleteAppointment(id);
  if (!removed) {
    return res.status(404).json({ message: "Afspraak niet gevonden." });
  }
  return res.status(204).send();
});

module.exports = router;
