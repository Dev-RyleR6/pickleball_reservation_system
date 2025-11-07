import {  //the backend/src/controllers/reservationController.js
  hasConflict,
  createReservation,
  getReservationsForUser,
  getAllReservations,
  getReservationById,
  updateReservationStatus,
  cancelReservation,
} from "../models/reservationModel.js";

import { sendBookingEmail } from "../utils/emailService.js";

export async function createReservationHandler(req, res, next) {
  try {
    const user_id = req.user.id;
    const { court_id, date, start_time, end_time } = req.body;
    if (!court_id || !date || !start_time || !end_time) return res.status(400).json({ error: "Missing fields" });

    // Basic check: start < end
    if (!(start_time < end_time)) return res.status(400).json({ error: "Invalid time range" });

    // Check conflict
    const conflict = await hasConflict({ court_id, date, start_time, end_time });
    if (conflict) return res.status(409).json({ error: "Time slot conflicts with existing reservation" });

    const reservation = await createReservation({ user_id, court_id, date, start_time, end_time, status: "pending" });
    res.status(201).json({ reservation });
  } catch (err) { next(err); }
}

export async function getMyReservationsHandler(req, res, next) {
  try {
    const user_id = req.user.id;
    const rows = await getReservationsForUser(user_id);
    res.json({ reservations: rows });
  } catch (err) { next(err); }
}

export async function getAllReservationsHandler(req, res, next) {
  try {
    const rows = await getAllReservations();
    res.json({ reservations: rows });
  } catch (err) { next(err); }
}

export async function approveReservationHandler(req, res, next) {
  try {
    const id = req.params.id;
    const { action } = req.body; // 'approve' or 'reject'
    if (!["approve","reject"].includes(action)) return res.status(400).json({ error: "Invalid action" });

    const reservation = await getReservationById(id);
    if (!reservation) return res.status(404).json({ error: "Reservation not found" });

    if (action === "approve") {
      // Check conflict again before approving (in case other pending was approved earlier)
      const conflict = await hasConflict({
        court_id: reservation.court_id,
        date: reservation.date,
        start_time: reservation.start_time,
        end_time: reservation.end_time,
      });
      // If conflict exists but it's the same reservation (shouldn't be), allow; otherwise reject
      if (conflict) return res.status(409).json({ error: "Conflict detected; cannot approve" });

      const updated = await updateReservationStatus(id, "approved");
      // send email (fire and forget)
      sendBookingEmail(reservation.user_id, updated).catch(e => console.error("Email error:", e));
      return res.json({ reservation: updated });
    } else {
      const updated = await updateReservationStatus(id, "cancelled");
      return res.json({ reservation: updated });
    }
  } catch (err) { next(err); }
}

export async function cancelMyReservationHandler(req, res, next) {
  try {
    const id = req.params.id;
    const user_id = req.user.id;
    const updated = await cancelReservation(id, user_id);
    if (!updated) return res.status(404).json({ error: "Reservation not found or not yours" });
    res.json({ reservation: updated });
  } catch (err) { next(err); }
}
