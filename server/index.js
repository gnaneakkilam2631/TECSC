import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
dotenv.config();

import { pool, ensureTables } from "./db.js";
import { sendResetCodeEmail, sendGenericEmail } from "./mailer.js";
import { notifyCustomerRepairReady, notifyAdminLowStock, notifyAdminStaffAbsent } from "./notify.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Every write request from the frontend carries who's doing it, via this header.
app.use((req, res, next) => {
  req.actor = req.headers["x-actor"] || null;
  next();
});

const BACKUP_DIR = path.join(process.cwd(), "backups");

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

async function logAction(req, action, details) {
  try {
    await pool.query("INSERT INTO audit_logs (actor, action, details) VALUES ($1, $2, $3)", [
      req.actor,
      action,
      details ? JSON.stringify(details) : null,
    ]);
  } catch (e) {
    console.error("Audit log failed:", e);
  }
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
  // Always respond the same way whether or not the user exists, so people can't guess valid usernames.
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

// --- Admin creates a staff login + staff record together ---
app.post("/api/create-staff-login", async (req, res) => {
  const { username, password, staffId, name, baseSalary, paidLeaveQuota, expectedHoursPerDay } = req.body;
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
  await pool.query(
    "INSERT INTO staff (id, name, base_salary, paid_leave_quota, expected_hours_per_day) VALUES ($1, $2, $3, $4, $5)",
    [staffId, name, baseSalary, paidLeaveQuota ?? 2, expectedHoursPerDay ?? 8]
  );
  await logAction(req, "staff_created", { name, username });
  res.json({ message: "Staff login created." });
});

// --- Staff records ---
app.get("/api/me", async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: "Missing username." });
  const result = await pool.query("SELECT username, role, email, staff_id FROM users WHERE username = $1", [username]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: "Not found." });
  res.json({ username: user.username, role: user.role, email: user.email, staffId: user.staff_id });
});

app.delete("/api/staff/:id", async (req, res) => {
  await pool.query("DELETE FROM users WHERE staff_id = $1", [req.params.id]);
  await pool.query("DELETE FROM staff WHERE id = $1", [req.params.id]);
  await logAction(req, "staff_deleted", { id: req.params.id });
  res.json({ message: "Staff removed." });
});

app.get("/api/staff", async (req, res) => {
  const result = await pool.query("SELECT * FROM staff");
  const staff = {};
  for (const row of result.rows) {
    staff[row.id] = {
      name: row.name,
      baseSalary: Number(row.base_salary),
      paidLeaveQuota: row.paid_leave_quota,
      expectedHoursPerDay: Number(row.expected_hours_per_day),
    };
  }
  res.json(staff);
});

// --- Inventory ---
app.get("/api/items", async (req, res) => {
  const result = await pool.query("SELECT * FROM items ORDER BY date DESC, id DESC");
  const items = result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    qty: r.qty,
    costPrice: Number(r.cost_price),
    sellingPrice: r.selling_price != null ? Number(r.selling_price) : null,
    supplier: r.supplier,
    date: r.date.toISOString().slice(0, 10),
    lowStockThreshold: r.low_stock_threshold,
    paid: r.paid,
    barcode: r.barcode,
  }));
  res.json(items);
});

app.post("/api/items", async (req, res) => {
  const { id, name, qty, costPrice, sellingPrice, supplier, date, lowStockThreshold, barcode } = req.body;
  if (!id || !name || !qty || costPrice == null || !date) return res.status(400).json({ error: "Missing fields." });
  await pool.query(
    "INSERT INTO items (id, name, qty, cost_price, selling_price, supplier, date, low_stock_threshold, barcode) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    [id, name, qty, costPrice, sellingPrice ?? null, supplier || null, date, lowStockThreshold ?? 5, barcode || null]
  );
  res.json({ message: "Item added." });
});

app.put("/api/items/:id", async (req, res) => {
  const { qty, paid, lowStockThreshold } = req.body;
  await pool.query(
    `UPDATE items SET
       qty = COALESCE($1, qty),
       paid = COALESCE($2, paid),
       low_stock_threshold = COALESCE($3, low_stock_threshold)
     WHERE id = $4`,
    [qty ?? null, paid ?? null, lowStockThreshold ?? null, req.params.id]
  );
  res.json({ message: "Item updated." });
});

