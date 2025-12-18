import { pool } from "../config/db.js";

/**
 * Check overlap for same court & date:
 * overlap if start_time < existing.end_time AND end_time > existing.start_time
 * @param {number} excludeId - Optional reservation ID to exclude from conflict check (e.g., when approving)
 */
export async function hasConflict({ court_id, date, start_time, end_time, excludeId = null }) {
  // Only check for conflicts with approved reservations or pending reservations for future dates
  const today = new Date().toISOString().split('T')[0];
  
  // Ensure excludeId is a number if provided
  const excludeIdNum = excludeId ? parseInt(excludeId) : null;
  
  // Only check for conflicts if the reservation date is today or in the future
  // Past reservations can't conflict with future ones
  if (date < today) {
    console.log("Reservation date is in the past, no conflict check needed:", date);
    return false;
  }
  
  // Normalize time formats - ensure both are in HH:MM:SS format for comparison
  const normalizeTime = (time) => {
    if (!time) return time;
    // If time is in HH:MM format, convert to HH:MM:SS
    if (time.length === 5) return time + ':00';
    return time;
  };
  
  const normalizedStart = normalizeTime(start_time);
  const normalizedEnd = normalizeTime(end_time);
  
  // Build the query - check for overlapping time slots
  // Overlap occurs when: NOT (end_time <= start OR start_time >= end)
  // Which means: start_time < existing.end_time AND end_time > existing.start_time
  // Exclude expired and cancelled reservations from conflict check
  let query = `SELECT id, status, start_time, end_time, user_id, date FROM reservations
     WHERE court_id = ? 
       AND date = ?
       AND date >= ?
       AND status IN ('approved', 'pending')
       AND status != 'expired'
       AND status != 'cancelled'
       AND NOT (end_time <= ? OR start_time >= ?)`;
  let params = [court_id, date, today, normalizedStart, normalizedEnd];
  
  if (excludeIdNum && !isNaN(excludeIdNum)) {
    query += ` AND id != ?`;
    params.push(excludeIdNum);
  }
  
  console.log("Conflict check query:", query);
  console.log("Conflict check params:", params);
  console.log("Normalized times - start:", normalizedStart, "end:", normalizedEnd);
  
  const [rows] = await pool.query(query, params);
  
  // Debug logging
  if (rows.length > 0) {
    console.log("Conflict detected:", {
      court_id,
      date,
      originalStart: start_time,
      originalEnd: end_time,
      normalizedStart,
      normalizedEnd,
      excludeId: excludeIdNum,
      conflictsFound: rows.length,
      conflicts: rows.map(r => ({ 
        id: r.id, 
        status: r.status, 
        start: r.start_time, 
        end: r.end_time,
        date: r.date
      }))
    });
  } else {
    console.log("No conflicts found for:", { 
      court_id, 
      date, 
      start_time, 
      end_time, 
      normalizedStart,
      normalizedEnd,
      excludeId: excludeIdNum 
    });
  }
  
  return rows.length > 0;
}

/**
 * Cancel old pending reservations that are in the past
 */
export async function cancelOldPendingReservations() {
  const today = new Date().toISOString().split('T')[0];
  const [result] = await pool.query(
    `UPDATE reservations 
     SET status = 'cancelled' 
     WHERE status = 'pending' 
     AND date < ?`,
    [today]
  );
  return result.affectedRows;
}

/**
 * Mark old approved reservations as expired (past their date and time)
 */
export async function markExpiredReservations() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
  
  // Mark reservations as expired if:
  // 1. Date is in the past, OR
  // 2. Date is today but end_time has passed
  const [result] = await pool.query(
    `UPDATE reservations 
     SET status = 'expired' 
     WHERE status IN ('approved', 'pending')
     AND (
       date < ? 
       OR (date = ? AND end_time < ?)
     )`,
    [today, today, currentTime]
  );
  return result.affectedRows;
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
     ORDER BY r.id DESC, r.date DESC, r.start_time DESC`,
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
     ORDER BY r.id DESC, r.date DESC, r.start_time DESC`
  );
  return rows;
}

export async function getReservationById(id) {
  const [rows] = await pool.query(
    `SELECT r.*, u.name as user_name, c.name as court_name
     FROM reservations r
     JOIN users u ON r.user_id = u.id
     JOIN courts c ON r.court_id = c.id
     WHERE r.id = ?`,
    [id]
  );
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
