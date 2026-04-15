const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const { pool } = require("./db/mysql");
const publicRoutes = require("./routes/public.routes");
const adminRoutes = require("./routes/admin.routes");
const { ensureDefaultAdmin } = require("./services/admin-auth.service");

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
    app.listen(port, () => {
      console.log(`Server draait op http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Server start mislukt:", error.message);
    process.exit(1);
  }
};

startServer();
