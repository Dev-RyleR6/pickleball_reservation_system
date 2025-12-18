import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock, Plus, Ticket, MapPin, Grid } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import courtService from "../api/courtService";
import reservationService from "../api/reservationService";
import type { Reservation } from "../types/reservation";
import type { Court } from "../types/court";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [allCourts, setAllCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);


  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all courts
      const courts = await courtService.getAllCourts();
      setAllCourts(courts);

      // Fetch current user's reservations
      const reservations = await reservationService.getMyReservations();
      setAllReservations(reservations);

      // Set current user's next upcoming reservation (first future reservation)
      const upcoming = reservations.find(r => {
        const resDate = r.date ? new Date(r.date) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return resDate && resDate >= today && r.status !== 'cancelled' && r.status !== 'expired';
      });
      setCurrentReservation(upcoming || null);

    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const cancelReservation = async (reservationId: number) => {
    try {
      await reservationService.cancelReservation(String(reservationId));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Reservations</p>
                      <p className="text-3xl font-bold text-gray-800">{allReservations.length}</p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Ticket size={24} className="text-gray-700" />
                    </div>
                  </div>
        </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Available Courts</p>
                      <p className="text-3xl font-bold text-gray-800">
                        {allCourts.filter(c => c.availableSlots && c.availableSlots.length > 0).length}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Grid size={24} className="text-gray-700" />
                    </div>
        </div>
          </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Courts</p>
                      <p className="text-3xl font-bold text-gray-800">{allCourts.length}</p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <CalendarDays size={24} className="text-gray-700" />
                    </div>
                </div>
            </div>
          </div>

              {/* Next reservation */}
              {currentReservation ? (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Your Next Reservation
                  </h2>
                  <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <Ticket size={24} className="text-gray-700" />
                      </div>
                      <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">
                            {currentReservation.courtName || `Court ${currentReservation.courtId}`}
                        </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <CalendarDays size={16} />
                              <span>{new Date(currentReservation.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={16} />
                              <span>{currentReservation.time}</span>
                            </div>
                          </div>
                      </div>
                    </div>
                    <button
                        className="w-full md:w-auto bg-white text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium"
                        onClick={() => cancelReservation(currentReservation.id as number)}
                    >
                      Cancel Reservation
                    </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Your Next Reservation
                  </h2>
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                    <Ticket size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 mb-2">You have no upcoming reservations.</p>
                    <button
                      onClick={() => navigate("/book")}
                      className="mt-4 inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
                    >
                      <Plus size={16} /> Book Your First Court
                    </button>
                  </div>
                </div>
              )}

              {/* All courts */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Available Courts</h2>
                  <p className="text-sm text-gray-500 mt-1">Browse and book available courts</p>
                </div>
                <button
                  className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors font-medium"
                  onClick={() => navigate("/book")}
                >
                  <Plus size={18} /> Book a Court
                </button>
              </div>

              {allCourts.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <CalendarDays size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No courts available at the moment.</p>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allCourts.map((court) => (
                  <div
                      key={court.id}
                      className={`bg-white rounded-lg border p-6 flex flex-col transition-shadow hover:shadow-md ${
                        court.availableSlots && court.availableSlots.length > 0
                        ? "border-gray-300"
                        : "border-gray-200 opacity-75"
                    }`}
                  >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-gray-100 rounded-lg">
                          <CalendarDays size={24} className="text-gray-700" />
                        </div>
                        {court.availableSlots && court.availableSlots.length > 0 ? (
                          <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">
                            Available
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">
                            {court.status === 'maintenance' ? 'Maintenance' : 'Unavailable'}
                          </span>
                        )}
                      </div>
                      
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">{court.name}</h3>
                      
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
                        className={`mt-auto w-full py-2.5 rounded-lg transition-colors font-medium ${
                          court.availableSlots && court.availableSlots.length > 0
                          ? "bg-gray-800 text-white hover:bg-gray-900"
                          : "bg-gray-100 text-gray-500 cursor-not-allowed"
                      }`}
                        disabled={!court.availableSlots || court.availableSlots.length === 0}
                        onClick={() => navigate("/book")}
                    >
                        {court.availableSlots && court.availableSlots.length > 0 ? "Reserve Now" : "Unavailable"}
                    </button>
                  </div>
                ))}
              </div>
              )}
            </>
          )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
