import {  //the backend/src/controllers/reservationController.js
  hasConflict,
  createReservation,
  getReservationsForUser,
  getAllReservations,
  getReservationById,
  updateReservationStatus,
  cancelReservation,
  cancelOldPendingReservations,
  markExpiredReservations,
} from "../models/reservationModel.js";

import { sendBookingEmail } from "../utils/emailService.js";
import {
  emitReservationCreated,
  emitReservationUpdated,
  emitReservationApproved,
  emitReservationCancelled,
} from "../socket/socketEvents.js";

export async function createReservationHandler(req, res, next) {
  try {
    const user_id = req.user.id;
    const { court_id, date, start_time, end_time } = req.body;
    if (!court_id || !date || !start_time || !end_time) return res.status(400).json({ error: "Missing fields" });

    // Basic check: start < end
    if (!(start_time < end_time)) return res.status(400).json({ error: "Invalid time range" });

    // Check conflict (no need to exclude any ID when creating new reservation)
    const conflict = await hasConflict({ court_id, date, start_time, end_time });
    if (conflict) return res.status(409).json({ error: "Time slot conflicts with existing reservation" });

    const reservation = await createReservation({ user_id, court_id, date, start_time, end_time, status: "pending" });
    
    // Fetch full reservation data with court info for socket emission
    const fullReservation = await getReservationById(reservation.id);
    if (fullReservation) {
      emitReservationCreated(fullReservation);
    }
    
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
    // Auto-cancel old pending reservations and mark expired ones
    await cancelOldPendingReservations();
    await markExpiredReservations();
    
    const rows = await getAllReservations();
    res.json({ reservations: rows });
  } catch (err) { next(err); }
}

export async function approveReservationHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid reservation ID" });
    
    const { action } = req.body; // 'approve' or 'reject'
    if (!["approve","reject"].includes(action)) return res.status(400).json({ error: "Invalid action" });

    const reservation = await getReservationById(id);
    if (!reservation) return res.status(404).json({ error: "Reservation not found" });

    if (action === "approve") {
      // Check if reservation is already expired
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
      
      if (reservation.date < today || (reservation.date === today && reservation.end_time < currentTime)) {
        return res.status(400).json({ error: "Cannot approve an expired reservation. The reservation date/time has already passed." });
      }
      
      // Auto-cancel old pending reservations and mark expired ones first
      await cancelOldPendingReservations();
      await markExpiredReservations();
      
      // Refresh reservation data after cleanup (in case it was marked as expired)
      const refreshedReservation = await getReservationById(id);
      if (!refreshedReservation || refreshedReservation.status === 'expired') {
        return res.status(400).json({ error: "Cannot approve an expired reservation. The reservation date/time has already passed." });
      }
      
      // Check conflict again before approving (in case other pending was approved earlier)
      // Exclude the current reservation from conflict check
      console.log("Checking conflict for reservation:", {
        id,
        court_id: refreshedReservation.court_id,
        date: refreshedReservation.date,
        start_time: refreshedReservation.start_time,
        end_time: refreshedReservation.end_time,
        status: refreshedReservation.status
      });
      
      const conflict = await hasConflict({
        court_id: refreshedReservation.court_id,
        date: refreshedReservation.date,
        start_time: refreshedReservation.start_time,
        end_time: refreshedReservation.end_time,
        excludeId: id,
      });
      
      if (conflict) {
        // Get conflicting reservations for better error message
        const { pool } = await import("../config/db.js");
        const today = new Date().toISOString().split('T')[0];
        const [conflicts] = await pool.query(
          `SELECT id, status, start_time, end_time, user_id, date
           FROM reservations 
           WHERE court_id = ? AND date = ? 
           AND id != ?
           AND date >= ?
           AND status IN ('approved', 'pending')
           AND status != 'expired'
           AND status != 'cancelled'
           AND NOT (end_time <= ? OR start_time >= ?)`,
          [refreshedReservation.court_id, refreshedReservation.date, id, today, refreshedReservation.start_time, refreshedReservation.end_time]
        );
        console.log("Conflict detected for reservation", id, "Conflicts:", JSON.stringify(conflicts, null, 2));
        return res.status(409).json({ 
          error: "Conflict detected; cannot approve. Another reservation already exists for this time slot.",
          conflicts: conflicts
        });
      }
      
      console.log("No conflict found, proceeding with approval for reservation", id);

      const updated = await updateReservationStatus(id, "approved");
      
      // Fetch full reservation data for socket emission
      const fullReservation = await getReservationById(id);
      if (fullReservation) {
        emitReservationApproved(fullReservation);
      }
      
      // send email (fire and forget)
      sendBookingEmail(reservation.user_id, updated).catch(e => console.error("Email error:", e));
      return res.json({ reservation: updated });
    } else {
      const updated = await updateReservationStatus(id, "cancelled");
      
      // Fetch full reservation data for socket emission
      const fullReservation = await getReservationById(id);
      if (fullReservation) {
        emitReservationCancelled(fullReservation);
      }
      
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
    
    // Fetch full reservation data for socket emission
    const fullReservation = await getReservationById(id);
    if (fullReservation) {
      emitReservationCancelled(fullReservation);
    }
    
    res.json({ reservation: updated });
  } catch (err) { next(err); }
}