app.delete("/api/items/:id", async (req, res) => {
  await pool.query("DELETE FROM items WHERE id = $1", [req.params.id]);
  await logAction(req, "item_deleted", { id: req.params.id });
  res.json({ message: "Item removed." });
});

// --- Sales / billing (deducts stock automatically if sold from inventory) ---
app.get("/api/sales", async (req, res) => {
  const result = await pool.query("SELECT * FROM sales ORDER BY date DESC, id DESC");
  const sales = result.rows.map((r) => ({
    id: r.id,
    itemId: r.item_id,
    itemName: r.item_name,
    qty: r.qty,
    unitPrice: Number(r.unit_price),
    total: Number(r.total),
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    date: r.date.toISOString().slice(0, 10),
  }));
  res.json(sales);
});

app.post("/api/sales", async (req, res) => {
  const { id, itemId, itemName, qty, unitPrice, customerName, customerPhone, date } = req.body;
  if (!id || !itemName || !qty || unitPrice == null || !date) return res.status(400).json({ error: "Missing fields." });
  const total = qty * unitPrice;
  await pool.query(
    "INSERT INTO sales (id, item_id, item_name, qty, unit_price, total, customer_name, customer_phone, date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    [id, itemId || null, itemName, qty, unitPrice, total, customerName || null, customerPhone || null, date]
  );
  if (itemId) {
    const updated = await pool.query("UPDATE items SET qty = GREATEST(qty - $1, 0) WHERE id = $2 RETURNING name, qty, low_stock_threshold", [qty, itemId]);
    const item = updated.rows[0];
    if (item && item.qty <= item.low_stock_threshold) {
      notifyAdminLowStock(item.name, item.qty);
    }
  }
  await logAction(req, "sale_recorded", { itemName, qty, total });
  res.json({ message: "Sale recorded." });
});

// --- Expenses ---
app.get("/api/expenses", async (req, res) => {
  const result = await pool.query("SELECT * FROM expenses ORDER BY date DESC, id DESC");
  const expenses = result.rows.map((r) => ({
    id: r.id,
    category: r.category,
    amount: Number(r.amount),
    date: r.date.toISOString().slice(0, 10),
    notes: r.notes,
  }));
  res.json(expenses);
});

app.post("/api/expenses", async (req, res) => {
  const { id, category, amount, date, notes } = req.body;
  if (!id || !category || amount == null || !date) return res.status(400).json({ error: "Missing fields." });
  await pool.query("INSERT INTO expenses (id, category, amount, date, notes) VALUES ($1,$2,$3,$4,$5)", [
    id,
    category,
    amount,
    date,
    notes || null,
  ]);
  await logAction(req, "expense_added", { category, amount });
  res.json({ message: "Expense added." });
});

app.delete("/api/expenses/:id", async (req, res) => {
  await pool.query("DELETE FROM expenses WHERE id = $1", [req.params.id]);
  await logAction(req, "expense_deleted", { id: req.params.id });
  res.json({ message: "Expense removed." });
});

// --- Settings (logo, shop display name) ---
app.get("/api/settings", async (req, res) => {
  const result = await pool.query("SELECT * FROM settings");
  const settings = {};
  for (const row of result.rows) settings[row.key] = row.value;
  res.json(settings);
});

app.post("/api/settings", async (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: "Missing key." });
  await pool.query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, value ?? null]
  );
  await logAction(req, "setting_changed", { key });
  res.json({ message: "Setting saved." });
});

// --- Change password (while logged in, requires current password) ---
app.post("/api/change-password", async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  if (!username || !currentPassword || !newPassword) return res.status(400).json({ error: "Missing fields." });

  const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
  const user = result.rows[0];
  if (!user) return res.status(400).json({ error: "Account not found." });

  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Current password is incorrect." });

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE users SET password_hash = $1 WHERE username = $2", [hash, username]);
  await logAction(req, "password_changed", { username });
  res.json({ message: "Password changed." });
});

// --- Rentals (computers rented out and returned) ---
app.get("/api/rentals", async (req, res) => {
  const result = await pool.query("SELECT * FROM rentals ORDER BY rent_out_date DESC, id DESC");
  const rentals = result.rows.map((r) => ({
    id: r.id,
    itemName: r.item_name,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    rentOutDate: r.rent_out_date.toISOString().slice(0, 10),
    returnDate: r.return_date ? r.return_date.toISOString().slice(0, 10) : null,
    amountPaid: Number(r.amount_paid),
    status: r.status,
    notes: r.notes,
  }));
  res.json(rentals);
});

