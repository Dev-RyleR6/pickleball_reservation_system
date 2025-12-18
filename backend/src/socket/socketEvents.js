import { getIO } from "./socketServer.js";

/**
 * Emit reservation events
 */
export function emitReservationCreated(reservation) {
  const io = getIO();
  // Notify the user who created the reservation
  io.to(`user:${reservation.user_id}`).emit("reservation:created", { reservation });
  // Notify admins
  io.to("admin").emit("reservation:created", { reservation });
}

export function emitReservationUpdated(reservation) {
  const io = getIO();
  // Notify the user who owns the reservation
  io.to(`user:${reservation.user_id}`).emit("reservation:updated", { reservation });
  // Notify admins
  io.to("admin").emit("reservation:updated", { reservation });
}

export function emitReservationApproved(reservation) {
  const io = getIO();
  // Notify the user who owns the reservation
  io.to(`user:${reservation.user_id}`).emit("reservation:approved", { reservation });
  // Notify admins
  io.to("admin").emit("reservation:approved", { reservation });
}

export function emitReservationCancelled(reservation) {
  const io = getIO();
  // Notify the user who owns the reservation
  io.to(`user:${reservation.user_id}`).emit("reservation:cancelled", { reservation });
  // Notify admins
  io.to("admin").emit("reservation:cancelled", { reservation });
}

/**
 * Emit court events
 */
export function emitCourtCreated(court) {
  const io = getIO();
  // Notify all users (courts are public)
  io.emit("court:created", { court });
}

export function emitCourtUpdated(court) {
  const io = getIO();
  // Notify all users
  io.emit("court:updated", { court });
}

export function emitCourtDeleted(courtId) {
  const io = getIO();
  // Notify all users
  io.emit("court:deleted", { courtId });
}

export function emitCourtStatusChanged(court) {
  const io = getIO();
  // Notify all users when court status changes (available/maintenance)
  io.emit("court:status_changed", { court });
}

/**
 * Emit user events (for admin user management)
 */
export function emitUserCreated(user) {
  const io = getIO();
  // Notify all admins about new user registrations
  io.to("admin").emit("user:created", { user });
}

export function emitUserUpdated(user) {
  const io = getIO();
  // Notify all admins when user details/role change
  io.to("admin").emit("user:updated", { user });
}

export function emitUserDeleted(userId) {
  const io = getIO();
  // Notify all admins when a user is deleted
  io.to("admin").emit("user:deleted", { userId });
}

