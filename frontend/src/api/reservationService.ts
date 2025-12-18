import api from "../api/api"; // Axios instance
import type { Reservation } from "../types/reservation";

const reservationService = {
  // Admin: get all reservations
  getAllReservations: async (): Promise<Reservation[]> => {
    try {
      const res = await api.get<Reservation[]>("/api/reservations");
      return res.data;
    } catch (err) {
      console.error("Failed to fetch reservations:", err);
      throw err;
    }
  },

  // Player: get only the current user's reservations
  getMyReservations: async (): Promise<Reservation[]> => {
    try {
      const res = await api.get<{ reservations: Reservation[] }>("/api/reservations/me");
      const reservations = res.data.reservations || [];
      // Map backend fields to frontend convenience fields
      return reservations.map((r) => ({
        ...r,
        courtName: r.court_name,
        courtId: String(r.court_id),
        time: `${r.start_time} - ${r.end_time}`,
      }));
    } catch (err) {
      console.error("Failed to fetch my reservations:", err);
      throw err;
    }
  },

  getReservationById: async (reservationId: string): Promise<Reservation> => {
    try {
      const res = await api.get<Reservation>(`/api/reservations/${reservationId}`);
      return res.data;
    } catch (err) {
      console.error(`Failed to fetch reservation ${reservationId}:`, err);
      throw err;
    }
  },

  createReservation: async (
    courtId: string,
    date: string,
    time: string,
    durationHours: number = 1,
  ): Promise<Reservation> => {
    try {
      // Convert time input (HH:MM) to start_time and end_time based on duration
      // Backend expects HH:MM:SS format
      const startTime = time.length === 5 ? `${time}:00` : time;
      const [hours, minutes] = time.split(":");
      const endHour = (parseInt(hours) + durationHours) % 24;
      const endTime = `${endHour.toString().padStart(2, "0")}:${minutes}:00`;
      
      const res = await api.post<{ reservation: Reservation }>("/api/reservations", {
        court_id: parseInt(courtId),
        date,
        start_time: startTime,
        end_time: endTime,
      });
      return res.data.reservation;
    } catch (err) {
      console.error("Failed to create reservation:", err);
      throw err;
    }
  },

  cancelReservation: async (reservationId: string): Promise<void> => {
    try {
      await api.delete(`/api/reservations/${reservationId}/cancel`);
    } catch (err) {
      console.error(`Failed to cancel reservation ${reservationId}:`, err);
      throw err;
    }
  },
};

export default reservationService;
