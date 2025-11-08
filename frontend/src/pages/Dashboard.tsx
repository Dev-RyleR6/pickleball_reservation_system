import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, User, Settings, LogOut, ChevronDown, CalendarDays, Clock, Plus, Bell, Ticket, Grid
} from "lucide-react";
import api from "../api/api"; // Axios instance with JWT

interface Reservation {
  court: string;
  time: string;
  date: string;
  reservedByCurrentUser: boolean;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  const [allCourts, setAllCourts] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch reservations from backend
  const fetchReservations = async () => {
    try {
      setLoading(true);
      // Fetch all reservations
      const res = await api.get<Reservation[]>("/reservations");
      // Find the next reservation for the current user
      const myNext = res.data.find(r => r.reservedByCurrentUser) || null;
      setCurrentReservation(myNext);
      setAllCourts(res.data);
    } catch (err) {
      console.error("Failed to fetch reservations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const cancelReservation = async (reservation: Reservation) => {
    try {
      await api.delete(`/reservations/${reservation.court}`); // adjust endpoint
      fetchReservations();
    } catch (err) {
      console.error(err);
    }
  };

  const reserveCourt = async (court: string) => {
    try {
      await api.post("/reservations", { court });
      fetchReservations();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <div className="p-6">Loading user...</div>;

  return (
    <div className="flex h-screen bg-gray-50 font-inter">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-indigo-600">Courtly</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button className="flex items-center gap-3 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 font-semibold">
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
            <Grid size={20} /> Court Availability
          </button>
          <button className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
            <Ticket size={20} /> My Reservations
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <User size={20} /> Profile
          </button>
          <button className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
            <Settings size={20} /> Settings
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-500">Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700">
              <Bell size={20} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <img
                  src={user.avatar}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
                />
                <span className="hidden md:block text-gray-700 font-medium">{user.name}</span>
                <ChevronDown size={16} className="text-gray-500" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                  <button
                    onClick={() => navigate("/profile")}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {loading ? (
            <p>Loading reservations...</p>
          ) : (
            <>
              {/* Next reservation */}
              {currentReservation ? (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Your Next Reservation
                  </h2>
                  <div className="bg-white rounded-lg border border-indigo-300 shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between shadow-indigo-50">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                      <div className="p-3 bg-indigo-100 rounded-lg">
                        <Ticket size={24} className="text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {currentReservation.court}
                        </h3>
                        <p className="text-gray-600">{currentReservation.date}</p>
                        <p className="text-gray-600 font-medium">{currentReservation.time}</p>
                      </div>
                    </div>
                    <button
                      className="mt-auto w-full md:w-auto bg-white text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                      onClick={() => cancelReservation(currentReservation)}
                    >
                      Cancel Reservation
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Your Next Reservation
                  </h2>
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
                    <p className="text-gray-500">You have no upcoming reservations.</p>
                  </div>
                </div>
              )}

              {/* All courts */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">All Courts</h2>
                <button
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  onClick={() => navigate("/book")}
                >
                  <Plus size={18} /> Book a Court
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allCourts.map((court, idx) => (
                  <div
                    key={idx}
                    className={`bg-white rounded-lg border p-6 flex flex-col ${
                      court.reservedByCurrentUser
                        ? "border-indigo-300 opacity-75"
                        : "border-gray-200"
                    }`}
                  >
                    <CalendarDays size={24} className="text-indigo-500 mb-3" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">{court.court}</h3>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                      <Clock size={16} />
                      <span>
                        {court.reservedByCurrentUser
                          ? `Reserved: ${court.time}`
                          : `Next slot: ${court.time}`}
                      </span>
                    </div>
                    <button
                      className={`mt-auto w-full py-2 rounded-lg transition-colors ${
                        court.reservedByCurrentUser
                          ? "bg-indigo-100 text-indigo-700 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                      disabled={court.reservedByCurrentUser}
                      onClick={() => reserveCourt(court.court)}
                    >
                      {court.reservedByCurrentUser ? "Reserved by You" : "Reserve Now"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
