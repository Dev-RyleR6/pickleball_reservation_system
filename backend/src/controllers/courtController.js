import { listCourts, createCourt } from "../models/courtModel.js";

export async function getCourts(req, res, next) {
  try {
    const courts = await listCourts();
    res.json({ courts });
  } catch (err) { next(err); }
}

export async function addCourt(req, res, next) {
  try {
    const { name, location } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    const court = await createCourt({ name, location });
    res.status(201).json({ court });
  } catch (err) { next(err); }
}
