import api from "../api/api"; // Axios instance
import type { Reservation } from "../types/reservation";



const reservationService = {
  getAllReservations: async (): Promise<Reservation[]> => {
    try {
      const res = await api.get<Reservation[]>("/api/reservations");
      return res.data;
    } catch (err) {
      console.error("Failed to fetch reservations:", err);
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

  createReservation: async (courtId: string, date: string, time: string): Promise<Reservation> => {
    try {
      const res = await api.post<Reservation>("/api/reservations", { courtId, date, time });
      return res.data;
    } catch (err) {
      console.error("Failed to create reservation:", err);
      throw err;
    }
  },

  cancelReservation: async (reservationId: string): Promise<void> => {
    try {
      await api.delete(`/api/reservations/${reservationId}`);
    } catch (err) {
      console.error(`Failed to cancel reservation ${reservationId}:`, err);
      throw err;
    }
  },
};

export default reservationService;