app.post("/api/rentals", async (req, res) => {
  const { id, itemName, customerName, customerPhone, rentOutDate, amountPaid } = req.body;
  if (!id || !itemName || !customerName || !rentOutDate) return res.status(400).json({ error: "Missing fields." });
  await pool.query(
    "INSERT INTO rentals (id, item_name, customer_name, customer_phone, rent_out_date, amount_paid, status) VALUES ($1,$2,$3,$4,$5,$6,'rented')",
    [id, itemName, customerName, customerPhone || null, rentOutDate, amountPaid ?? 0]
  );
  await logAction(req, "rental_added", { itemName, customerName });
  res.json({ message: "Rental recorded." });
});

app.put("/api/rentals/:id", async (req, res) => {
  const { returnDate, amountPaid, status, notes } = req.body;
  await pool.query(
    `UPDATE rentals SET
       return_date = COALESCE($1, return_date),
       amount_paid = COALESCE($2, amount_paid),
       status = COALESCE($3, status),
       notes = COALESCE($4, notes)
     WHERE id = $5`,
    [returnDate || null, amountPaid ?? null, status || null, notes ?? null, req.params.id]
  );
  await logAction(req, "rental_updated", { id: req.params.id, status });
  res.json({ message: "Rental updated." });
});

// --- Time clock (check-in / check-out, including mid-day breaks) ---
app.post("/api/time-log", async (req, res) => {
  const { staffId, type } = req.body;
  if (!staffId || !["in", "out"].includes(type)) return res.status(400).json({ error: "Missing or invalid fields." });
  const result = await pool.query(
    "INSERT INTO time_logs (staff_id, event_type) VALUES ($1, $2) RETURNING logged_at",
    [staffId, type]
  );
  res.json({ loggedAt: result.rows[0].logged_at });
});

app.get("/api/time-logs", async (req, res) => {
  const result = await pool.query("SELECT * FROM time_logs ORDER BY logged_at ASC");
  const logs = result.rows.map((r) => ({ id: r.id, staffId: r.staff_id, type: r.event_type, loggedAt: r.logged_at }));
  res.json(logs);
});

// --- Attendance ---
app.get("/api/attendance", async (req, res) => {
  const result = await pool.query("SELECT * FROM attendance");
  const attendance = {};
  for (const row of result.rows) {
    attendance[`${row.staff_id}:${row.date.toISOString().slice(0, 10)}`] = {
      status: row.status || null,
      hours: row.hours_override != null ? Number(row.hours_override) : null,
    };
  }
  res.json(attendance);
});

app.post("/api/attendance", async (req, res) => {
  const { staffId, date, status } = req.body;
  if (!staffId || !date) return res.status(400).json({ error: "Missing fields." });
  if (!status) {
    await pool.query(
      "UPDATE attendance SET status = '' WHERE staff_id = $1 AND date = $2",
      [staffId, date]
    );
    await pool.query(
      "DELETE FROM attendance WHERE staff_id = $1 AND date = $2 AND (status = '' OR status IS NULL) AND hours_override IS NULL",
      [staffId, date]
    );
    return res.json({ message: "Attendance override cleared." });
  }
  await pool.query(
    `INSERT INTO attendance (staff_id, date, status) VALUES ($1, $2, $3)
     ON CONFLICT (staff_id, date) DO UPDATE SET status = EXCLUDED.status`,
    [staffId, date, status]
  );
  if (status === "absent") {
    const staffResult = await pool.query("SELECT name FROM staff WHERE id = $1", [staffId]);
    if (staffResult.rows[0]) notifyAdminStaffAbsent(staffResult.rows[0].name, date);
  }
  await logAction(req, "attendance_marked", { staffId, date, status });
  res.json({ message: "Attendance updated." });
});

