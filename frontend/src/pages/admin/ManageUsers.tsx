import { useEffect, useState } from "react";
import { Users, Shield, User, Mail, Calendar, Loader2, AlertCircle, Search, Filter, CheckCircle, XCircle, Trash2 } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import type { User as UserType } from "../../types/user";
import { getAllUsers, updateUserRole, deleteUser } from "../../api/authService";
import { useAuth } from "../../hooks/useAuth";
import { useUserSocket } from "../../context/SocketContext";

const ManageUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "player">("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load user records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  // Real-time socket listeners (admin only)
  useUserSocket(
    // onUserCreated
    (user) => {
      // Only admins should be on this page, but double-check
      if (currentUser?.role === "admin") {
        void loadUsers();
      }
    },
    // onUserUpdated
    (user) => {
      if (currentUser?.role === "admin") {
        void loadUsers();
      }
    },
    // onUserDeleted
    (userId) => {
      if (currentUser?.role === "admin") {
        void loadUsers();
      }
    }
  );

  const handleRoleChange = async (userId: number, newRole: "admin" | "player") => {
    try {
      setProcessingId(userId);
      setError("");
      setSuccess("");
      
      await updateUserRole(userId, newRole);
      setSuccess(`User role updated to ${newRole}.`);
      
      // Reload users
      await loadUsers();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Role update error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to update user role.";
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      setProcessingId(userId);
      setError("");
      setSuccess("");
      
      await deleteUser(userId);
      setSuccess("User deleted successfully.");
      
      // Reload users
      await loadUsers();
      
      setDeleteConfirmId(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Delete user error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to delete user.";
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
            <p className="text-gray-600">View and manage all registered facility members and staff.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none w-full sm:w-64"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none bg-white appearance-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="player">Players</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={32} className="animate-spin text-gray-400" />
              <p className="text-gray-500 font-medium">Fetching user directory...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <Users size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No users found matching your criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Contact Info</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Access Role</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Member Since</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                            user.role === 'admin' ? 'bg-gray-800' : 'bg-gray-400'
                          }`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-tight font-medium">ID: #{user.id.toString().padStart(4, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Mail size={14} className="text-gray-400" />
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {user.role === 'admin' ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-800 text-white text-xs font-bold rounded-full shadow-sm">
                              <Shield size={12} />
                              Admin
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full border border-gray-200">
                              <User size={12} />
                              Player
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar size={14} className="text-gray-400" />
                          <span>Joined 2025</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          {user.id !== currentUser?.id && (
                            <>
                              {user.role === 'admin' ? (
                                <button
                                  onClick={() => handleRoleChange(user.id, "player")}
                                  disabled={processingId !== null}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
                                  title="Demote to Player"
                                >
                                  {processingId === user.id ? <Loader2 size={14} className="animate-spin" /> : <User size={14} />}
                                  Make Player
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRoleChange(user.id, "admin")}
                                  disabled={processingId !== null}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                  title="Promote to Admin"
                                >
                                  {processingId === user.id ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                                  Make Admin
                                </button>
                              )}
                              <button
                                onClick={() => setDeleteConfirmId(user.id)}
                                disabled={processingId !== null}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                title="Delete User"
                              >
                                <Trash2 size={14} />
                                Remove
                              </button>
                            </>
                          )}
                          {user.id === currentUser?.id && (
                            <span className="text-xs text-gray-400 italic">Current User</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-medium italic">
                Showing {filteredUsers.length} of {users.length} total registered members.
              </p>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} className="text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Delete User?</h2>
                <p className="text-gray-600">
                  Are you sure you want to delete this user? This action cannot be undone. All their reservations will be cancelled.
                </p>
              </div>

              {(() => {
                const user = users.find(u => u.id === deleteConfirmId);
                return user ? (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-semibold text-gray-800">{user.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Role:</span>
                      <span className="text-sm font-semibold text-gray-800 capitalize">{user.role}</span>
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={processingId !== null}
                  className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirmId)}
                  disabled={processingId !== null}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingId === deleteConfirmId ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete User
                    </>
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

export default ManageUsers;

