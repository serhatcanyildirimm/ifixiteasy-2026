const BRAND = {
  primary: "#0a84ff",
  primaryDark: "#0066cc",
  accent: "#30d158",
  danger: "#ff3b30",
  warning: "#ff9f0a",
  dark: "#1c1c1e",
  text: "#111111",
  textMuted: "#6e6e73",
  bg: "#f5f5f7",
  white: "#ffffff",
  border: "#e5e5ea",
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const renderDetailRow = (label, value) => `
  <tr>
    <td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};color:${BRAND.textMuted};font-size:13px;width:38%;vertical-align:top;">
      ${escapeHtml(label)}
    </td>
    <td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};color:${BRAND.text};font-size:14px;font-weight:600;vertical-align:top;">
      ${escapeHtml(value)}
    </td>
  </tr>
`;

const renderDetailsCard = (rows) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;border:1px solid ${BRAND.border};border-radius:14px;overflow:hidden;background:${BRAND.bg};">
    ${rows.join("")}
  </table>
`;

const renderLayout = ({
  preheader,
  badge,
  badgeColor = BRAND.primary,
  headline,
  intro,
  bodyHtml = "",
  footerNote = "iFixItEasy — snelle en betrouwbare telefoonreparatie",
  variant = "customer",
}) => {
  const headerBg = variant === "admin" ? BRAND.dark : BRAND.primary;

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(headline)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BRAND.white};border-radius:20px;overflow:hidden;box-shadow:0 16px 40px rgba(17,17,17,0.08);">
          <tr>
            <td style="background-color:${headerBg};padding:28px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.75);">
                ${variant === "admin" ? "Admin notificatie" : "Telefoonreparatie"}
              </p>
              <img
                src="https://www.ifixiteasy.nl/assets/images/iFixItEasy-logo.png"
                alt="iFixItEasy"
                height="40"
                style="display:inline-block;height:40px;width:auto;max-width:100%;border:0;outline:none;text-decoration:none;background-color:${BRAND.white};padding:10px 18px;border-radius:12px;"
              />
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <span style="display:inline-block;padding:6px 12px;border-radius:999px;background-color:${badgeColor}18;color:${badgeColor};font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">
                ${escapeHtml(badge)}
              </span>
              <h2 style="margin:16px 0 12px;font-size:24px;line-height:1.3;color:${BRAND.text};letter-spacing:-0.02em;">
                ${escapeHtml(headline)}
              </h2>
              <p style="margin:0;font-size:16px;line-height:1.6;color:${BRAND.textMuted};">
                ${intro}
              </p>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-top:16px;border-top:1px solid ${BRAND.border};">
                    <p style="margin:0;font-size:12px;line-height:1.5;color:${BRAND.textMuted};text-align:center;">
                      ${escapeHtml(footerNote)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const buildAppointmentDetails = (appointment) => {
  const device = `${appointment.brand} ${appointment.model_name}`.trim();
  const start = String(appointment.start_time).slice(0, 5);
  const end = String(appointment.end_time).slice(0, 5);
  const slotText = `${appointment.slot_date} · ${start} – ${end}`;

  const rows = [
    renderDetailRow("Toestel", device),
    renderDetailRow("Probleem", appointment.issue_label),
    renderDetailRow("Datum & tijd", slotText),
  ];

  if (appointment.notes) {
    rows.push(renderDetailRow("Opmerking", appointment.notes));
  }

  return { device, slotText, rows, card: renderDetailsCard(rows) };
};

const buildContactDetails = (appointment) => {
  const rows = [
    renderDetailRow("Naam", appointment.customer_name),
    renderDetailRow("Telefoon", appointment.customer_phone),
    renderDetailRow("E-mail", appointment.customer_email || "—"),
  ];

  return renderDetailsCard(rows);
};

const customerBookingEmail = (appointment) => {
  const { card, device, slotText } = buildAppointmentDetails(appointment);
  const name = appointment.customer_name;

  return {
    subject: "Bevestiging van je afspraak bij iFixItEasy",
    text: [
      `Hallo ${name},`,
      "",
      "Je afspraak is succesvol ingepland.",
      "",
      `Toestel: ${device}`,
      `Probleem: ${appointment.issue_label}`,
      `Tijdslot: ${slotText}`,
      appointment.notes ? `Opmerking: ${appointment.notes}` : null,
      "",
      "Tot ziens bij iFixItEasy!",
    ]
      .filter(Boolean)
      .join("\n"),
    html: renderLayout({
      preheader: `Je afspraak voor ${device} staat gepland op ${slotText}.`,
      badge: "Afspraak bevestigd",
      badgeColor: BRAND.accent,
      headline: `Bedankt, ${name}!`,
      intro: "Je afspraak is succesvol ingepland. Hieronder vind je een overzicht van je gegevens.",
      bodyHtml: card,
      footerNote: "Kom je eerder of later? Neem even contact met ons op.",
    }),
  };
};

const adminNewBookingEmail = (appointment) => {
  const { card, device, slotText } = buildAppointmentDetails(appointment);

  return {
    subject: `Nieuwe afspraak #${appointment.id}`,
    text: [
      "Er is een nieuwe afspraak ingepland.",
      "",
      `Naam: ${appointment.customer_name}`,
      `Telefoon: ${appointment.customer_phone}`,
      `E-mail: ${appointment.customer_email || "—"}`,
      "",
      `Toestel: ${device}`,
      `Probleem: ${appointment.issue_label}`,
      `Tijdslot: ${slotText}`,
    ].join("\n"),
    html: renderLayout({
      variant: "admin",
      preheader: `Nieuwe afspraak van ${appointment.customer_name} voor ${device}.`,
      badge: `Afspraak #${appointment.id}`,
      badgeColor: BRAND.primary,
      headline: "Nieuwe afspraak ingepland",
      intro: "Er is zojuist een nieuwe afspraak via de website binnengekomen.",
      bodyHtml: `${buildContactDetails(appointment)}${card}`,
    }),
  };
};

