import { useEffect, useState } from "react";
import { Grid3X3, Plus, MapPin, AlertCircle, CheckCircle, Loader2, Edit2, Trash2, Power, PowerOff } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import type { Court } from "../../types/court";
import courtService from "../../api/courtService";

const ManageCourts: React.FC = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Form state for adding/editing court
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", location: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadAllCourts = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await courtService.getAllCourts();
      setCourts(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load courts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAllCourts();
  }, []);

  const handleStatusToggle = async (id: number, currentStatus: string | undefined) => {
    try {
      setProcessingId(id);
      setError("");
      setSuccess("");
      const newStatus = currentStatus === "available" ? "maintenance" : "available";
      await courtService.updateCourtStatus(id, newStatus);
      setSuccess(`Court status updated to ${newStatus}.`);
      await loadAllCourts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Court update error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to update court status.";
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      await courtService.addCourt(formData);
      setSuccess("New court added successfully!");
      setFormData({ name: "", location: "" });
      setShowForm(false);
      await loadAllCourts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to add new court.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Courts</h1>
            <p className="text-gray-600">Add, edit, or toggle availability of pickleball courts.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-gray-800 text-white px-6 py-2.5 rounded-lg hover:bg-gray-900 transition-all font-semibold shadow-md active:scale-95"
          >
            {showForm ? <Trash2 size={18} /> : <Plus size={18} />}
            {showForm ? "Cancel" : "Add New Court"}
          </button>
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

        {showForm && (
          <div className="mb-8 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus size={20} className="text-gray-700" />
              Add New Court
            </h2>
            <form onSubmit={handleAddCourt} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Court Name</label>
                <input
                  type="text"
                  placeholder="e.g. Center Court 1"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sector A, Floor 2"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gray-800 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-gray-900 transition-all shadow-md flex items-center gap-2 disabled:opacity-70"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Create Court
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={32} className="animate-spin text-gray-400" />
              <p className="text-gray-500">Loading courts...</p>
            </div>
          </div>
        ) : courts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Grid3X3 size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No courts available.</p>
            <p className="text-gray-400 text-sm mt-1">Start by adding your first pickleball court.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courts.map((court) => (
              <div key={court.id} className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Grid3X3 size={24} className="text-gray-700" />
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                    court.status === 'available' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}>
                    {court.status?.toUpperCase() || 'AVAILABLE'}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-1">{court.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
                  <MapPin size={16} />
                  <span>{court.location || 'Facility Center'}</span>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-100 grid grid-cols-2 gap-3">
                  <button 
                    disabled={processingId === court.id}
                    onClick={() => handleStatusToggle(court.id, court.status || 'available')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      court.status === 'available' 
                        ? 'border-2 border-yellow-200 text-yellow-700 hover:bg-yellow-50' 
                        : 'border-2 border-green-200 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {processingId === court.id ? <Loader2 size={16} className="animate-spin" /> : (
                      court.status === 'available' ? <PowerOff size={16} /> : <Power size={16} />
                    )}
                    {court.status === 'available' ? 'Under Repair' : 'Set Available'}
                  </button>
                  <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
                    <Edit2 size={16} />
                    Edit Info
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ManageCourts;

