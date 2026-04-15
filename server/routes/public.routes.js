const express = require("express");
const rateLimit = require("express-rate-limit");
const { getPublicPhones } = require("../services/phones.service");
const { getPublicIssues } = require("../services/issues.service");
const { getPublicAvailabilityByDate } = require("../services/availability.service");
const { createAppointment } = require("../services/appointments.service");

const router = express.Router();

const appointmentRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/phones", async (req, res) => {
  const rows = await getPublicPhones();
  res.json(rows);
});

router.get("/issues", async (req, res) => {
  const rows = await getPublicIssues();
  res.json(rows);
});

router.get("/availability", async (req, res) => {
  const date = req.query.date;
  if (!date) {
    return res.status(400).json({ message: "Datum is verplicht." });
  }

  const rows = await getPublicAvailabilityByDate(date);
  return res.json(rows);
});

router.post("/appointments", appointmentRateLimiter, async (req, res) => {
  const {
    customerName,
    customerPhone,
    customerEmail,
    phoneId,
    issueTypeId,
    notes,
    slotId,
  } = req.body;

  if (!customerName || !customerPhone || !phoneId || !issueTypeId || !slotId) {
    return res.status(400).json({ message: "Vul alle verplichte velden in." });
  }

  try {
    const appointmentId = await createAppointment({
      customerName,
      customerPhone,
      customerEmail,
      phoneId: Number(phoneId),
      issueTypeId: Number(issueTypeId),
      notes,
      slotId: Number(slotId),
    });

    return res.status(201).json({
      message: "Afspraak succesvol ingepland.",
      appointmentId,
    });
  } catch (error) {
    return res.status(409).json({ message: error.message || "Afspraak kon niet worden opgeslagen." });
  }
});

module.exports = router;
