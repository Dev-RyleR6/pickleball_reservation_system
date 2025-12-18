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

export async function getAllUsers() {
  const [rows] = await pool.query("SELECT id, name, email, role FROM users");
  return rows;
}

export async function updateUserRole(id, role) {
  await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
  return getUserById(id);
}

export async function deleteUser(id) {
  // First check if user has any reservations
  const [reservations] = await pool.query("SELECT COUNT(*) as count FROM reservations WHERE user_id = ?", [id]);
  
  if (reservations[0].count > 0) {
    // Cancel all user's reservations first
    await pool.query("UPDATE reservations SET status = 'cancelled' WHERE user_id = ?", [id]);
  }
  
  // Delete the user
  await pool.query("DELETE FROM users WHERE id = ?", [id]);
  return true;
}