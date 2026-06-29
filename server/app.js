const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { pool } = require("./db/postgres");
const publicRoutes = require("./routes/public.routes");
const adminRoutes = require("./routes/admin.routes");
const { ensureDefaultAdmin } = require("./services/admin-auth.service");
const { isMailEnabled } = require("./services/mail.service");

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, "..")));
app.use("/server/uploads", express.static(path.resolve(__dirname, "uploads")));

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Database verbinding mislukt." });
  }
});

app.use("/api/public", publicRoutes);
app.use("/api/admin", adminRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  const statusCode = error.statusCode || 500;
  const message = error.message || "Interne serverfout.";
  return res.status(statusCode).json({ message });
});

const startServer = async () => {
  try {
    await pool.query("SELECT 1");
    await ensureDefaultAdmin();
    const server = app.listen(port, () => {
      console.log(`Server draait op http://localhost:${port}`);
      if (isMailEnabled()) {
        console.log(
          `E-mail actief via ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 1025} (inbox: http://localhost:8025)`
        );
      } else {
        console.warn("E-mail uitgeschakeld: SMTP_HOST ontbreekt in .env");
      }
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Poort ${port} is al in gebruik. Stop de oude server (bijv. andere terminal) en start opnieuw.`
        );
      } else {
        console.error("Server start mislukt:", error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Server start mislukt:", error.message);
    process.exit(1);
  }
};

startServer();
