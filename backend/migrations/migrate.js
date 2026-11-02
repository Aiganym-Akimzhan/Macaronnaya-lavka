import { createPool, migrateAndSeed } from "./createTable.js";

const pool = createPool();
try {
  await migrateAndSeed(pool);
  console.log("Products table is working");
} catch (error) {
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