const customerCancelledEmail = (appointment) => {
  const { card, device } = buildAppointmentDetails(appointment);
  const name = appointment.customer_name;

  return {
    subject: "Je afspraak bij iFixItEasy is geannuleerd",
    text: [
      `Hallo ${name},`,
      "",
      "Je afspraak is geannuleerd.",
      "",
      `Toestel: ${device}`,
      `Probleem: ${appointment.issue_label}`,
      "",
      "Heb je vragen? Neem gerust contact met ons op.",
    ].join("\n"),
    html: renderLayout({
      preheader: "Je afspraak is geannuleerd.",
      badge: "Geannuleerd",
      badgeColor: BRAND.danger,
      headline: `Hallo ${name}`,
      intro: "Je afspraak is geannuleerd. Hieronder staan de oorspronkelijke gegevens ter referentie.",
      bodyHtml: card,
      footerNote: "Wil je een nieuwe afspraak maken? Bezoek onze website.",
    }),
  };
};

const adminCancelledEmail = (appointment) => {
  const { card } = buildAppointmentDetails(appointment);

  return {
    subject: `Afspraak #${appointment.id} geannuleerd`,
    text: [
      `Afspraak #${appointment.id} is geannuleerd.`,
      "",
      `Naam: ${appointment.customer_name}`,
      `Telefoon: ${appointment.customer_phone}`,
    ].join("\n"),
    html: renderLayout({
      variant: "admin",
      preheader: `Afspraak #${appointment.id} is geannuleerd.`,
      badge: "Geannuleerd",
      badgeColor: BRAND.danger,
      headline: `Afspraak #${appointment.id} geannuleerd`,
      intro: "Deze afspraak is in het admin-panel gemarkeerd als geannuleerd.",
      bodyHtml: `${buildContactDetails(appointment)}${card}`,
    }),
  };
};

const customerDoneEmail = (appointment) => {
  const { card, device } = buildAppointmentDetails(appointment);
  const name = appointment.customer_name;

  return {
    subject: "Je reparatie is klaar – iFixItEasy",
    text: [
      `Hallo ${name},`,
      "",
      "Goed nieuws: je reparatie is afgerond. Je kunt je toestel ophalen.",
      "",
      `Toestel: ${device}`,
      "",
      "We zien je graag bij iFixItEasy!",
    ].join("\n"),
    html: renderLayout({
      preheader: `Je ${device} is klaar om opgehaald te worden.`,
      badge: "Reparatie klaar",
      badgeColor: BRAND.accent,
      headline: `Goed nieuws, ${name}!`,
      intro: "Je reparatie is afgerond. Je kunt je toestel op komen halen wanneer het jou uitkomt.",
      bodyHtml: `${card}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
          <tr>
            <td align="center" style="padding:16px 20px;background-color:${BRAND.accent}14;border-radius:14px;border:1px solid ${BRAND.accent}33;">
              <p style="margin:0;font-size:15px;line-height:1.5;color:${BRAND.text};">
                <strong style="color:${BRAND.accent};">Tip:</strong> Neem je referentienummer <strong>#${appointment.id}</strong> mee bij het ophalen.
              </p>
            </td>
          </tr>
        </table>`,
      footerNote: "Bedankt voor je vertrouwen in iFixItEasy!",
    }),
  };
};

const adminDoneEmail = (appointment) => {
  const { card } = buildAppointmentDetails(appointment);

  return {
    subject: `Afspraak #${appointment.id} afgerond`,
    text: [
      `Afspraak #${appointment.id} is gemarkeerd als afgerond.`,
      "",
      `Naam: ${appointment.customer_name}`,
      `Telefoon: ${appointment.customer_phone}`,
    ].join("\n"),
    html: renderLayout({
      variant: "admin",
      preheader: `Afspraak #${appointment.id} is afgerond.`,
      badge: "Afgerond",
      badgeColor: BRAND.accent,
      headline: `Afspraak #${appointment.id} afgerond`,
      intro: "De klant is per e-mail geïnformeerd dat de reparatie klaar is.",
      bodyHtml: `${buildContactDetails(appointment)}${card}`,
    }),
  };
};

const testEmail = () => ({
  subject: "iFixItEasy testmail",
  text: "Dit is een testmail vanuit je lokale Mailpit-setup.",
  html: renderLayout({
    preheader: "Testmail van iFixItEasy",
    badge: "Test",
    badgeColor: BRAND.warning,
    headline: "Je mailserver werkt!",
    intro: "Dit is een testmail vanuit je lokale Mailpit-setup. Als je dit ziet, is alles correct geconfigureerd.",
    bodyHtml: renderDetailsCard([
      renderDetailRow("SMTP", "localhost:1025"),
      renderDetailRow("Inbox", "http://localhost:8025"),
    ]),
  }),
});

module.exports = {
  adminCancelledEmail,
  adminDoneEmail,
  adminNewBookingEmail,
  customerBookingEmail,
  customerCancelledEmail,
  customerDoneEmail,
  testEmail,
};
