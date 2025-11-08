import api from "../api/api"; // Axios instance
import type { Court } from "../types/court";


const courtService = {
  getAllCourts: async (): Promise<Court[]> => {
    try {
      const res = await api.get<Court[]>("/courts");
      return res.data;
    } catch (err) {
      console.error("Failed to fetch courts:", err);
      throw err;
    }
  },

  getCourtById: async (courtId: string): Promise<Court> => {
    try {
      const res = await api.get<Court>(`/courts/${courtId}`);
      return res.data;
    } catch (err) {
      console.error(`Failed to fetch court ${courtId}:`, err);
      throw err;
    }
  },
};

export default courtService;
