import { useEffect, useState } from "react";
import { CalendarDays, Clock, Ticket, CheckCircle, XCircle, AlertCircle, Loader2, Search, Filter } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import type { Reservation } from "../../types/reservation";
import reservationService from "../../api/reservationService";

const ManageReservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "cancelled" | "expired">("all");

  const loadAllReservations = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await reservationService.getAllReservations();
      setReservations(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load all reservations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAllReservations();
  }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    try {
      setProcessingId(id);
      setError("");
      setSuccess("");
      
      const result = await reservationService.updateReservationAction(id, action);
      setSuccess(`Reservation successfully ${action === 'approve' ? 'approved' : 'rejected'}.`);
      
      // Reload to get updated statuses
      await loadAllReservations();
      
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      console.error("Reservation action error:", err);
      let errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || `Failed to ${action} reservation.`;
      
      // Handle specific error codes
      if (err.response?.status === 409) {
        errorMsg = "Cannot approve: This reservation conflicts with an existing approved booking. Please check for overlapping time slots.";
      } else if (err.response?.status === 404) {
        errorMsg = "Reservation not found. It may have been deleted.";
      } else if (err.response?.status === 400) {
        errorMsg = err.response?.data?.error || "Invalid request. Please try again.";
      }
      
      setError(errorMsg);
      setTimeout(() => setError(""), 7000);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredReservations = reservations.filter(res => {
    const matchesSearch = 
      (res.courtName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (res.user_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (res.status?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    // Check if reservation is expired (by date/time or status)
    const reservationDate = res.date ? new Date(res.date) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isExpired = res.status === 'expired' || (reservationDate && (
      reservationDate < today || 
      (reservationDate.getTime() === today.getTime() && res.end_time && 
       new Date(`${res.date}T${res.end_time}`) < new Date())
    ));
    
    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "expired") {
        matchesStatus = isExpired;
      } else {
        matchesStatus = res.status === statusFilter && !isExpired;
      }
    }
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Reservations</h1>
            <p className="text-gray-600">Review, approve, or reject court bookings facility-wide.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search reservations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none bg-white appearance-none cursor-pointer font-medium"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={32} className="animate-spin text-gray-400" />
              <p className="text-gray-500">Loading all reservations...</p>
            </div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Ticket size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No reservations found.</p>
            {(searchTerm || statusFilter !== "all") && (
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria.</p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-800">{filteredReservations.length}</span> of{" "}
                <span className="font-semibold text-gray-800">{reservations.length}</span> reservations
                {statusFilter !== "all" && ` (${statusFilter})`}
              </p>
            </div>
          <div className="grid grid-cols-1 gap-4">
            {filteredReservations.map((resv) => (
              <div
                key={resv.id}
                className={`bg-white rounded-lg border p-6 shadow-sm transition-all hover:shadow-md ${
                  resv.status === 'pending' ? 'border-yellow-200 bg-yellow-50/10' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      resv.status === 'approved' ? 'bg-green-100' :
                      resv.status === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                      <Ticket size={24} className={
                        resv.status === 'approved' ? 'text-green-700' :
                        resv.status === 'pending' ? 'text-yellow-700' : 'text-gray-700'
                      } />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-800">
                          {resv.courtName || `Court ${resv.courtId}`}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          resv.status === 'approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                          resv.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                          resv.status === 'expired' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                          'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {resv.status === 'expired' ? 'EXPIRED' : resv.status?.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                        <span className="text-gray-500 font-normal">Requested by:</span> {resv.user_name || resv.user_id || 'Unknown User'}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays size={16} className="text-gray-400" />
                          <span>{resv.date ? new Date(resv.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={16} className="text-gray-400" />
                          <span>{resv.time || `${resv.start_time || ''} - ${resv.end_time || ''}`}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {(() => {
                      // Check if reservation is expired
                      const reservationDate = resv.date ? new Date(resv.date) : null;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isExpired = reservationDate && (
                        reservationDate < today || 
                        (reservationDate.getTime() === today.getTime() && resv.end_time && 
                         new Date(`${resv.date}T${resv.end_time}`) < new Date())
                      );
                      
                      if (isExpired || resv.status === 'expired') {
                        return (
                          <div className="text-sm text-orange-600 font-medium flex items-center gap-2">
                            <AlertCircle size={16} />
                            Expired
                          </div>
                        );
                      }
                      
                      if (resv.status === 'pending') {
                        return (
                          <>
                            <button
                              onClick={() => handleAction(resv.id, "reject")}
                              disabled={processingId !== null}
                              className="flex-1 lg:flex-none px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold flex items-center justify-center gap-2"
                            >
                              {processingId === resv.id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                              Reject
                            </button>
                            <button
                              onClick={() => handleAction(resv.id, "approve")}
                              disabled={processingId !== null}
                              className="flex-1 lg:flex-none px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-semibold flex items-center justify-center gap-2 shadow-sm"
                            >
                              {processingId === resv.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                              Approve
                            </button>
                          </>
                        );
                      }
                      
                      return (
                        <div className="text-sm text-gray-400 font-medium italic">
                          {resv.status === 'approved' ? 'Approved' : resv.status === 'cancelled' ? 'Cancelled/Rejected' : resv.status}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default ManageReservations;

