import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Grid3X3, CalendarDays, ArrowLeft, Shield, Users } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
    <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Shield size={24} className="text-gray-700" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Manage courts and reservations across the facility.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => navigate("/admin/courts")}
            className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <Grid3X3 size={20} className="text-gray-700" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Manage Courts</h2>
            </div>
            <p className="text-sm text-gray-600">Add, edit, or toggle availability of facility courts.</p>
          </button>

          <button
            onClick={() => navigate("/admin/reservations")}
            className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <CalendarDays size={20} className="text-gray-700" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Manage Reservations</h2>
            </div>
            <p className="text-sm text-gray-600">Review and approve or reject all member bookings.</p>
          </button>

          <button
            onClick={() => navigate("/admin/users")}
            className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <Users size={20} className="text-gray-700" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Manage Users</h2>
            </div>
            <p className="text-sm text-gray-600">View and manage all registered facility members.</p>
          </button>

          <button
            onClick={() => navigate("/")}
            className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <ArrowLeft size={20} className="text-gray-700" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">User Dashboard</h2>
            </div>
            <p className="text-sm text-gray-600">Switch back to the standard player dashboard.</p>
          </button>
      </div>
    </div>
    </AppLayout>
  );
};

export default AdminDashboard;
