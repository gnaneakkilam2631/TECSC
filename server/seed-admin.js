import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();
import { pool, ensureTables } from "./db.js";

async function run() {
  await ensureTables();

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const email = process.env.ADMIN_EMAIL;

  if (!username || !password || !email) {
    console.error("Set ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_EMAIL in your .env file first.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);

  const existing = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
  if (existing.rows.length > 0) {
    await pool.query("UPDATE users SET password_hash = $1, email = $2, role = 'admin' WHERE username = $3", [hash, email, username]);
    console.log(`Updated existing admin account "${username}".`);
  } else {
    await pool.query("INSERT INTO users (username, password_hash, role, email) VALUES ($1, $2, 'admin', $3)", [username, hash, email]);
    console.log(`Created admin account "${username}".`);
  }

  await pool.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});