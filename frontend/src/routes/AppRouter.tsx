import { type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Courts from "../pages/Courts";
import Reservations from "../pages/Reservations";
import AdminDashboard from "../pages/admin/AdminDashboard";
import ManageReservations from "../pages/admin/ManageReservations";
import ManageCourts from "../pages/admin/ManageCourts";
import ManageUsers from "../pages/admin/ManageUsers";
import BookCourt from "../pages/BookCourt";
import { useAuth } from "../hooks/useAuth";

// ProtectedRoute
const ProtectedRoute: React.FC<{ children: ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courts"
          element={
            <ProtectedRoute>
              <Courts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reservations"
          element={
            <ProtectedRoute>
              <Reservations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book"
          element={
            <ProtectedRoute>
              <BookCourt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reservations"
          element={
            <ProtectedRoute adminOnly>
              <ManageReservations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courts"
          element={
            <ProtectedRoute adminOnly>
              <ManageCourts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
