const nodemailer = require("nodemailer");
const {
  adminCancelledEmail,
  adminDoneEmail,
  adminNewBookingEmail,
  customerBookingEmail,
  customerCancelledEmail,
  customerDoneEmail,
  testEmail,
} = require("./mail-templates");

const NOTIFY_STATUSES = ["cancelled", "done"];

const isMailEnabled = () => Boolean(process.env.SMTP_HOST);

let transporter;

const getTransporter = () => {
  if (!isMailEnabled()) {
    return null;
  }

  if (!transporter) {
    const hasAuth = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 1025),
      secure: process.env.SMTP_SECURE === "true",
      auth: hasAuth
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
  }

  return transporter;
};

const getFromAddress = () => process.env.MAIL_FROM || "noreply@ifixiteasy.nl";

const getAdminRecipient = () => process.env.MAIL_ADMIN || process.env.ADMIN_DEFAULT_EMAIL;

const sendMail = async ({ to, subject, text, html }) => {
  const transport = getTransporter();

  if (!transport) {
    console.warn("E-mail overgeslagen: SMTP_HOST ontbreekt in .env — herstart de server na het aanpassen van .env");
    return { skipped: true };
  }

  const info = await transport.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  });

  return { messageId: info.messageId };
};

const sendMailSafe = async (payload) => {
  try {
    return await sendMail(payload);
  } catch (error) {
    console.error("E-mail versturen mislukt:", error.message);
    return { error: error.message };
  }
};

const sendAppointmentCreatedEmails = async (appointment) => {
  const adminEmail = getAdminRecipient();
  const tasks = [];

  if (appointment.customer_email) {
    const email = customerBookingEmail(appointment);
    tasks.push(sendMailSafe({ to: appointment.customer_email, ...email }));
  }

  if (adminEmail) {
    const email = adminNewBookingEmail(appointment);
    tasks.push(sendMailSafe({ to: adminEmail, ...email }));
  }

  const results = await Promise.all(tasks);
  const sent = results.filter((r) => r?.messageId).length;
  const skipped = results.filter((r) => r?.skipped).length;
  console.log(`Afspraak #${appointment.id}: ${sent} mail(s) verstuurd${skipped ? `, ${skipped} overgeslagen` : ""}`);
};

const sendCancelledEmails = async (appointment) => {
  const adminEmail = getAdminRecipient();
  const tasks = [];

  if (appointment.customer_email) {
    const email = customerCancelledEmail(appointment);
    tasks.push(sendMailSafe({ to: appointment.customer_email, ...email }));
  }

  if (adminEmail) {
    const email = adminCancelledEmail(appointment);
    tasks.push(sendMailSafe({ to: adminEmail, ...email }));
  }

  await Promise.all(tasks);
};

const sendDoneEmails = async (appointment) => {
  const adminEmail = getAdminRecipient();
  const tasks = [];

  if (appointment.customer_email) {
    const email = customerDoneEmail(appointment);
    tasks.push(sendMailSafe({ to: appointment.customer_email, ...email }));
  }

  if (adminEmail) {
    const email = adminDoneEmail(appointment);
    tasks.push(sendMailSafe({ to: adminEmail, ...email }));
  }

  await Promise.all(tasks);
};

const sendAppointmentStatusChangeEmails = async (appointment, previousStatus) => {
  if (!appointment) {
    return;
  }

  if (previousStatus === appointment.status) {
    return;
  }

  if (!NOTIFY_STATUSES.includes(appointment.status)) {
    return;
  }

  if (appointment.status === "cancelled") {
    await sendCancelledEmails(appointment);
    return;
  }

  if (appointment.status === "done") {
    await sendDoneEmails(appointment);
  }
};

const sendTestEmail = async (to) => {
  const recipient = to || getAdminRecipient();

  if (!recipient) {
    throw new Error("Geen ontvanger: zet MAIL_ADMIN of geef een e-mailadres mee.");
  }

  const email = testEmail();
  return sendMail({ to: recipient, ...email });
};

module.exports = {
  isMailEnabled,
  sendAppointmentCreatedEmails,
  sendAppointmentStatusChangeEmails,
  sendMail,
  sendMailSafe,
  sendTestEmail,
};
