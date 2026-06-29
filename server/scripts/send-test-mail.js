const dotenv = require("dotenv");

dotenv.config();

const { sendTestEmail, isMailEnabled } = require("../services/mail.service");

const run = async () => {
  if (!isMailEnabled()) {
    console.error("SMTP_HOST ontbreekt in .env");
    process.exit(1);
  }

  const to = process.argv[2];
  const result = await sendTestEmail(to);

  console.log(`Testmail verstuurd naar ${to || process.env.MAIL_ADMIN || process.env.ADMIN_DEFAULT_EMAIL}`);
  console.log(`Message-ID: ${result.messageId}`);
  console.log("Bekijk de mail in Mailpit: http://localhost:8025");
};

run().catch((error) => {
  console.error("Testmail mislukt:", error.message);
  process.exit(1);
});
