import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

import { pool, ensureTables } from "./db.js";
import { sendResetCodeEmail } from "./mailer.js";

const app = express();
app.use(cors());
app.use(express.json());

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

// --- Login ---
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required." });

  const result = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $1", [username]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: "Incorrect username or password." });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Incorrect username or password." });

  res.json({ username: user.username, role: user.role, staffId: user.staff_id });
});

// --- Step 1 of forgot password: request a code by email ---
app.post("/api/forgot-password", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username required." });

  const result = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $1", [username]);
  const user = result.rows[0];
  if (!user || !user.email) {
    return res.json({ message: "If that account exists, a code has been sent." });
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await pool.query("INSERT INTO reset_codes (username, code, expires_at) VALUES ($1, $2, $3)", [user.username, code, expiresAt]);

  try {
    await sendResetCodeEmail(user.email, code);
  } catch (e) {
    console.error("Failed to send email:", e);
    return res.status(500).json({ error: "Could not send email. Check the server's email setup." });
  }

  res.json({ message: "If that account exists, a code has been sent." });
});

// --- Step 2 of forgot password: verify code and set new password ---
app.post("/api/reset-password", async (req, res) => {
  const { username, code, newPassword } = req.body;
  if (!username || !code || !newPassword) return res.status(400).json({ error: "Missing fields." });

  const userResult = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $1", [username]);
  const user = userResult.rows[0];
  if (!user) return res.status(400).json({ error: "Invalid code." });

  const result = await pool.query(
    "SELECT * FROM reset_codes WHERE username = $1 AND code = $2 ORDER BY id DESC LIMIT 1",
    [user.username, code]
  );
  const record = result.rows[0];
  if (!record) return res.status(400).json({ error: "Invalid code." });
  if (new Date(record.expires_at) < new Date()) return res.status(400).json({ error: "Code has expired. Request a new one." });

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE users SET password_hash = $1 WHERE username = $2", [hash, user.username]);
  await pool.query("DELETE FROM reset_codes WHERE username = $1", [user.username]);

  res.json({ message: "Password updated. You can now sign in." });
});

// --- Admin creates a staff login ---
app.post("/api/create-staff-login", async (req, res) => {
  const { username, password, staffId } = req.body;
  if (!username || !password || !staffId) return res.status(400).json({ error: "Missing fields." });

  const existing = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
  if (existing.rows.length > 0) return res.status(400).json({ error: "That username is already taken." });

  const hash = await bcrypt.hash(password, 10);
  await pool.query("INSERT INTO users (username, password_hash, role, staff_id) VALUES ($1, $2, 'staff', $3)", [
    username,
    hash,
    staffId,
  ]);
  res.json({ message: "Staff login created." });
});

const PORT = process.env.PORT || 4000;
ensureTables().then(() => {
  app.listen(PORT, () => console.log(`TECSC server running on http://localhost:${PORT}`));
});