import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock, MapPin, CheckCircle, AlertCircle, Info, Sparkles, X, Timer, Loader2 } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import courtService from "../api/courtService";
import type { Court } from "../types/court";
import reservationService from "../api/reservationService";

const BookCourt: React.FC = () => {
  const navigate = useNavigate();
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtId, setCourtId] = useState<string>("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState<number>(1); // Duration in hours
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [reservationDetails, setReservationDetails] = useState<{court?: string; date?: string; time?: string; duration?: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  // Get selected court details
  const selectedCourt = courts.find((c) => String(c.id) === courtId);

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Parse slot time (handles formats like "09:00" or "09:00 - 10:00")
  const parseSlotTime = (slot: string): string => {
    if (!slot) return "";
    // Handle formats: "09:00", "09:00 - 10:00", "9:00", etc.
    const [timePart] = slot.trim().split(/[\s-]+/);
    // Normalize to HH:MM format
    if (timePart && timePart.match(/^\d{1,2}:\d{2}$/)) {
      const [h, m] = timePart.split(":").map(Number);
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }
    return timePart || "";
  };

  // Get available start times from slots (sorted)
  const getAvailableStartTimes = (): string[] => {
    if (!selectedCourt?.availableSlots) return [];
    const times = selectedCourt.availableSlots.map(parseSlotTime).filter(Boolean);
    // Sort times to ensure proper consecutive checking
    return times.sort((a, b) => {
      const [hourA, minA] = a.split(":").map(Number);
      const [hourB, minB] = b.split(":").map(Number);
      return hourA * 60 + minA - (hourB * 60 + minB);
    });
  };

  // Check if a time slot is available
  const isTimeSlotAvailable = (checkTime: string): boolean => {
    if (!checkTime || !selectedCourt?.availableSlots) return false;
    const availableTimes = getAvailableStartTimes();
    return availableTimes.includes(checkTime);
  };

  // Calculate maximum consecutive duration available from a start time
  const getMaxAvailableDuration = (startTime: string): number => {
    if (!startTime || !selectedCourt?.availableSlots) return 4; // Default to 4 if no slots data
    
    // Normalize startTime format
    const normalizedStartTime = parseSlotTime(startTime);
    if (!normalizedStartTime) return 4;
    
    const availableTimes = getAvailableStartTimes();
    
    // If no available times, default to 4 hours (assume all times available)
    if (availableTimes.length === 0) {
      return 4;
    }
    
    // If start time is not in available slots but slots exist, 
    // assume it's available and allow up to 4 hours
    if (!availableTimes.includes(normalizedStartTime)) {
      // If we have available slots but this time isn't in them,
      // it might be manually entered, so allow up to 4 hours
      return 4;
    }

    const [startHour, startMin] = normalizedStartTime.split(":").map(Number);
    
    // Check consecutive hours (1-4 hours max)
    // For a duration of N hours starting at startTime, we need:
    // - startTime slot (for hour 0-1) 
    // - startTime+1 slot (for hour 1-2)
    // - startTime+2 slot (for hour 2-3)
    // - ... up to startTime+(N-1) slot (for hour (N-1)-N)
    // So for N hours, we need N consecutive slots starting from startTime
    
    let maxDuration = 4; // Start with max, reduce if consecutive slots don't exist
    
    // Check for 4, 3, 2 hour durations (checking backwards)
    // This way we find the maximum available duration
    for (let hours = 4; hours >= 2; hours--) {
      let allConsecutiveAvailable = true;
      
      // Check if we have all consecutive slots needed for this duration
      // We need slots at: startTime, startTime+1, ..., startTime+(hours-1)
      for (let h = 0; h < hours; h++) {
        const checkHour = (startHour + h) % 24;
        const checkTime = `${checkHour.toString().padStart(2, "0")}:${startMin.toString().padStart(2, "0")}`;
        
        // Check if this time slot exists in available times
        if (!availableTimes.includes(checkTime)) {
          allConsecutiveAvailable = false;
          break;
        }
      }
      
      if (allConsecutiveAvailable) {
        maxDuration = hours;
        break; // Found the max, no need to check smaller durations
      }
    }
    
    // If we couldn't find consecutive slots, at least 1 hour is available
    return Math.max(maxDuration, 1);
  };

  // Get available duration options based on selected time
  const getAvailableDurations = (): number[] => {
    // Always show all options (1-4 hours)
    // The select will disable unavailable ones
    return [1, 2, 3, 4];
  };

  // Calculate end time based on start time and duration
  const getEndTime = (startTime: string, durationHours: number = duration) => {
    if (!startTime) return "";
    const [hours, minutes] = startTime.split(":");
    const startHour = parseInt(hours);
    const endHour = (startHour + durationHours) % 24;
    return `${endHour.toString().padStart(2, "0")}:${minutes}`;
  };

  // Validate if selected duration fits within available slots
  const validateDuration = (startTime: string, durationHours: number): boolean => {
    if (!startTime || !selectedCourt?.availableSlots) return false;
    const maxDuration = getMaxAvailableDuration(startTime);
    return durationHours <= maxDuration && durationHours > 0;
  };

  // Calculate completion progress
  const getProgress = () => {
    let completed = 0;
    if (courtId) completed++;
    if (date) completed++;
    if (time) completed++;
    if (duration) completed++;
    return (completed / 4) * 100;
  };

  // Check if form is complete and valid
  const isFormComplete = courtId && date && time && duration > 0 && 
    selectedCourt?.availableSlots && selectedCourt.availableSlots.length > 0 &&
    isTimeSlotAvailable(time) && validateDuration(time, duration);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await courtService.getAllCourts();
        setCourts(data);
        if (data.length > 0) {
          setCourtId(String(data[0].id));
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load courts. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    };

    void fetchCourts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate all fields are filled
    if (!courtId || !date || !time || !duration) {
      setError("Please fill in all fields.");
      return;
    }

    // Validate court is available
    if (!selectedCourt) {
      setError("Selected court is not available.");
      return;
    }

    if (!selectedCourt.availableSlots || selectedCourt.availableSlots.length === 0) {
      setError("This court has no available slots. Please select another court.");
      return;
    }

    // Validate time slot is available
    if (!isTimeSlotAvailable(time)) {
      setError(`The selected time slot (${time}) is not available for this court. Please choose from the available slots.`);
      return;
    }

    // Validate duration fits within available slots
    if (!validateDuration(time, duration)) {
      const maxDuration = getMaxAvailableDuration(time);
      setError(`The selected duration (${duration} hour${duration > 1 ? 's' : ''}) exceeds available time. Maximum duration from ${time} is ${maxDuration} hour${maxDuration > 1 ? 's' : ''}.`);
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError("Please select a date in the future.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      
      // Store reservation details for success modal
      setReservationDetails({
        court: selectedCourt?.name,
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        time: `${time} - ${getEndTime(time, duration)}`,
        duration: duration
      });
      
      await reservationService.createReservation(courtId, date, time, duration);
      
      // Show success modal
      setShowSuccessModal(true);
      setSuccess("Reservation created successfully!");
      
      // Clear form
      setDate("");
      setTime("");
      setDuration(1);
      setSelectedSlotIndex(null);
      
      // Auto-close modal and redirect after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate("/reservations");
      }, 3000);
    } catch (err: any) {
      console.error(err);
      let errorMsg = "Failed to create reservation. Please try again.";
      
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setError("");
      }, 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading courts...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <CalendarDays size={24} className="text-gray-700" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-1">Book a Court</h1>
                  <p className="text-gray-600">
                    Select a court, date, and time to create your reservation.
                  </p>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Booking Progress</span>
                  <span className="text-sm font-semibold text-gray-800">{Math.round(getProgress())}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gray-800 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${getProgress()}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span className={courtId ? "text-gray-800 font-medium" : ""}>1. Court</span>
                  <span className={date ? "text-gray-800 font-medium" : ""}>2. Date</span>
                  <span className={time ? "text-gray-800 font-medium" : ""}>3. Time</span>
                  <span className={duration ? "text-gray-800 font-medium" : ""}>4. Duration</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Selected Court Info Card */}
              <div className="lg:col-span-1">
                {selectedCourt ? (
                  <div className="bg-white rounded-lg border-2 border-gray-200 p-6 shadow-md sticky top-8 hover:shadow-lg transition-shadow">
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-3 bg-gray-100 rounded-lg">
                          <CalendarDays size={24} className="text-gray-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2 break-words">{selectedCourt.name}</h3>
                          {selectedCourt.location && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                              <MapPin size={14} className="text-gray-500 flex-shrink-0" />
                              <span className="truncate">{selectedCourt.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedCourt.availableSlots && selectedCourt.availableSlots.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-gray-700">Available Slots</p>
                          <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">
                            {selectedCourt.availableSlots.length} available
                          </span>
                        </div>
                        {time && (
                          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-700">
                              <Info size={12} className="inline mr-1" />
                              Max duration from selected time: {getMaxAvailableDuration(time)} hour{getMaxAvailableDuration(time) > 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {selectedCourt.availableSlots.map((slot, idx) => {
                            const [timePart] = slot.split(" ");
                            const isSelected = time === timePart;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  if (timePart) {
                                    setTime(timePart);
                                    setSelectedSlotIndex(idx);
                                    setError("");
                                  }
                                }}
                                className={`w-full flex items-center justify-between gap-2 p-3 rounded-lg transition-all ${
                                  isSelected
                                    ? "bg-gray-800 text-white shadow-md scale-[1.02]"
                                    : "bg-gray-50 hover:bg-gray-100 text-gray-700 hover:shadow-sm"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Clock size={16} className={isSelected ? "text-white" : "text-gray-400"} />
                                  <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-700"}`}>
                                    {slot}
                                  </span>
                                </div>
                                {isSelected && <CheckCircle size={16} className="text-white" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500 text-center">No available slots at the moment.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="text-center py-8">
                      <CalendarDays size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">Select a court to see details.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Booking Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3 shadow-md animate-in slide-in-from-top-2">
                      <div className="p-1 bg-red-100 rounded-full flex-shrink-0">
                        <AlertCircle size={20} className="text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-red-800">Booking Failed</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                        {error.includes("conflict") && (
                          <p className="text-xs text-red-600 mt-2">
                            💡 Tip: Try selecting a different time slot or court.
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setError("")}
                        className="text-red-600 hover:text-red-800 transition-colors p-1 hover:bg-red-100 rounded"
                        aria-label="Dismiss error"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  {success && !showSuccessModal && (
                    <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-start gap-3 shadow-md animate-in slide-in-from-top-2">
                      <div className="p-1.5 bg-green-100 rounded-full">
                        <CheckCircle size={20} className="text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-green-800">Success!</p>
                        <p className="text-sm text-green-700 mt-1">{success}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                          <p className="text-xs text-green-600">Redirecting to reservations...</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Helpful Tip */}
                  {!error && !success && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                      <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-800 mb-1">Quick Tip</p>
                        <p className="text-xs text-blue-700">
                          Click on any available time slot in the sidebar to auto-fill the time field. Duration options are automatically adjusted based on available consecutive time slots. If a court has no available slots, please select a different court.
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Court Selection */}
                    <div className="relative">
                      <label htmlFor="court" className="block text-base font-bold text-gray-900 mb-3">
                        Select Court <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="court"
                          value={courtId}
                          onChange={(e) => {
                            setCourtId(e.target.value);
                            setTime(""); // Reset time when court changes
                            setDuration(1); // Reset duration
                            setSelectedSlotIndex(null);
                            setError("");
                          }}
                          className="w-full rounded-lg border-2 border-gray-400 px-4 py-3.5 pr-12 text-base font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-gray-600 transition-all bg-white appearance-none cursor-pointer hover:border-gray-500 shadow-sm"
                          required
                        >
                          {courts.length === 0 ? (
                            <option value="" className="text-gray-500">No courts available</option>
                          ) : (
                            courts.map((court) => {
                              const hasSlots = court.availableSlots && court.availableSlots.length > 0;
                              return (
                                <option key={court.id} value={court.id} className="text-gray-900">
                                  {court.name} {court.location ? `- ${court.location}` : ""} {hasSlots ? `(${court.availableSlots.length} slots)` : "(Unavailable)"}
                                </option>
                              );
                            })
                          )}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <CalendarDays size={20} className="text-gray-600" />
                        </div>
                      </div>
                      {selectedCourt && (
                        <div className={`mt-3 p-3 rounded-lg border ${
                          selectedCourt.availableSlots && selectedCourt.availableSlots.length > 0
                            ? "bg-gray-50 border-gray-300"
                            : "bg-red-50 border-red-200"
                        }`}>
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <MapPin size={14} className="text-gray-600" />
                            <span className="text-gray-800 font-semibold">{selectedCourt.location}</span>
                          </div>
                          {selectedCourt.availableSlots && selectedCourt.availableSlots.length > 0 ? (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                Available
                              </span>
                              <span className="text-gray-700 font-medium">
                                {selectedCourt.availableSlots.length} slot{selectedCourt.availableSlots.length > 1 ? 's' : ''} available
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm">
                              <AlertCircle size={14} className="text-red-600" />
                              <span className="text-red-700 font-medium">
                                No available slots. Please select another court.
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Date, Time, and Duration Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Date Selection */}
                      <div>
                        <label htmlFor="date" className="block text-base font-bold text-gray-900 mb-3">
                          Select Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <CalendarDays size={20} className="text-gray-600" />
                          </div>
                          <input
                            id="date"
                            type="date"
                            value={date}
                            min={getMinDate()}
                            onChange={(e) => {
                              setDate(e.target.value);
                              setError("");
                            }}
                            className="w-full rounded-lg border-2 border-gray-400 pl-12 pr-4 py-3.5 text-base font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-gray-600 transition-all hover:border-gray-500 shadow-sm bg-white"
                            required
                          />
                        </div>
                        {date && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-300">
                            <p className="text-sm text-gray-800 flex items-center gap-2">
                              <CalendarDays size={14} className="text-gray-600" />
                              <span className="font-semibold">
                                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                              </span>
                            </p>
                          </div>
                        )}
                        {!date && (
                          <p className="mt-2 text-xs text-gray-500">Choose a date</p>
                        )}
                      </div>

                      {/* Time Selection */}
                      <div>
                        <label htmlFor="time" className="block text-base font-bold text-gray-900 mb-3">
                          Select Time <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <Clock size={20} className="text-gray-600" />
                          </div>
                          <input
                            id="time"
                            type="time"
                            value={time}
                            onChange={(e) => {
                              const newTime = e.target.value;
                              setTime(newTime);
                              setSelectedSlotIndex(null);
                              // Reset duration to 1 when time changes, or adjust if needed
                              if (newTime) {
                                const maxDur = getMaxAvailableDuration(newTime);
                                if (duration > maxDur) {
                                  setDuration(Math.max(1, maxDur));
                                }
                              }
                              setError("");
                            }}
                            className={`w-full rounded-lg border-2 pl-12 pr-4 py-3.5 text-base font-medium text-gray-900 focus:outline-none focus:ring-2 transition-all hover:border-gray-500 shadow-sm bg-white ${
                              time && !isTimeSlotAvailable(time)
                                ? "border-red-400 focus:ring-red-500 focus:border-red-500"
                                : "border-gray-400 focus:ring-gray-600 focus:border-gray-600"
                            }`}
                            required
                          />
                        </div>
                        {time && (
                          <div className={`mt-3 p-3 rounded-lg border ${
                            isTimeSlotAvailable(time)
                              ? "bg-gray-50 border-gray-300"
                              : "bg-red-50 border-red-200"
                          }`}>
                            {isTimeSlotAvailable(time) ? (
                              <p className="text-sm text-gray-800 flex items-center gap-2">
                                <Clock size={14} className="text-gray-600" />
                                <span className="font-semibold">
                                  {time} - {getEndTime(time)}
                                </span>
                              </p>
                            ) : (
                              <p className="text-sm text-red-700 flex items-center gap-2">
                                <AlertCircle size={14} />
                                <span>This time slot is not available. Please select from available slots.</span>
                              </p>
                            )}
                          </div>
                        )}
                        {!time && (
                          <p className="mt-2 text-xs text-gray-500">Select start time</p>
                        )}
                      </div>

                      {/* Duration Selection */}
                      <div>
                        <label htmlFor="duration" className="block text-base font-bold text-gray-900 mb-3">
                          Duration <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <Timer size={20} className="text-gray-600" />
                          </div>
                          <select
                            id="duration"
                            value={duration}
                            onChange={(e) => {
                              setDuration(parseInt(e.target.value));
                              setError("");
                            }}
                            disabled={!time || !isTimeSlotAvailable(time)}
                            className={`w-full rounded-lg border-2 pl-12 pr-4 py-3.5 text-base font-medium text-gray-900 focus:outline-none focus:ring-2 transition-all hover:border-gray-500 shadow-sm bg-white appearance-none ${
                              !time || !isTimeSlotAvailable(time)
                                ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-60"
                                : duration && !validateDuration(time, duration)
                                ? "border-red-400 focus:ring-red-500 focus:border-red-500"
                                : "border-gray-400 focus:ring-gray-600 focus:border-gray-600 cursor-pointer"
                            }`}
                            required
                          >
                            {[1, 2, 3, 4].map((dur) => {
                              const isAvailable = time && isTimeSlotAvailable(time) && dur <= getMaxAvailableDuration(time);
                              return (
                                <option 
                                  key={dur} 
                                  value={dur}
                                  disabled={!isAvailable}
                                  style={{ color: isAvailable ? '#111827' : '#9CA3AF' }}
                                >
                                  {dur} {dur === 1 ? 'hour' : 'hours'} {!isAvailable && '(not available)'}
                                </option>
                              );
                            })}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <Timer size={18} className="text-gray-400" />
                          </div>
                        </div>
                        {time && duration && (
                          <div className={`mt-3 p-3 rounded-lg border ${
                            validateDuration(time, duration)
                              ? "bg-gray-50 border-gray-300"
                              : "bg-red-50 border-red-200"
                          }`}>
                            {validateDuration(time, duration) ? (
                              <div>
                                <p className="text-sm text-gray-800 flex items-center gap-2 mb-1">
                                  <Timer size={14} className="text-gray-600" />
                                  <span className="font-semibold">
                                    {duration} {duration === 1 ? 'hour' : 'hours'}
                                  </span>
                                </p>
                                {getMaxAvailableDuration(time) > duration && (
                                  <p className="text-xs text-gray-600">
                                    Up to {getMaxAvailableDuration(time)} hours available
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-red-700 flex items-center gap-2">
                                <AlertCircle size={14} />
                                <span>Duration exceeds available time</span>
                              </p>
                            )}
                          </div>
                        )}
                        {!time && (
                          <p className="mt-2 text-xs text-gray-500">Select time first</p>
                        )}
                        {time && !duration && (
                          <p className="mt-2 text-xs text-gray-500">Select duration</p>
                        )}
                      </div>
                    </div>

                    {/* Summary Card */}
                    {isFormComplete && (
                      <div className="p-6 bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 rounded-lg border-2 border-gray-300 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 bg-gray-800 rounded-lg">
                            <Sparkles size={16} className="text-white" />
                          </div>
                          <p className="text-sm font-semibold text-gray-800">Reservation Summary</p>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between py-2.5 px-3 bg-white rounded-lg border border-gray-200">
                            <span className="text-gray-600 flex items-center gap-2">
                              <CalendarDays size={14} className="text-gray-400" />
                              Court
                            </span>
                            <span className="font-semibold text-gray-800">{selectedCourt?.name}</span>
                          </div>
                          <div className="flex items-center justify-between py-2.5 px-3 bg-white rounded-lg border border-gray-200">
                            <span className="text-gray-600 flex items-center gap-2">
                              <CalendarDays size={14} className="text-gray-400" />
                              Date
                            </span>
                            <span className="font-semibold text-gray-800">
                              {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2.5 px-3 bg-white rounded-lg border border-gray-200">
                            <span className="text-gray-600 flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              Time
                            </span>
                            <span className="font-semibold text-gray-800">
                              {time} - {getEndTime(time)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2.5 px-3 bg-white rounded-lg border border-gray-200">
                            <span className="text-gray-600 flex items-center gap-2">
                              <Timer size={14} className="text-gray-400" />
                              Duration
                            </span>
                            <span className="font-semibold text-gray-800">
                              {duration} {duration === 1 ? 'hour' : 'hours'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-700 flex items-start gap-2">
                            <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                            <span>Your reservation will be pending approval. You'll receive a confirmation email once approved.</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => navigate("/courts")}
                        className="flex-1 px-6 py-3.5 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || !isFormComplete}
                        className={`flex-1 px-6 py-3.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                          isFormComplete
                            ? "bg-gray-800 text-white hover:bg-gray-900 shadow-md hover:shadow-lg active:scale-[0.98]"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {submitting ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            <span>Creating Reservation...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={20} />
                            <span>Confirm Booking</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && reservationDetails && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Reservation Confirmed!</h2>
                <p className="text-gray-600">Your court reservation has been created successfully.</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Court:</span>
                  <span className="text-sm font-semibold text-gray-800">{reservationDetails.court}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="text-sm font-semibold text-gray-800">{reservationDetails.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time:</span>
                  <span className="text-sm font-semibold text-gray-800">{reservationDetails.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="text-sm font-semibold text-gray-800">{reservationDetails.duration} {reservationDetails.duration === 1 ? 'hour' : 'hours'}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-xs text-blue-700 flex items-start gap-2">
                  <Info size={14} className="mt-0.5 flex-shrink-0" />
                  <span>Your reservation is pending approval. You'll receive a confirmation email once approved by an administrator.</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate("/reservations");
                  }}
                  className="flex-1 bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors"
                >
                  View Reservations
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    // Reset form and stay on page
                    setDate("");
                    setTime("");
                    setDuration(1);
                    setSelectedSlotIndex(null);
                  }}
                  className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Book Another
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default BookCourt;


