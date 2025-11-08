import * as React from "react";
import { Link } from "react-router-dom";

const AdminDashboard: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/courts"
          className="p-4 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
        >
          Manage Courts
        </Link>
        <Link
          to="/reservations"
          className="p-4 bg-green-500 text-white rounded shadow hover:bg-green-600"
        >
          Manage Reservations
        </Link>
        <Link
          to="/"
          className="p-4 bg-gray-500 text-white rounded shadow hover:bg-gray-600"
        >
          Go to User Dashboard
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
