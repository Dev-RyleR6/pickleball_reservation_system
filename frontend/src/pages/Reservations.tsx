import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock, Plus, Ticket, MapPin, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import type { Reservation } from "../types/reservation";
import type { Court } from "../types/court";
import reservationService from "../api/reservationService";
import courtService from "../api/courtService";
import { useNotifications } from "../context/NotificationContext";
import { useReservationSocket } from "../context/SocketContext";
import { useAuth } from "../hooks/useAuth";

const Reservations: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<number | null>(null);
  const [cancelledReservation, setCancelledReservation] = useState<Reservation | null>(null);

  const loadReservations = async () => {
      try {
      setLoading(true);
      setError("");
      const [reservationsData, courtsData] = await Promise.all([
        reservationService.getMyReservations(),
        courtService.getAllCourts()
      ]);
      setReservations(reservationsData);
      setCourts(courtsData);
      } catch (err) {
        console.error(err);
      setError("Failed to load reservations.");
    } finally {
      setLoading(false);
      }
    };

  useEffect(() => {
    void loadReservations();
  }, []);

  // Real-time socket listeners
  useReservationSocket(
    // onReservationCreated - only update if it's for current user
    (reservation) => {
      if (reservation.user_id === user?.id) {
        addNotification({
          type: "success",
          title: "New Reservation Created",
          message: `Your reservation for ${reservation.court_name || "court"} on ${new Date(reservation.date).toLocaleDateString()} has been created.`,
          link: "/reservations",
        });
        void loadReservations();
      }
    },
    // onReservationUpdated
    (reservation) => {
      if (reservation.user_id === user?.id) {
        void loadReservations();
      }
    },
    // onReservationApproved
    (reservation) => {
      if (reservation.user_id === user?.id) {
        addNotification({
          type: "success",
          title: "Reservation Approved",
          message: `Your reservation for ${reservation.court_name || "court"} on ${new Date(reservation.date).toLocaleDateString()} has been approved!`,
          link: "/reservations",
        });
        void loadReservations();
      }
    },
    // onReservationCancelled
    (reservation) => {
      if (reservation.user_id === user?.id) {
        void loadReservations();
      }
    }
  );

  const handleCancelClick = (reservation: Reservation) => {
    setShowCancelConfirm(reservation.id);
    setError("");
    setSuccess("");
  };

  const handleCancelConfirm = async (id: number) => {
    try {
      setCancellingId(String(id));
      setError("");
      setSuccess("");
      
      const reservation = reservations.find(r => r.id === id);
      await reservationService.cancelReservation(String(id));
      
      // Store cancelled reservation details for success message
      if (reservation) {
        setCancelledReservation(reservation);
        
        // Add notification
        addNotification({
          type: "info",
          title: "Reservation Cancelled",
          message: `Your reservation for ${reservation.courtName || "court"} on ${new Date(reservation.date).toLocaleDateString()} at ${reservation.start_time} has been cancelled.`,
          link: "/reservations",
        });
      }
      
      setSuccess(`Reservation for ${reservation?.courtName || 'court'} on ${reservation?.date ? new Date(reservation.date).toLocaleDateString() : ''} has been cancelled.`);
      
      // Reload reservations
      await loadReservations();
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess("");
        setCancelledReservation(null);
      }, 5000);
      
      // Close confirmation modal
      setShowCancelConfirm(null);
    } catch (err: any) {
      console.error(err);
      let errorMsg = "Failed to cancel reservation. Please try again.";
      
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      setError(errorMsg);
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setError("");
      }, 5000);
      
      // Close confirmation modal on error
      setShowCancelConfirm(null);
    } finally {
      setCancellingId(null);
    }
  };

  const handleCancelCancel = () => {
    setShowCancelConfirm(null);
    setError("");
  };

  return (
    <AppLayout>
    <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Reservations</h1>
            <p className="text-gray-600">View and manage your upcoming court reservations.</p>
          </div>
          <button
            onClick={() => navigate("/book")}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            <Plus size={18} /> New Reservation
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3 shadow-md animate-in slide-in-from-top-2">
            <div className="p-1 bg-red-100 rounded-full flex-shrink-0">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">Cancellation Failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-600 hover:text-red-800 transition-colors p-1 hover:bg-red-100 rounded"
              aria-label="Dismiss error"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-start gap-3 shadow-md animate-in slide-in-from-top-2">
            <div className="p-1 bg-green-100 rounded-full flex-shrink-0">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-green-800">Reservation Cancelled</p>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
            <button
              onClick={() => {
                setSuccess("");
                setCancelledReservation(null);
              }}
              className="text-green-600 hover:text-green-800 transition-colors p-1 hover:bg-green-100 rounded"
              aria-label="Dismiss success"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading reservations...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Ticket size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2 text-lg">You don't have any reservations yet.</p>
            <p className="text-gray-400 text-sm mb-6">Start by booking your first court!</p>
            <button
              onClick={() => navigate("/book")}
              className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors font-medium"
            >
              <Plus size={18} /> Book a Court
            </button>
          </div>
        ) : (
          <div className="space-y-4">
          {reservations.map((resv) => {
            const reservationCourt = courts.find(c => c.id === resv.court_id);
            
            // Check if reservation is expired
            const reservationDate = resv.date ? new Date(resv.date) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isExpired = resv.status === 'expired' || (reservationDate && (
              reservationDate < today || 
              (reservationDate.getTime() === today.getTime() && resv.end_time && 
               new Date(`${resv.date}T${resv.end_time}`) < new Date())
            ));
            
            // Determine if cancel button should be shown
            const canCancel = !isExpired && resv.status !== 'cancelled' && resv.status !== 'expired';
            
            return (
              <div
                key={resv.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {reservationCourt?.image && (
                  <div className="w-full h-48 overflow-hidden">
                    <img 
                      src={reservationCourt.image.startsWith('http') ? reservationCourt.image : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}${reservationCourt.image}`}
                      alt={resv.courtName || `Court ${resv.courtId}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {!reservationCourt?.image && (
                        <div className="p-3 bg-gray-100 rounded-lg">
                          <Ticket size={24} className="text-gray-700" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {resv.courtName || `Court ${resv.courtId}`}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <CalendarDays size={16} />
                            <span>{new Date(resv.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={16} />
                            <span>{resv.time}</span>
                          </div>
                          {resv.status && (
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              resv.status === 'approved' ? 'bg-green-100 text-green-700' :
                              resv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              resv.status === 'expired' ? 'bg-orange-100 text-orange-700' :
                              resv.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {isExpired ? 'Expired' : resv.status.charAt(0).toUpperCase() + resv.status.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {canCancel && (
                      <button
                        type="button"
                        disabled={cancellingId === String(resv.id)}
                        onClick={() => handleCancelClick(resv)}
                        className="w-full md:w-auto px-4 py-2 rounded-lg border-2 border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {cancellingId === String(resv.id) ? (
                          <span className="flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            Cancelling...
                          </span>
                        ) : (
                          "Cancel Reservation"
                        )}
                      </button>
                    )}
                    {!canCancel && (
                      <div className="w-full md:w-auto px-4 py-2 text-sm text-gray-500 font-medium">
                        {isExpired ? "Expired" : resv.status === 'cancelled' ? "Cancelled" : "No actions available"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} className="text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Cancel Reservation?</h2>
                <p className="text-gray-600">
                  Are you sure you want to cancel this reservation? This action cannot be undone.
                </p>
              </div>

              {(() => {
                const reservation = reservations.find(r => r.id === showCancelConfirm);
                return reservation ? (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Court:</span>
                      <span className="text-sm font-semibold text-gray-800">{reservation.courtName || `Court ${reservation.courtId}`}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Date:</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {new Date(reservation.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Time:</span>
                      <span className="text-sm font-semibold text-gray-800">{reservation.time}</span>
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="flex gap-3">
                <button
                  onClick={handleCancelCancel}
                  disabled={cancellingId !== null}
                  className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Keep Reservation
                </button>
                <button
                  onClick={() => handleCancelConfirm(showCancelConfirm)}
                  disabled={cancellingId !== null}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cancellingId === String(showCancelConfirm) ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Yes, Cancel"
                  )}
                </button>
              </div>
            </div>
          </div>
      )}
    </div>
    </AppLayout>
  );
};

export default Reservations;
