import * as courtModel from "../models/courtModel.js";

export async function getCourts(req, res, next) {
  try {
    const courts = await courtModel.listCourts();
    res.json({ courts });
  } catch (err) {
    next(err);
  }
}

export async function getCourtById(req, res, next) {
  try {
    const { id } = req.params;
    const court = await courtModel.findCourtById(id);
    if (!court) return res.status(404).json({ error: "Court not found" });
    res.json({ court });
  } catch (err) {
    next(err);
  }
}

export async function addCourt(req, res, next) {
  try {
    const { name, location } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    const court = await courtModel.createCourt({ name, location });
    res.status(201).json({ court });
  } catch (err) { next(err); }
}

export async function updateCourtStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status required" });
    const court = await courtModel.updateCourtStatus(id, status);
    res.json({ court });
  } catch (err) {
    next(err);
  }
}
