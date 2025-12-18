import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, Clock, Plus } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import type { Court } from "../types/court";
import api from "../api/api";

const Courts: React.FC = () => {
  const navigate = useNavigate();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true);
        const res = await api.get<{ courts: Court[] }>("/api/courts");
        setCourts(res.data.courts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    void fetchCourts();
  }, []);

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Available Courts</h1>
            <p className="text-gray-600">Browse all available courts and their schedules.</p>
          </div>
          <button
            onClick={() => navigate("/book")}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            <Plus size={18} /> Book a Court
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading courts...</p>
          </div>
        ) : courts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <CalendarDays size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No courts available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courts.map((court) => (
              <div
                key={court.id}
                className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <CalendarDays size={24} className="text-gray-700" />
                  </div>
                  {court.availableSlots && court.availableSlots.length > 0 && (
                    <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">
                      Available
                    </span>
                  )}
                </div>
                
                <h2 className="text-lg font-semibold mb-2 text-gray-800">{court.name}</h2>
                
                {court.location && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                    <MapPin size={14} />
                    <span>{court.location}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
                  <Clock size={16} />
                  <span>
                    {court.availableSlots && court.availableSlots.length > 0
                      ? `${court.availableSlots.length} slot${court.availableSlots.length > 1 ? 's' : ''} available`
                      : "No availability"}
                  </span>
                </div>
                
                {court.availableSlots && court.availableSlots.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Next available:</p>
                    <p className="text-sm font-medium text-gray-700">{court.availableSlots[0]}</p>
                  </div>
                )}
                
                <button
                  onClick={() => navigate("/book")}
                  className={`w-full py-2.5 rounded-lg transition-colors font-medium ${
                    court.availableSlots && court.availableSlots.length > 0
                      ? "bg-gray-800 text-white hover:bg-gray-900"
                      : "bg-gray-100 text-gray-500 cursor-not-allowed"
                  }`}
                  disabled={!court.availableSlots || court.availableSlots.length === 0}
                >
                  {court.availableSlots && court.availableSlots.length > 0 ? "Book Now" : "Unavailable"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Courts;
