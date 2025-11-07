import { pool } from "../config/db.js";

export async function listCourts() {
  const [rows] = await pool.query("SELECT * FROM courts ORDER BY id");
  return rows;
}

export async function getCourtById(id) {
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
