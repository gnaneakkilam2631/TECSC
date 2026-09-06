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
  return String(Math.floor(100000 + Math.random() * 900000));
}

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

app.post("/api/forgot-password", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username required." });

  const result = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $1", [username]);
  const user = result.rows[0];
  if (!user || !user.email) {
    return res.json({ message: "If that account exists, a code has been sent." });
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await pool.query("INSERT INTO reset_codes (username, code, expires_at) VALUES ($1, $2, $3)", [user.username, code, expiresAt]);

  try {
    await sendResetCodeEmail(user.email, code);
  } catch (e) {
    console.error("Failed to send email:", e);
    return res.status(500).json({ error: "Could not send email. Check the server's email setup." });
  }

  res.json({ message: "If that account exists, a code has been sent." });
});

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

app.post("/api/create-staff-login", async (req, res) => {
  const { username, password, staffId, name, baseSalary, paidLeaveQuota } = req.body;
  if (!username || !password || !staffId || !name || baseSalary == null) {
    return res.status(400).json({ error: "Missing fields." });
  }

  const existing = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
  if (existing.rows.length > 0) return res.status(400).json({ error: "That username is already taken." });

  const hash = await bcrypt.hash(password, 10);
  await pool.query("INSERT INTO users (username, password_hash, role, staff_id) VALUES ($1, $2, 'staff', $3)", [
    username,
    hash,
    staffId,
  ]);
  await pool.query("INSERT INTO staff (id, name, base_salary, paid_leave_quota) VALUES ($1, $2, $3, $4)", [
    staffId,
    name,
    baseSalary,
    paidLeaveQuota ?? 2,
  ]);
  res.json({ message: "Staff login created." });
});

app.get("/api/staff", async (req, res) => {
  const result = await pool.query("SELECT * FROM staff");
  const staff = {};
  for (const row of result.rows) {
    staff[row.id] = { name: row.name, baseSalary: Number(row.base_salary), paidLeaveQuota: row.paid_leave_quota };
  }
  res.json(staff);
});

app.get("/api/items", async (req, res) => {
  const result = await pool.query("SELECT * FROM items ORDER BY date DESC, id DESC");
  const items = result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    qty: r.qty,
    costPrice: Number(r.cost_price),
    supplier: r.supplier,
    date: r.date.toISOString().slice(0, 10),
  }));
  res.json(items);
});

app.post("/api/items", async (req, res) => {
  const { id, name, qty, costPrice, supplier, date } = req.body;
  if (!id || !name || !qty || costPrice == null || !date) return res.status(400).json({ error: "Missing fields." });
  await pool.query("INSERT INTO items (id, name, qty, cost_price, supplier, date) VALUES ($1,$2,$3,$4,$5,$6)", [
    id,
    name,
    qty,
    costPrice,
    supplier || null,
    date,
  ]);
  res.json({ message: "Item added." });
});

app.delete("/api/items/:id", async (req, res) => {
  await pool.query("DELETE FROM items WHERE id = $1", [req.params.id]);
  res.json({ message: "Item removed." });
});

app.get("/api/attendance", async (req, res) => {
  const result = await pool.query("SELECT * FROM attendance");
  const attendance = {};
  for (const row of result.rows) {
    attendance[`${row.staff_id}:${row.date.toISOString().slice(0, 10)}`] = row.status;
  }
  res.json(attendance);
});

app.post("/api/attendance", async (req, res) => {
  const { staffId, date, status } = req.body;
  if (!staffId || !date || !status) return res.status(400).json({ error: "Missing fields." });
  await pool.query(
    `INSERT INTO attendance (staff_id, date, status) VALUES ($1, $2, $3)
     ON CONFLICT (staff_id, date) DO UPDATE SET status = EXCLUDED.status`,
    [staffId, date, status]
  );
  res.json({ message: "Attendance updated." });
});

app.get("/api/repairs", async (req, res) => {
  const result = await pool.query("SELECT * FROM repairs ORDER BY date_in DESC, id DESC");
  const repairs = result.rows.map((r) => ({
    id: r.id,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    device: r.device,
    issue: r.issue,
    status: r.status,
    cost: r.cost != null ? Number(r.cost) : null,
    dateIn: r.date_in.toISOString().slice(0, 10),
    dateOut: r.date_out ? r.date_out.toISOString().slice(0, 10) : null,
    notes: r.notes,
  }));
  res.json(repairs);
});

app.post("/api/repairs", async (req, res) => {
  const { id, customerName, customerPhone, device, issue, dateIn } = req.body;
  if (!id || !customerName || !device || !dateIn) return res.status(400).json({ error: "Missing fields." });
  await pool.query(
    `INSERT INTO repairs (id, customer_name, customer_phone, device, issue, status, date_in)
     VALUES ($1,$2,$3,$4,$5,'received',$6)`,
    [id, customerName, customerPhone || null, device, issue || null, dateIn]
  );
  res.json({ message: "Repair job added." });
});

app.put("/api/repairs/:id", async (req, res) => {
  const { status, cost, dateOut, notes } = req.body;
  await pool.query(
    `UPDATE repairs SET
       status = COALESCE($1, status),
       cost = COALESCE($2, cost),
       date_out = COALESCE($3, date_out),
       notes = COALESCE($4, notes)
     WHERE id = $5`,
    [status || null, cost ?? null, dateOut || null, notes ?? null, req.params.id]
  );
  res.json({ message: "Repair job updated." });
});

const PORT = process.env.PORT || 4000;
ensureTables().then(() => {
  app.listen(PORT, () => console.log(`TECSC server running on http://localhost:${PORT}`));
});