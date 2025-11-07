import { pool } from "../config/db.js";

export async function createUser({ name, email, passwordHash, role = "player" }) {
  const [result] = await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, passwordHash, role]
  );
  return { id: result.insertId, name, email, role };
}

export async function getUserByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
}

export async function getUserById(id) {
  const [rows] = await pool.query("SELECT id, name, email, role FROM users WHERE id = ?", [id]);
  return rows[0];
}
