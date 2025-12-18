import { pool } from "../config/db.js";

export async function listCourts() {
  const [rows] = await pool.query("SELECT * FROM courts ORDER BY id");
  return rows;
}

export async function findCourtById(id) {
  const [rows] = await pool.query("SELECT * FROM courts WHERE id = ?", [id]);
  return rows[0];
}

export async function createCourt({ name, location, status = "available", image = null }) {
  const [res] = await pool.query(
    "INSERT INTO courts (name, location, status, image) VALUES (?, ?, ?, ?)",
    [name, location, status, image]
  );
  return { id: res.insertId, name, location, status, image };
}

export async function updateCourtStatus(id, status) {
  await pool.query("UPDATE courts SET status = ? WHERE id = ?", [status, id]);
  const court = await findCourtById(id);
  return court;
}

export async function updateCourt(id, { name, location, image }) {
  if (image !== undefined) {
    await pool.query("UPDATE courts SET name = ?, location = ?, image = ? WHERE id = ?", [name, location, image, id]);
  } else {
    await pool.query("UPDATE courts SET name = ?, location = ? WHERE id = ?", [name, location, id]);
  }
  const court = await findCourtById(id);
  return court;
}

export async function deleteCourt(id) {
  // Check if court has any reservations
  const [reservations] = await pool.query("SELECT COUNT(*) as count FROM reservations WHERE court_id = ?", [id]);
  if (reservations[0].count > 0) {
    throw new Error("Cannot delete court with existing reservations");
  }
  
  await pool.query("DELETE FROM courts WHERE id = ?", [id]);
  return { id, deleted: true };
}