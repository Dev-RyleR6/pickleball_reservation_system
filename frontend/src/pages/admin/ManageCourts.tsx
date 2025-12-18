import { useEffect, useState } from "react";
import { Grid3X3, Plus, MapPin, AlertCircle, CheckCircle, Loader2, Edit2, Trash2, Power, PowerOff, XCircle } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import type { Court } from "../../types/court";
import courtService from "../../api/courtService";
import { useNotifications } from "../../context/NotificationContext";
import { useCourtSocket } from "../../context/SocketContext";

const ManageCourts: React.FC = () => {
  const { addNotification } = useNotifications();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  
  // Form state for adding/editing court
  const [showForm, setShowForm] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", location: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  // Real-time socket listeners for court changes
  useCourtSocket(
    // onCourtCreated
    (court) => {
      void loadAllCourts();
    },
    // onCourtUpdated
    (court) => {
      void loadAllCourts();
    },
    // onCourtDeleted
    (courtId) => {
      void loadAllCourts();
    },
    // onCourtStatusChanged
    (court) => {
      void loadAllCourts();
    }
  );

  const handleStatusToggle = async (id: number, currentStatus: string | undefined) => {
    try {
      setProcessingId(id);
      setError("");
      setSuccess("");
      const newStatus = currentStatus === "available" ? "maintenance" : "available";
      const court = courts.find(c => c.id === id);
      await courtService.updateCourtStatus(id, newStatus);
      
      // Add notification for all users
      if (court) {
        addNotification({
          type: newStatus === "available" ? "success" : "warning",
          title: `Court ${newStatus === "available" ? "Available" : "Under Maintenance"}`,
          message: `${court.name} is now ${newStatus === "available" ? "available for bookings" : "under maintenance and unavailable"}.`,
          link: "/courts",
        });
      }
      
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

  const handleEditClick = (court: Court) => {
    setEditingCourtId(court.id);
    setFormData({ name: court.name, location: court.location || "" });
    setImageFile(null);
    setImagePreview(court.image ? `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}${court.image}` : null);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCourtId(null);
    setFormData({ name: "", location: "" });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("location", formData.location);
      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }
      
      if (editingCourtId) {
        await courtService.updateCourtWithImage(editingCourtId, formDataToSend);
        addNotification({
          type: "info",
          title: "Court Updated",
          message: `Court "${formData.name}" has been updated.`,
          link: "/courts",
        });
        setSuccess("Court updated successfully!");
      } else {
        await courtService.addCourtWithImage(formDataToSend);
        addNotification({
          type: "success",
          title: "New Court Added",
          message: `A new court "${formData.name}" has been added and is now available for bookings.`,
          link: "/courts",
        });
        setSuccess("New court added successfully!");
      }
      
      setFormData({ name: "", location: "" });
      setImageFile(null);
      setImagePreview(null);
      setShowForm(false);
      setEditingCourtId(null);
      await loadAllCourts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.error || err.message || (editingCourtId ? "Failed to update court." : "Failed to add new court.");
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourt = async (id: number) => {
    try {
      setProcessingId(id);
      setError("");
      setSuccess("");
      const court = courts.find(c => c.id === id);
      await courtService.deleteCourt(id);
      
      // Add notification
      if (court) {
        addNotification({
          type: "warning",
          title: "Court Removed",
          message: `Court "${court.name}" has been removed from the system.`,
          link: "/courts",
        });
      }
      
      setSuccess("Court deleted successfully!");
      setDeleteConfirmId(null);
      await loadAllCourts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Court delete error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to delete court.";
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    } finally {
      setProcessingId(null);
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
            onClick={() => {
              if (showForm) {
                handleCancelForm();
              } else {
                setShowForm(true);
                setEditingCourtId(null);
                setFormData({ name: "", location: "" });
                setImageFile(null);
                setImagePreview(null);
              }
            }}
            className="flex items-center gap-2 bg-gray-800 text-white px-6 py-2.5 rounded-lg hover:bg-gray-900 transition-all font-semibold shadow-md active:scale-95"
          >
            {showForm ? <XCircle size={18} /> : <Plus size={18} />}
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
              {editingCourtId ? <Edit2 size={20} className="text-gray-700" /> : <Plus size={20} className="text-gray-700" />}
              {editingCourtId ? "Edit Court" : "Add New Court"}
            </h2>
            <form onSubmit={handleSubmitCourt} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Court Name</label>
                <input
                  type="text"
                  placeholder="e.g. Center Court 1"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none transition-all bg-white text-gray-800 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sector A, Floor 2"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none transition-all bg-white text-gray-800 placeholder-gray-400"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Court Image (Optional)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none transition-all bg-white text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                <p className="text-xs text-gray-500 mt-1">Upload an image of the court (JPEG, PNG, GIF, or WebP, max 5MB)</p>
                {imagePreview && (
                  <div className="mt-3">
                    <img 
                      src={imagePreview} 
                      alt="Court preview" 
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  disabled={submitting}
                  className="border-2 border-gray-300 text-gray-700 px-8 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gray-800 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-gray-900 transition-all shadow-md flex items-center gap-2 disabled:opacity-70"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  {editingCourtId ? "Update Court" : "Create Court"}
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
              <div key={court.id} className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                {court.image && (
                  <div className="w-full h-48 overflow-hidden">
                    <img 
                      src={court.image.startsWith('http') ? court.image : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}${court.image}`}
                      alt={court.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-4">
                    {!court.image && (
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <Grid3X3 size={24} className="text-gray-700" />
                      </div>
                    )}
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

                <div className="mt-auto pt-6 border-t border-gray-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      disabled={processingId === court.id}
                      onClick={() => handleStatusToggle(court.id, court.status || 'available')}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                        court.status === 'available' 
                          ? 'border-2 border-yellow-200 text-yellow-700 hover:bg-yellow-50' 
                          : 'border-2 border-green-200 text-green-700 hover:bg-green-50'
                      } disabled:opacity-50`}
                    >
                      {processingId === court.id ? <Loader2 size={16} className="animate-spin" /> : (
                        court.status === 'available' ? <PowerOff size={16} /> : <Power size={16} />
                      )}
                      {court.status === 'available' ? 'Under Repair' : 'Set Available'}
                    </button>
                    <button 
                      onClick={() => handleEditClick(court)}
                      disabled={processingId === court.id}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      <Edit2 size={16} />
                      Edit Info
                    </button>
                  </div>
                  {deleteConfirmId === court.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteCourt(court.id)}
                        disabled={processingId === court.id}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50"
                      >
                        {processingId === court.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        disabled={processingId === court.id}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setDeleteConfirmId(court.id)}
                      disabled={processingId === court.id}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border-2 border-red-200 text-red-700 hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      Delete Court
                    </button>
                  )}
                </div>
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

