import { pool } from "../config/db.js";

/**
 * Check overlap for same court & date:
 * overlap if start_time < existing.end_time AND end_time > existing.start_time
 */
export async function hasConflict({ court_id, date, start_time, end_time }) {
  const [rows] = await pool.query(
    `SELECT * FROM reservations
     WHERE court_id = ? AND date = ?
       AND status IN ('pending','approved')
       AND NOT (end_time <= ? OR start_time >= ?)`,
    [court_id, date, start_time, end_time]
  );
  return rows.length > 0;
}

export async function createReservation({ user_id, court_id, date, start_time, end_time, status = "pending" }) {
  const [res] = await pool.query(
    `INSERT INTO reservations (user_id, court_id, date, start_time, end_time, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user_id, court_id, date, start_time, end_time, status]
  );
  return { id: res.insertId, user_id, court_id, date, start_time, end_time, status };
}

export async function getReservationsForUser(user_id) {
  const [rows] = await pool.query(
    `SELECT r.*, u.name as user_name, c.name as court_name
     FROM reservations r
     JOIN users u ON r.user_id = u.id
     JOIN courts c ON r.court_id = c.id
     WHERE r.user_id = ?
     ORDER BY r.date, r.start_time`,
    [user_id]
  );
  return rows;
}

export async function getAllReservations() {
  const [rows] = await pool.query(
    `SELECT r.*, u.name as user_name, c.name as court_name
     FROM reservations r
     JOIN users u ON r.user_id = u.id
     JOIN courts c ON r.court_id = c.id
     ORDER BY r.date, r.start_time`
  );
  return rows;
}

export async function getReservationById(id) {
  const [rows] = await pool.query("SELECT * FROM reservations WHERE id = ?", [id]);
  return rows[0];
}

export async function updateReservationStatus(id, status) {
  await pool.query("UPDATE reservations SET status = ? WHERE id = ?", [status, id]);
  const res = await getReservationById(id);
  return res;
}

export async function cancelReservation(id, user_id) {
  await pool.query("UPDATE reservations SET status = 'cancelled' WHERE id = ? AND user_id = ?", [id, user_id]);
  return getReservationById(id);
}
