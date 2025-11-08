import { useEffect, useState } from "react";
import type { Reservation } from "../types/reservation";
import api from "../api/api";

const Reservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await api.get<Reservation[]>("/reservations");
        setReservations(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchReservations();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">My Reservations</h1>
      {reservations.length === 0 ? (
        <p>No reservations found.</p>
      ) : (
        <ul>
          {reservations.map((resv) => (
            <li key={resv.id} className="mb-2 p-4 border rounded shadow">
              <p>
                Court ID: {resv.courtId} | Date: {resv.date} | Time Slot: {resv.timeSlot}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Reservations;
