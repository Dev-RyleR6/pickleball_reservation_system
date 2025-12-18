import { useState, useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, User, Settings, LogOut, ChevronDown, Bell, Ticket, Grid, Shield
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if current route is active
  const isActive = (path: string) => location.pathname === path;

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 font-inter">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Courtly</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => navigate("/")}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive("/") 
                ? "bg-gray-100 text-gray-800 font-semibold" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            onClick={() => navigate("/courts")}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive("/courts") 
                ? "bg-gray-100 text-gray-800 font-semibold" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Grid size={20} /> Court Availability
          </button>
          <button 
            onClick={() => navigate("/reservations")}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive("/reservations") 
                ? "bg-gray-100 text-gray-800 font-semibold" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Ticket size={20} /> My Reservations
          </button>
          <button 
            onClick={() => navigate("/book")}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive("/book") 
                ? "bg-gray-100 text-gray-800 font-semibold" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Grid size={20} /> Book a Court
          </button>
          {user.role === "admin" && (
            <button 
              onClick={() => navigate("/admin")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive("/admin") 
                  ? "bg-gray-100 text-gray-800 font-semibold" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Shield size={20} /> Admin
            </button>
          )}
          <button
            onClick={() => navigate("/profile")}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive("/profile") 
                ? "bg-gray-100 text-gray-800 font-semibold" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <User size={20} /> Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
            <Settings size={20} /> Settings
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
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
            <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
              <Bell size={20} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 focus:outline-none"
              >
                {user.avatar && user.avatar.startsWith("http") ? (
                  <img
                    src={user.avatar}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div className={`w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center border-2 border-gray-300 font-semibold text-sm ${user.avatar && user.avatar.startsWith("http") ? "hidden" : ""}`}>
                  {getUserInitials(user.name)}
                </div>
                <span className="hidden md:block text-gray-700 font-medium">{user.name}</span>
                <ChevronDown size={16} className="text-gray-500" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setShowProfileMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowProfileMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