// Lets the admin manually set exact hours worked for one day (e.g. staff
// forgot to clock in/out, or worked a partial day) — independent of the
// full-day status override above.
app.post("/api/attendance-hours", async (req, res) => {
  const { staffId, date, hours } = req.body;
  if (!staffId || !date) return res.status(400).json({ error: "Missing fields." });

  if (hours === null || hours === undefined || hours === "") {
    await pool.query("UPDATE attendance SET hours_override = NULL WHERE staff_id = $1 AND date = $2", [staffId, date]);
    await pool.query(
      "DELETE FROM attendance WHERE staff_id = $1 AND date = $2 AND (status = '' OR status IS NULL) AND hours_override IS NULL",
      [staffId, date]
    );
    return res.json({ message: "Hours override cleared." });
  }

  await pool.query(
    `INSERT INTO attendance (staff_id, date, status, hours_override) VALUES ($1, $2, '', $3)
     ON CONFLICT (staff_id, date) DO UPDATE SET hours_override = EXCLUDED.hours_override`,
    [staffId, date, Number(hours)]
  );
  await logAction(req, "attendance_hours_set", { staffId, date, hours });
  res.json({ message: "Hours saved." });
});

// --- Repair / service jobs ---
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
    warrantyDays: r.warranty_days,
    notes: r.notes,
  }));
  res.json(repairs);
});

// --- Public repair tracking (no login required) ---
app.get("/api/track", async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: "Phone number required." });
  const result = await pool.query(
    "SELECT * FROM repairs WHERE customer_phone = $1 ORDER BY date_in DESC",
    [phone.trim()]
  );
  const repairs = result.rows.map((r) => ({
    device: r.device,
    issue: r.issue,
    status: r.status,
    cost: r.cost != null ? Number(r.cost) : null,
    dateIn: r.date_in.toISOString().slice(0, 10),
    dateOut: r.date_out ? r.date_out.toISOString().slice(0, 10) : null,
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
  await logAction(req, "repair_added", { customerName, device });
  res.json({ message: "Repair job added." });
});

app.put("/api/repairs/:id", async (req, res) => {
  const { status, cost, dateOut, notes, warrantyDays } = req.body;
  const result = await pool.query(
    `UPDATE repairs SET
       status = COALESCE($1, status),
       cost = COALESCE($2, cost),
       date_out = COALESCE($3, date_out),
       notes = COALESCE($4, notes),
       warranty_days = COALESCE($5, warranty_days)
     WHERE id = $6
     RETURNING *`,
    [status || null, cost ?? null, dateOut || null, notes ?? null, warrantyDays ?? null, req.params.id]
  );
  const repair = result.rows[0];
  if (status === "completed" && repair) {
    notifyCustomerRepairReady(repair.customer_phone, repair.customer_name, repair.device);
  }
  await logAction(req, "repair_updated", { id: req.params.id, status });
  res.json({ message: "Repair job updated." });
});

// --- Backup & restore: exports/imports every table as one JSON file ---
const BACKUP_TABLES = ["users", "staff", "items", "attendance", "time_logs", "repairs", "sales", "expenses", "settings", "rentals"];

async function buildBackup() {
  const data = { createdAt: new Date().toISOString(), tables: {} };
  for (const table of BACKUP_TABLES) {
    const result = await pool.query(`SELECT * FROM ${table}`);
    data.tables[table] = result.rows;
  }
  return data;
}

async function writeBackupToDisk() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const data = await buildBackup();
    const filename = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    await fs.writeFile(path.join(BACKUP_DIR, filename), JSON.stringify(data, null, 2));
    console.log(`Backup saved: ${filename}`);
  } catch (e) {
    console.error("Auto-backup failed:", e);
  }
}

app.get("/api/backup", async (req, res) => {
  const data = await buildBackup();
  res.setHeader("Content-Disposition", `attachment; filename="tecsc-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(data);
});

app.post("/api/restore", async (req, res) => {
  const { tables } = req.body;
  if (!tables) return res.status(400).json({ error: "Invalid backup file." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const table of [...BACKUP_TABLES].reverse()) {
      await client.query(`DELETE FROM ${table}`);
    }
    for (const table of BACKUP_TABLES) {
      const rows = tables[table] || [];
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
        await client.query(
          `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
          values
        );
      }
    }
    await client.query("COMMIT");
    await logAction(req, "backup_restored", { filename: req.body.sourceFilename || "uploaded file" });
    res.json({ message: "Backup restored." });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Restore failed:", e);
    res.status(500).json({ error: "Restore failed. No changes were made." });
  } finally {
    client.release();
  }
});

app.get("/api/backup-list", async (req, res) => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const files = await fs.readdir(BACKUP_DIR);
    res.json(files.filter((f) => f.endsWith(".json")).sort().reverse());
  } catch (e) {
    res.json([]);
  }
});

