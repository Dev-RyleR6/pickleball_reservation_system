import * as courtModel from "../models/courtModel.js";
import {
  emitCourtCreated,
  emitCourtUpdated,
  emitCourtDeleted,
  emitCourtStatusChanged,
} from "../socket/socketEvents.js";

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
    
    // Get image filename if file was uploaded
    const image = req.file ? `/uploads/courts/${req.file.filename}` : null;
    
    const court = await courtModel.createCourt({ name, location, image });
    emitCourtCreated(court);
    res.status(201).json({ court });
  } catch (err) { next(err); }
}

export async function updateCourtStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status required" });
    const court = await courtModel.updateCourtStatus(id, status);
    emitCourtStatusChanged(court);
    res.json({ court });
  } catch (err) {
    next(err);
  }
}

export async function updateCourt(req, res, next) {
  try {
    const { id } = req.params;
    const { name, location } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    
    // Get image filename if new file was uploaded
    // If no file is uploaded, keep the existing image (don't update it)
    let image;
    if (req.file) {
      // New file uploaded - use the new file
      image = `/uploads/courts/${req.file.filename}`;
      
      // Optionally: Delete old image file if it exists
      // (You can implement this later if needed)
    }
    // If req.file is undefined, image stays undefined, which means keep existing
    
    const court = await courtModel.updateCourt(id, { 
      name, 
      location: location || "", 
      image: image !== undefined ? image : undefined 
    });
    emitCourtUpdated(court);
    res.json({ court });
  } catch (err) {
    next(err);
  }
}

export async function deleteCourt(req, res, next) {
  try {
    const { id } = req.params;
    const court = await courtModel.findCourtById(id);
    if (!court) return res.status(404).json({ error: "Court not found" });
    
    await courtModel.deleteCourt(id);
    emitCourtDeleted(id);
    res.json({ message: "Court deleted successfully" });
  } catch (err) {
    if (err.message && err.message.includes("existing reservations")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}