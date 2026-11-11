import { app } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";

try {
  await pool.query("SELECT 1");
  app.listen(config.port, () => {
    console.log(`Auth API listening on port ${config.port}`);
  });
} catch (error) {
  console.error("Could not connect to the MySQL database:", error);
  process.exitCode = 1;
  await pool.end();
}
