import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Bell, Moon, Sun, Globe, Save, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import { useAuth } from "../hooks/useAuth";

interface SettingsPreferences {
  notifications: {
    email: boolean;
    reservationReminders: boolean;
    courtUpdates: boolean;
  };
  theme: "light" | "dark" | "system";
  language: string;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preferences, setPreferences] = useState<SettingsPreferences>({
    notifications: {
      email: true,
      reservationReminders: true,
      courtUpdates: false,
    },
    theme: "system",
    language: "en",
  });

  useEffect(() => {
    // Load saved preferences from localStorage
    const saved = localStorage.getItem("userPreferences");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
      } catch (err) {
        console.error("Failed to parse saved preferences:", err);
      }
    }
  }, []);

  const handleNotificationChange = (key: keyof SettingsPreferences["notifications"]) => {
    setPreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: !preferences.notifications[key],
      },
    });
  };

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    setPreferences({ ...preferences, theme });
    // Apply theme immediately
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const handleLanguageChange = (language: string) => {
    setPreferences({ ...preferences, language });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Save preferences to localStorage
      localStorage.setItem("userPreferences", JSON.stringify(preferences));
      
      // In a real app, you would send this to the backend
      // await api.put(`/users/${user?.id}/preferences`, preferences);
      
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to save settings.";
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
            <SettingsIcon size={32} />
            Settings
          </h1>

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

          {/* Notifications Section */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Bell size={24} />
              Notifications
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="font-semibold text-gray-800">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive email updates about your account</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.email}
                    onChange={() => handleNotificationChange("email")}
                    className="sr-only"
                  />
                  <div
                    className={`w-14 h-7 rounded-full transition-colors ${
                      preferences.notifications.email ? "bg-gray-800" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-1 ${
                        preferences.notifications.email ? "translate-x-8 ml-1" : "translate-x-1"
                      }`}
                    />
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="font-semibold text-gray-800">Reservation Reminders</p>
                  <p className="text-sm text-gray-600">Get notified before your reservations</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.reservationReminders}
                    onChange={() => handleNotificationChange("reservationReminders")}
                    className="sr-only"
                  />
                  <div
                    className={`w-14 h-7 rounded-full transition-colors ${
                      preferences.notifications.reservationReminders ? "bg-gray-800" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-1 ${
                        preferences.notifications.reservationReminders ? "translate-x-8 ml-1" : "translate-x-1"
                      }`}
                    />
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="font-semibold text-gray-800">Court Updates</p>
                  <p className="text-sm text-gray-600">Notifications about court availability and maintenance</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.courtUpdates}
                    onChange={() => handleNotificationChange("courtUpdates")}
                    className="sr-only"
                  />
                  <div
                    className={`w-14 h-7 rounded-full transition-colors ${
                      preferences.notifications.courtUpdates ? "bg-gray-800" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-1 ${
                        preferences.notifications.courtUpdates ? "translate-x-8 ml-1" : "translate-x-1"
                      }`}
                    />
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              {preferences.theme === "dark" ? <Moon size={24} /> : <Sun size={24} />}
              Appearance
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleThemeChange("light")}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      preferences.theme === "light"
                        ? "border-gray-800 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Sun size={24} className="mx-auto mb-2 text-gray-700" />
                    <p className="font-semibold text-gray-800">Light</p>
                  </button>
                  <button
                    onClick={() => handleThemeChange("dark")}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      preferences.theme === "dark"
                        ? "border-gray-800 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Moon size={24} className="mx-auto mb-2 text-gray-700" />
                    <p className="font-semibold text-gray-800">Dark</p>
                  </button>
                  <button
                    onClick={() => handleThemeChange("system")}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      preferences.theme === "system"
                        ? "border-gray-800 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <SettingsIcon size={24} className="mx-auto mb-2 text-gray-700" />
                    <p className="font-semibold text-gray-800">System</p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Language Section */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Globe size={24} />
              Language
            </h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Language</label>
              <select
                value={preferences.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none transition-all bg-white text-gray-800"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all font-semibold shadow-md disabled:opacity-70"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;

