import { pool } from "../config/db.js";

export async function listCourts() {
  const [rows] = await pool.query("SELECT * FROM courts ORDER BY id");
  return rows;
}

export async function findCourtById(id) {
  const [rows] = await pool.query("SELECT * FROM courts WHERE id = ?", [id]);
  return rows[0];
}

export async function createCourt({ name, location, status = "available" }) {
  const [res] = await pool.query(
    "INSERT INTO courts (name, location, status) VALUES (?, ?, ?)",
    [name, location, status]
  );
  return { id: res.insertId, name, location, status };
}

export async function updateCourtStatus(id, status) {
  await pool.query("UPDATE courts SET status = ? WHERE id = ?", [status, id]);
  const court = await findCourtById(id);
  return court;
}