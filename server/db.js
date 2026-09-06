import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

export const pool = new pg.Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
});

export async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT,
      staff_id TEXT
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reset_codes (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      base_salary NUMERIC NOT NULL,
      paid_leave_quota INTEGER NOT NULL DEFAULT 2
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      qty INTEGER NOT NULL,
      cost_price NUMERIC NOT NULL,
      supplier TEXT,
      date DATE NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      staff_id TEXT NOT NULL,
      date DATE NOT NULL,
      status TEXT NOT NULL,
      PRIMARY KEY (staff_id, date)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS repairs (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      device TEXT NOT NULL,
      issue TEXT,
      status TEXT NOT NULL DEFAULT 'received',
      cost NUMERIC,
      date_in DATE NOT NULL,
      date_out DATE,
      notes TEXT
    );
  `);
}