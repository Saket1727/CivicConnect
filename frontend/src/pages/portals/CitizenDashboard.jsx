import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  FileText, 
  Ambulance, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Heart, 
  RefreshCw,
  Plus
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import WeatherWidget from '../../components/common/WeatherWidget';
import { Link } from 'react-router-dom';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [medicalProfile, setMedicalProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [ambulanceRequests, setAmbulanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [profileRes, apptRes, ambRes] = await Promise.allSettled([
        api.get('/patients/me'),
        api.get('/appointments/my'),
        api.get('/ambulances/requests'),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value.data?.success) {
        setMedicalProfile(profileRes.value.data.data);
      }
      if (apptRes.status === 'fulfilled' && apptRes.value.data?.success) {
        setAppointments(apptRes.value.data.data);
      }
      if (ambRes.status === 'fulfilled' && ambRes.value.data?.success) {
        setAmbulanceRequests(ambRes.value.data.data);
      }
    } catch (err) {
      console.warn('Dashboard data fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment request?')) return;
    try {
      const res = await api.put(`/appointments/${id}/status`, { status: 'CANCELLED' });
      if (res.data?.success) {
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">PENDING REVIEW</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">CONFIRMED (ACCEPTED)</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">REJECTED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">CANCELLED</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">COMPLETED</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-health-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading your personal health portal...</p>
      </div>
    );
  }

  const profile = medicalProfile?.profile;
  const records = medicalProfile?.medicalRecords || [];
  const prescriptions = medicalProfile?.prescriptions || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome & Overview Header */}
      <div className="bg-gradient-to-r from-health-900 via-health-800 to-health-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-sky-200 uppercase tracking-wider">Citizen Medical Dashboard</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs text-sky-100">
            Emergency Health ID: <span className="font-mono font-bold">{user?.id?.slice(0, 8)}</span> • Phone: {user?.phone || 'Not set'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/hospitals"
            className="px-4 py-2.5 bg-white text-health-800 hover:bg-sky-50 font-bold text-xs rounded-xl shadow-md transition"
          >
            Find Hospital & Book OPD
          </Link>
          <Link
            to="/emergency-register"
            className="px-4 py-2.5 bg-emergency-600 hover:bg-emergency-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Emergency OPD</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Appointments & Medical History) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Upcoming & Recent Appointments */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-health-600" />
                <span>OPD Appointment Requests</span>
              </h2>
              <Link to="/hospitals" className="text-xs font-bold text-health-700 hover:underline">
                + New Appointment
              </Link>
            </div>

            {appointments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                You have no scheduled appointments. Use "Discover Hospitals" to request a specialist consultation.
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((a) => (
                  <div key={a.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-800">{a.appointmentNo}</span>
                        {getStatusBadge(a.status)}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{a.doctor?.user?.name} ({a.doctor?.department?.name})</h4>
                      <p className="text-xs text-slate-600 font-medium">{a.hospital?.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Date: <strong>{new Date(a.appointmentDate).toLocaleDateString()}</strong> at <strong>{a.timeSlot}</strong>
                      </p>
                      {a.symptoms && (
                        <p className="text-[11px] text-slate-500 italic">"{a.symptoms}"</p>
                      )}
                      {a.rejectionReason && (
                        <p className="text-[11px] text-red-600 font-medium">Rejection Reason: {a.rejectionReason}</p>
                      )}
                    </div>

                    {a.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelAppointment(a.id)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clinical Encounters & Prescriptions */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-health-600" />
                <span>Verified Medical Records & Prescriptions</span>
              </h2>
              <p className="text-xs text-slate-500">Only authorized healthcare doctors can record and sign clinical diagnoses</p>
            </div>

            {records.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No hospital encounter records on file. Complete an OPD consultation to record diagnostic summaries.
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((r) => (
                  <div key={r.id} className="border border-slate-200 rounded-2xl p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div>
                        <span className="font-bold text-sm text-slate-900 block">{r.diagnosis}</span>
                        <span className="text-[11px] text-slate-500">{r.hospital?.name} • Dr. {r.doctor?.user?.name}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {new Date(r.visitDate).toLocaleDateString()}
                      </span>
                    </div>

                    {r.clinicalNotes && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {r.clinicalNotes}
                      </p>
                    )}

                    {/* Prescriptions */}
                    {r.prescriptions && r.prescriptions.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-xs font-bold text-slate-700 block">Prescribed Medicines:</span>
                        {r.prescriptions.map((p) => (
                          <div key={p.id} className="space-y-1">
                            {p.items?.map((item) => (
                              <div key={item.id} className="flex justify-between items-center text-xs bg-health-50/50 p-2 rounded-lg border border-health-100">
                                <span className="font-bold text-slate-800">{item.medicineName} ({item.dosage})</span>
                                <span className="font-mono text-slate-600">{item.frequency} for {item.durationDays} days</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Profile & Environmental Card) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Personal Medical Profile */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-health-600" />
              <span>Personal Medical Profile</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between pb-1.5 border-b border-slate-50">
                <span className="text-slate-500">Blood Group</span>
                <span className="font-bold text-red-600 font-mono text-sm">{profile?.bloodGroup || 'Not reported'}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-50">
                <span className="text-slate-500">Gender & DOB</span>
                <span className="font-semibold text-slate-800">{profile?.gender || '--'}, {profile?.dob ? new Date(profile.dob).toLocaleDateString() : '--'}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-50">
                <span className="text-slate-500">Emergency Contact</span>
                <span className="font-semibold text-slate-800">{profile?.emergencyContactName || 'None'}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-50">
                <span className="text-slate-500">Emergency Phone</span>
                <span className="font-mono font-bold text-health-700">{profile?.emergencyContactPhone || '--'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Allergies:</span>
                <span className="p-2 rounded-lg bg-red-50 text-red-800 font-semibold block text-[11px]">
                  {profile?.allergies || 'No known allergies reported'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Chronic Conditions:</span>
                <span className="p-2 rounded-lg bg-amber-50 text-amber-800 font-semibold block text-[11px]">
                  {profile?.chronicConditions || 'None registered'}
                </span>
              </div>
            </div>
          </div>

          {/* Environmental Telemetry Card */}
          <WeatherWidget />

        </div>

      </div>

    </div>
  );
}
