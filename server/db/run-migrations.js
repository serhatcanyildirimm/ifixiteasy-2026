const fs = require("fs/promises");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const { pool } = require("./mysql");

const splitSqlStatements = (sql) =>
  sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

const run = async () => {
  try {
    const migrationsDirectory = path.resolve(__dirname, "migrations");
    const migrationFiles = (await fs.readdir(migrationsDirectory))
      .filter((fileName) => fileName.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    for (const migrationFile of migrationFiles) {
      const migrationPath = path.resolve(migrationsDirectory, migrationFile);
      const sql = await fs.readFile(migrationPath, "utf8");
      const statements = splitSqlStatements(sql);

      for (const statement of statements) {
        try {
          await pool.query(statement);
        } catch (error) {
          const isDuplicateColumn = error.code === "ER_DUP_FIELDNAME";
          if (!isDuplicateColumn) {
            throw error;
          }
        }
      }
    }

    console.log(`Migraties succesvol uitgevoerd (${migrationFiles.length} bestanden).`);
    process.exit(0);
  } catch (error) {
    console.error("Migraties mislukt:", error.message);
    process.exit(1);
  }
};

run();
