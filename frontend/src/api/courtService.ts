import api from "../api/api"; // Axios instance
import type { Court } from "../types/court";


const courtService = {
  getAllCourts: async (): Promise<Court[]> => {
    try {
      const res = await api.get<{ courts: Court[] }>("/api/courts");
      const courts = res.data.courts || [];
      
      // Augment courts with default available slots if missing and court is available
      // In a real app, these would come from the backend based on actual reservations
      return courts.map(court => {
        const isActuallyAvailable = court.status !== "unavailable" && court.status !== "maintenance";
        return {
          ...court,
          availableSlots: court.availableSlots || (isActuallyAvailable ? [
            "08:00", "09:00", "10:00", "11:00", "12:00", 
            "13:00", "14:00", "15:00", "16:00", "17:00", 
            "18:00", "19:00", "20:00", "21:00"
          ] : [])
        };
      });
    } catch (err) {
      console.error("Failed to fetch courts:", err);
      throw err;
    }
  },

  getCourtById: async (courtId: string): Promise<Court> => {
    try {
      const res = await api.get<{ court: Court }>(`/api/courts/${courtId}`);
      const court = res.data.court;
      const isActuallyAvailable = court.status !== "unavailable" && court.status !== "maintenance";
      
      return {
        ...court,
        availableSlots: court.availableSlots || (isActuallyAvailable ? [
          "08:00", "09:00", "10:00", "11:00", "12:00", 
          "13:00", "14:00", "15:00", "16:00", "17:00", 
          "18:00", "19:00", "20:00", "21:00"
        ] : [])
      };
    } catch (err) {
      console.error(`Failed to fetch court ${courtId}:`, err);
      throw err;
    }
  },

  addCourt: async (courtData: { name: string; location: string; image?: string }): Promise<Court> => {
    try {
      const res = await api.post<{ court: Court }>("/api/courts", courtData);
      return res.data.court;
    } catch (err) {
      console.error("Failed to add court:", err);
      throw err;
    }
  },

  addCourtWithImage: async (formData: FormData): Promise<Court> => {
    try {
      // Don't set Content-Type header - let axios set it automatically with boundary
      const res = await api.post<{ court: Court }>("/api/courts", formData);
      return res.data.court;
    } catch (err) {
      console.error("Failed to add court:", err);
      throw err;
    }
  },

  updateCourtStatus: async (courtId: number, status: string): Promise<Court> => {
    try {
      const res = await api.put<{ court: Court }>(`/api/courts/${courtId}/status`, { status });
      return res.data.court;
    } catch (err) {
      console.error(`Failed to update status for court ${courtId}:`, err);
      throw err;
    }
  },

  updateCourt: async (courtId: number, courtData: { name: string; location: string; image?: string }): Promise<Court> => {
    try {
      const res = await api.put<{ court: Court }>(`/api/courts/${courtId}`, courtData);
      return res.data.court;
    } catch (err) {
      console.error(`Failed to update court ${courtId}:`, err);
      throw err;
    }
  },

  updateCourtWithImage: async (courtId: number, formData: FormData): Promise<Court> => {
    try {
      // Don't set Content-Type header - let axios set it automatically with boundary
      const res = await api.put<{ court: Court }>(`/api/courts/${courtId}`, formData);
      return res.data.court;
    } catch (err) {
      console.error(`Failed to update court ${courtId}:`, err);
      throw err;
    }
  },

  deleteCourt: async (courtId: number): Promise<void> => {
    try {
      await api.delete(`/api/courts/${courtId}`);
    } catch (err) {
      console.error(`Failed to delete court ${courtId}:`, err);
      throw err;
    }
  },
};

export default courtService;
