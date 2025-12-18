import { useState, useEffect } from "react";
import { User, Mail, Edit2, Save, X, Lock, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import { useAuth } from "../hooks/useAuth";
import { updateProfile, changePassword } from "../api/authService";
import type { User as UserType } from "../types/user";

const Profile: React.FC = () => {
  const { user: currentUser, login } = useAuth();
  const [user, setUser] = useState<UserType | null>(currentUser);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Profile form state
  const [profileData, setProfileData] = useState({ name: "", email: "" });
  
  // Password form state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      setProfileData({ name: currentUser.name, email: currentUser.email });
    }
  }, [currentUser]);

  const handleEditClick = () => {
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setProfileData({ name: user.name, email: user.email });
    }
    setError("");
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError("");
      const updated = await updateProfile(user.id, profileData);
      setUser(updated);
      login(updated); // Update auth context
      setIsEditing(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to update profile.";
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await changePassword(user.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
      setSuccess("Password changed successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to change password.";
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">My Profile</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3 shadow-sm">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-start gap-3 shadow-sm">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          )}

          {/* Profile Section */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <User size={24} />
                Profile Information
              </h2>
              {!isEditing && (
                <button
                  onClick={handleEditClick}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all font-semibold"
                >
                  <Edit2 size={18} />
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none transition-all bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none transition-all bg-white text-gray-800"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold disabled:opacity-70"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all font-semibold disabled:opacity-70"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-2xl">
                    {getUserInitials(user.name)}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{user.name}</p>
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <Mail size={16} />
                      <span>{user.email}</span>
                    </div>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                      user.role === "admin" 
                        ? "bg-purple-100 text-purple-700" 
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {user.role === "admin" ? "Administrator" : "Player"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Password Section */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Lock size={24} />
                Password
              </h2>
              {!showPasswordForm && (
                <button
                  onClick={() => {
                    setShowPasswordForm(true);
                    setError("");
                    setSuccess("");
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all font-semibold"
                >
                  <Lock size={18} />
                  Change Password
                </button>
              )}
            </div>

            {showPasswordForm ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none transition-all bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none transition-all bg-white text-gray-800"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none transition-all bg-white text-gray-800"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      setError("");
                    }}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold disabled:opacity-70"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all font-semibold disabled:opacity-70"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Update Password
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-gray-600">Click "Change Password" to update your password.</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;

