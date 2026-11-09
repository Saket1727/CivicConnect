import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Hospital, 
  MapPin, 
  Phone, 
  Globe, 
  ShieldCheck, 
  Bed, 
  Star, 
  Calendar, 
  Clock, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Navigation,
  Send,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProvenanceBadge from '../../components/common/ProvenanceBadge';

export default function HospitalDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // OPD Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewNotice, setReviewNotice] = useState(null);

  useEffect(() => {
    fetchHospitalDetails();
  }, [id]);

  const fetchHospitalDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/hospitals/${id}`);
      if (res.data?.success) {
        setHospital(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load hospital details');
    } finally {
      setLoading(false);
    }
  };

  // When doctor or appointment date changes, fetch available OPD slots
  useEffect(() => {
    if (!selectedDoctorId || !appointmentDate) {
      setAvailableSlots([]);
      return;
    }

    async function loadDoctorSlots() {
      setSlotsLoading(true);
      try {
        const res = await api.get(`/doctors/${selectedDoctorId}/slots?date=${appointmentDate}`);
        if (res.data?.success) {
          setAvailableSlots(res.data.data.slots || []);
        }
      } catch (err) {
        console.warn('Failed to load slots:', err.message);
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }
    loadDoctorSlots();
  }, [selectedDoctorId, appointmentDate]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!selectedDoctorId || !appointmentDate || !selectedSlot) {
      setBookingError('Please select a doctor, appointment date, and available time slot.');
      return;
    }

    setBookingSubmitting(true);
    setBookingError(null);
    try {
      const res = await api.post('/appointments/book', {
        hospitalId: id,
        doctorId: selectedDoctorId,
        appointmentDate,
        timeSlot: selectedSlot,
        symptoms,
      });

      if (res.data?.success) {
        setBookingSuccess(res.data.data);
      }
    } catch (err) {
      setBookingError(err.message || 'Failed to submit appointment request.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSubmittingReview(true);
    setReviewNotice(null);
    try {
      const res = await api.post('/reviews', {
        hospitalId: id,
        rating: reviewRating,
        comment: reviewComment,
      });

      if (res.data?.success) {
        setReviewNotice({ type: 'success', message: 'Thank you! Your verified review has been published.' });
        setReviewComment('');
        fetchHospitalDetails();
      }
    } catch (err) {
      setReviewNotice({ type: 'error', message: err.message || 'Failed to submit review' });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-health-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading hospital profile & bed statistics...</p>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Hospital Profile Unavailable</h2>
        <p className="text-xs text-slate-500">{error || 'Record could not be retrieved from the database.'}</p>
        <Link to="/hospitals" className="inline-block px-4 py-2 bg-health-700 text-white rounded-xl text-xs font-semibold">
          Return to Hospital Discovery
        </Link>
      </div>
    );
  }

  const allDoctors = hospital.departments?.flatMap(d => d.doctors) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hospital Hero Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <ProvenanceBadge provenance={hospital.provenance} isSimulated={hospital.isSimulated} isThirdParty={hospital.isThirdParty} />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 uppercase">
                {hospital.type}
              </span>
              {hospital.registrationNo && (
                <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  Reg: {hospital.registrationNo}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {hospital.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-health-600" />
                <span>{hospital.address}, {hospital.city}, {hospital.state} {hospital.pincode}</span>
              </span>
              <span className="flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{hospital.rating} ({hospital.reviewCount} Reviews)</span>
              </span>
            </div>

            {/* Contact details */}
            <div className="flex flex-wrap gap-4 text-xs pt-1">
              {hospital.phone && (
                <a href={`tel:${hospital.phone}`} className="flex items-center gap-1.5 text-slate-700 hover:text-health-700 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{hospital.phone}</span>
                </a>
              )}
              {hospital.emergencyPhone && (
                <a href={`tel:${hospital.emergencyPhone}`} className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Emergency: {hospital.emergencyPhone}</span>
                </a>
              )}
              {hospital.website && (
                <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-health-700 hover:underline">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Official Website</span>
                </a>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[220px]">
            {hospital.canBookAppointment && (
              <button
                onClick={() => {
                  setBookingModalOpen(true);
                  setBookingSuccess(null);
                  setBookingError(null);
                }}
                className="bg-health-700 hover:bg-health-800 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Book OPD Consultation</span>
              </button>
            )}

            <Link
              to={`/emergency-register?hospitalId=${hospital.id}`}
              className="bg-emergency-600 hover:bg-emergency-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition text-center flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Register Emergency OPD</span>
            </Link>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition text-center flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5 text-health-600" />
              <span>Get Directions</span>
            </a>
          </div>

        </div>
      </div>

      {/* Bed Availability Module */}
      {hospital.beds && hospital.beds.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Bed className="w-5 h-5 text-health-600" />
                <span>Verified Bed Availability & Occupancy</span>
              </h2>
              <p className="text-xs text-slate-500">Live operational counts validated under Available = Total - Occupied formula</p>
            </div>
            {hospital.isSimulated && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                [SIMULATED DATA FOR ACADEMIC TESTING]
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
            {hospital.beds.map((b) => (
              <div key={b.category} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center space-y-1">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">{b.category}</span>
                <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                  {b.availableBeds}
                </div>
                <div className="text-[11px] text-slate-500">
                  Available out of <span className="font-semibold text-slate-700">{b.totalBeds}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${b.totalBeds > 0 ? (b.availableBeds / b.totalBeds) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block pt-1">
                  Occupied: {b.occupiedBeds}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Departments & Doctor Roster */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Clinical Departments & Specialists</h2>
          <p className="text-xs text-slate-500">Scheduled outpatient departments and certified medical practitioners</p>
        </div>

        {hospital.departments && hospital.departments.length > 0 ? (
          <div className="space-y-6">
            {hospital.departments.map((dept) => (
              <div key={dept.id} className="border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{dept.name}</h3>
                    <p className="text-xs text-slate-500">{dept.description}</p>
                  </div>
                  {dept.headDoctor && (
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                      HOD: {dept.headDoctor}
                    </span>
                  )}
                </div>

                {/* Doctors in department */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dept.doctors && dept.doctors.length > 0 ? (
                    dept.doctors.map((doc) => (
                      <div key={doc.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-slate-900">{doc.user.name}</h4>
                          <p className="text-xs font-medium text-health-700">{doc.specialization}</p>
                          <p className="text-[11px] text-slate-500">{doc.qualification}</p>
                          <p className="text-[11px] text-slate-400">Experience: {doc.experienceYears} Years</p>
                          <p className="text-xs font-bold text-slate-700 pt-1">
                            Consultation: {doc.consultationFee === 0 ? 'Free (Govt OPD)' : `₹${doc.consultationFee}`}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedDeptId(dept.id);
                            setSelectedDoctorId(doc.id);
                            setBookingModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-health-700 hover:bg-health-800 text-white rounded-lg text-xs font-semibold transition"
                        >
                          Book Slot
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No specialist currently listed for this department.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Department roster details are being updated by hospital administration.</p>
        )}
      </div>

      {/* Patient Reviews & Ratings */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Patient Experiences & Verified Feedback</h2>
            <p className="text-xs text-slate-500">Authentic reviews recorded after eligible hospital visits</p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 text-amber-900 px-4 py-2 rounded-2xl border border-amber-200">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            <span className="text-xl font-extrabold">{hospital.rating}</span>
            <span className="text-xs font-medium text-amber-700">/ 5.0</span>
          </div>
        </div>

        {/* Submit Review Form */}
        {isAuthenticated && (
          <form onSubmit={handleReviewSubmit} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Leave Your Feedback</h3>
            
            {reviewNotice && (
              <div className={`p-3 rounded-xl text-xs font-medium ${reviewNotice.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                {reviewNotice.message}
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Your Rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Describe doctor consultation, emergency responsiveness, cleanliness, and OPD wait time..."
              rows={3}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-health-500"
            />

            <button
              type="submit"
              disabled={submittingReview}
              className="bg-health-700 hover:bg-health-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition"
            >
              {submittingReview ? 'Submitting...' : 'Post Verified Review'}
            </button>
          </form>
        )}

        {/* Existing Reviews List */}
        <div className="space-y-4 pt-2">
          {hospital.reviews && hospital.reviews.length > 0 ? (
            hospital.reviews.map((rev) => (
              <div key={rev.id} className="border-b border-slate-100 pb-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-xs">{rev.user?.name || 'Verified Citizen'}</span>
                    {rev.isVerifiedVisit && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified Visit</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                <span className="text-[10px] text-slate-400">
                  {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No reviews yet for this hospital. Be the first to share your experience!</p>
          )}
        </div>
      </div>

      {/* OPD Appointment Booking Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Book OPD Appointment</h3>
                <p className="text-xs text-slate-500">{hospital.name}</p>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="bg-emerald-50 text-emerald-900 rounded-2xl p-6 text-center space-y-3 border border-emerald-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-base">OPD Appointment Request Submitted!</h4>
                <div className="text-xs space-y-1">
                  <p><strong>Appointment No:</strong> <span className="font-mono">{bookingSuccess.appointmentNo}</span></p>
                  <p><strong>Initial Status:</strong> <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">PENDING</span></p>
                  <p><strong>Date & Slot:</strong> {appointmentDate} at {bookingSuccess.timeSlot}</p>
                </div>
                <p className="text-xs text-slate-600 pt-2">
                  Hospital staff will review your request. You can check the approval status in your Patient Dashboard.
                </p>
                <div className="pt-2">
                  <Link
                    to="/dashboard"
                    className="inline-block px-5 py-2 bg-health-700 text-white rounded-xl text-xs font-bold"
                  >
                    Go to Patient Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                
                {bookingError && (
                  <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs font-medium border border-red-200">
                    {bookingError}
                  </div>
                )}

                {/* Doctor Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Doctor</label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-health-500"
                  >
                    <option value="">-- Choose Specialist Doctor --</option>
                    {allDoctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.user.name} ({doc.specialization}) - {doc.consultationFee === 0 ? 'Free OPD' : `₹${doc.consultationFee}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-health-500"
                  />
                </div>

                {/* Live Slot Grid */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Available Time Slots</label>
                  {slotsLoading ? (
                    <div className="p-4 text-center text-xs text-slate-400">Loading doctor schedules...</div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`py-2 px-1 text-center rounded-xl text-xs font-mono font-bold transition ${
                            !slot.isAvailable
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                              : selectedSlot === slot.time
                              ? 'bg-health-700 text-white shadow-sm ring-2 ring-health-500'
                              : 'bg-slate-50 hover:bg-health-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                      Please select a doctor and date to view working OPD slots.
                    </div>
                  )}
                </div>

                {/* Symptoms / Chief Complaint */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Symptoms / Reason for Visit</label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Brief description of symptoms, prior medications, or reason for OPD consult..."
                    rows={2}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-health-500"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingSubmitting || !selectedSlot}
                    className="flex-1 py-2.5 rounded-xl bg-health-700 hover:bg-health-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition"
                  >
                    {bookingSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
