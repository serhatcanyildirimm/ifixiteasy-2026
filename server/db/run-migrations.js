const fs = require("fs/promises");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const { pool } = require("./postgres");

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
          const isDuplicateColumn = error.code === "42701";
          const isDuplicateTable = error.code === "42P07";
          const isDuplicateObject = error.code === "42710";
          if (!isDuplicateColumn && !isDuplicateTable && !isDuplicateObject) {
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
