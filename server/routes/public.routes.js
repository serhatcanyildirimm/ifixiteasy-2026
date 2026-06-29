const express = require("express");
const rateLimit = require("express-rate-limit");
const { getPublicPhones, resolveCustomPhoneId } = require("../services/phones.service");
const { getPublicIssues, resolveCustomIssueId } = require("../services/issues.service");
const { getPublicAvailabilityByDate } = require("../services/availability.service");
const { createAppointment, getAppointmentById } = require("../services/appointments.service");
const { sendAppointmentCreatedEmails } = require("../services/mail.service");

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
    customDeviceName,
    deviceCategory,
    issueTypeId,
    customIssueLabel,
    notes,
    slotId,
  } = req.body;

  if (!customerName || !customerPhone || !slotId) {
    return res.status(400).json({ message: "Vul alle verplichte velden in." });
  }
  if (!phoneId && !customDeviceName) {
    return res.status(400).json({ message: "Kies een toestel of typ je toestelnaam." });
  }
  if (!issueTypeId && !customIssueLabel) {
    return res.status(400).json({ message: "Kies een probleem of omschrijf het zelf." });
  }

  try {
    const resolvedPhoneId = phoneId
      ? Number(phoneId)
      : await resolveCustomPhoneId(customDeviceName, deviceCategory);

    const resolvedIssueTypeId = issueTypeId
      ? Number(issueTypeId)
      : await resolveCustomIssueId(customIssueLabel);

    const appointmentId = await createAppointment({
      customerName,
      customerPhone,
      customerEmail,
      phoneId: resolvedPhoneId,
      issueTypeId: resolvedIssueTypeId,
      notes,
      slotId: Number(slotId),
    });

    const appointment = await getAppointmentById(appointmentId);
    if (appointment) {
      try {
        await sendAppointmentCreatedEmails(appointment);
        console.log(`Bevestigingsmail(s) verstuurd voor afspraak #${appointmentId}`);
      } catch (error) {
        console.error(`Bevestigingsmail voor afspraak #${appointmentId} mislukt:`, error.message);
      }
    }

    return res.status(201).json({
      message: "Afspraak succesvol ingepland.",
      appointmentId,
    });
  } catch (error) {
    return res.status(409).json({ message: error.message || "Afspraak kon niet worden opgeslagen." });
  }
});

module.exports = router;
