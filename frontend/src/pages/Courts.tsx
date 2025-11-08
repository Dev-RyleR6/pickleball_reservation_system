import { useEffect, useState } from "react";
import type { Court } from "../types/court";
import api from "../api/api";

const Courts: React.FC = () => {
  const [courts, setCourts] = useState<Court[]>([]);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const res = await api.get<Court[]>("/courts");
        setCourts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourts();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Available Courts</h1>
      <ul>
        {courts.map((court) => (
          <li key={court.id} className="mb-2 p-4 border rounded shadow">
            <h2 className="font-semibold">{court.name}</h2>
            <p>Location: {court.location}</p>
            <p>Available Slots: {court.availableSlots.join(", ")}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Courts;
