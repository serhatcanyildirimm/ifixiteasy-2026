const fs = require("fs/promises");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const { pool } = require("./postgres");

const run = async () => {
  let client;

  try {
    client = await pool.connect();
    await client.query("SELECT 1");

    const migrationsDirectory = path.resolve(__dirname, "migrations");
    const migrationFiles = (await fs.readdir(migrationsDirectory))
      .filter((fileName) => fileName.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    for (const migrationFile of migrationFiles) {
      const migrationPath = path.resolve(migrationsDirectory, migrationFile);
      const sql = await fs.readFile(migrationPath, "utf8");
      console.log(`Voer migratie uit: ${migrationFile}`);

      await client.query("BEGIN");

      try {
        await client.query(sql);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Migratie ${migrationFile} mislukt: ${error.message}`);
      }
    }

    const { rows } = await client.query("SELECT to_regclass('public.admin_users') AS admin_users_table");
    const adminUsersTableExists = Boolean(rows[0]?.admin_users_table);

    if (!adminUsersTableExists) {
      throw new Error("Tabel admin_users ontbreekt na uitvoeren van de migraties.");
    }

    console.log(`Migraties succesvol uitgevoerd (${migrationFiles.length} bestanden).`);
  } catch (error) {
    console.error("Migraties mislukt:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exitCode = 1;
  } finally {
    if (client) {
      client.release();
    }

    await pool.end();
  }
};

run();