// --- Audit log ---
app.get("/api/audit-logs", async (req, res) => {
  const result = await pool.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200");
  const logs = result.rows.map((r) => ({
    id: r.id,
    actor: r.actor,
    action: r.action,
    details: r.details ? JSON.parse(r.details) : null,
    createdAt: r.created_at,
  }));
  res.json(logs);
});

// --- Automated monthly email report to the admin ---
async function buildMonthlyReportHtml() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = lastMonth.getFullYear();
  const month = lastMonth.getMonth();
  const monthLabel = lastMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-31`;

  const sales = await pool.query("SELECT COALESCE(SUM(total),0) AS total FROM sales WHERE date BETWEEN $1 AND $2", [startDate, endDate]);
  const expenses = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE date BETWEEN $1 AND $2", [startDate, endDate]);
  const purchases = await pool.query("SELECT COALESCE(SUM(qty * cost_price),0) AS total FROM items WHERE date BETWEEN $1 AND $2", [startDate, endDate]);
  const repairIncome = await pool.query(
    "SELECT COALESCE(SUM(cost),0) AS total FROM repairs WHERE date_out BETWEEN $1 AND $2",
    [startDate, endDate]
  );
  const lowStock = await pool.query("SELECT name, qty FROM items WHERE qty <= low_stock_threshold");
  const openRepairs = await pool.query("SELECT COUNT(*) AS count FROM repairs WHERE status != 'delivered'");

  const salesTotal = Number(sales.rows[0].total);
  const expensesTotal = Number(expenses.rows[0].total);
  const purchasesTotal = Number(purchases.rows[0].total);
  const repairTotal = Number(repairIncome.rows[0].total);
  const income = salesTotal + repairTotal;
  const spend = expensesTotal + purchasesTotal;

  const lowStockList = lowStock.rows.map((r) => `<li>${r.name} — ${r.qty} left</li>`).join("");

  return {
    subject: `TECSC monthly report — ${monthLabel}`,
    html: `
      <h2>Monthly report — ${monthLabel}</h2>
      <p><strong>Sales income:</strong> ₹${Math.round(salesTotal).toLocaleString("en-IN")}</p>
      <p><strong>Repair income:</strong> ₹${Math.round(repairTotal).toLocaleString("en-IN")}</p>
      <p><strong>Expenses:</strong> ₹${Math.round(expensesTotal).toLocaleString("en-IN")}</p>
      <p><strong>Stock purchases:</strong> ₹${Math.round(purchasesTotal).toLocaleString("en-IN")}</p>
      <p><strong>Net:</strong> ₹${Math.round(income - spend).toLocaleString("en-IN")}</p>
      <p><strong>Open repair jobs right now:</strong> ${openRepairs.rows[0].count}</p>
      ${lowStockList ? `<p><strong>Low stock:</strong></p><ul>${lowStockList}</ul>` : ""}
    `,
  };
}

async function checkAndSendMonthlyReport() {
  try {
    const today = new Date();
    if (today.getDate() !== 1) return; // only run on the 1st of the month

    const marker = `monthly-report-${today.getFullYear()}-${today.getMonth()}`;
    const already = await pool.query("SELECT value FROM settings WHERE key = $1", [marker]);
    if (already.rows.length > 0) return; // already sent this month

    const adminResult = await pool.query("SELECT email FROM users WHERE role = 'admin' AND email IS NOT NULL LIMIT 1");
    const adminEmail = adminResult.rows[0]?.email;
    if (!adminEmail) return;

    const { subject, html } = await buildMonthlyReportHtml();
    await sendGenericEmail(adminEmail, subject, html);
    await pool.query("INSERT INTO settings (key, value) VALUES ($1, 'sent') ON CONFLICT (key) DO NOTHING", [marker]);
    console.log(`Monthly report emailed to ${adminEmail}`);
  } catch (e) {
    console.error("Monthly report failed:", e);
  }
}

const PORT = process.env.PORT || 4000;
ensureTables().then(() => {
  app.listen(PORT, () => console.log(`TECSC server running on http://localhost:${PORT}`));
  // Take a backup immediately on startup, then every 24 hours while the server is running.
  writeBackupToDisk();
  setInterval(writeBackupToDisk, 24 * 60 * 60 * 1000);
  checkAndSendMonthlyReport();
  setInterval(checkAndSendMonthlyReport, 24 * 60 * 60 * 1000);
});