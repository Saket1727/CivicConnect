import React, { useState, useEffect } from 'react';
import { Ambulance, PhoneCall, MapPin, Navigation, Clock, CheckCircle2, AlertCircle, ShieldAlert, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function AmbulanceAssistancePage() {
  const { user, isAuthenticated } = useAuth();

  const [requests, setRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientPhone, setPatientPhone] = useState(user?.phone || '');
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationHospitalId, setDestinationHospitalId] = useState('');
  const [emergencyDetails, setEmergencyDetails] = useState('');
  const [pickupCoords, setPickupCoords] = useState({ lat: 28.5672, lng: 77.2100 });
  const [detecting, setDetecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, [isAuthenticated]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const hospRes = await api.get('/hospitals');
      if (hospRes.data?.success) {
        setHospitals(hospRes.data.data.filter(h => !h.isThirdParty));
      }

      if (isAuthenticated) {
        const reqRes = await api.get('/ambulances/requests');
        if (reqRes.data?.success) {
          setRequests(reqRes.data.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load initial data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetecting(false);
        setPickupCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPickupAddress(`GPS: Lat ${pos.coords.latitude.toFixed(4)}, Lon ${pos.coords.longitude.toFixed(4)}`);
      },
      () => setDetecting(false),
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setNotice({ type: 'error', message: 'Please log in as a citizen to request an ambulance.' });
      return;
    }

    setSubmitting(true);
    setNotice(null);
    try {
      const res = await api.post('/ambulances/request', {
        patientName,
        patientPhone,
        pickupAddress,
        pickupLat: pickupCoords.lat,
        pickupLng: pickupCoords.lng,
        destinationHospitalId: destinationHospitalId || undefined,
        emergencyDetails,
      });

      if (res.data?.success) {
        setNotice({ type: 'success', message: 'Ambulance assistance request broadcasted to active mobile units!' });
        setEmergencyDetails('');
        fetchInitialData();
      }
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to submit ambulance request.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">REQUESTED (Searching)</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">ACCEPTED (En Route)</span>;
      case 'DISPATCHED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">DISPATCHED</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">COMPLETED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">CANCELLED</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Critical Hotline Banner */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Ambulance className="w-8 h-8 text-amber-300 animate-bounce" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Ambulance Emergency Dispatch</h1>
          </div>
          <p className="text-xs sm:text-sm text-red-100 max-w-xl">
            For critical trauma, cardiac arrest, or severe unconsciousness, immediately dial National Emergency Helpline:
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono font-extrabold text-base">
          <a href="tel:108" className="bg-white text-red-700 hover:bg-red-50 px-5 py-3 rounded-2xl shadow-lg transition flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-red-600" />
            <span>108 (Ambulance)</span>
          </a>
          <a href="tel:112" className="bg-amber-400 text-slate-900 hover:bg-amber-300 px-5 py-3 rounded-2xl shadow-lg transition flex items-center gap-2">
            <PhoneCall className="w-5 h-5" />
            <span>112</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Request Form */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Request Mobile Ambulance</h2>
            <p className="text-xs text-slate-500">Alerts certified Basic and Advanced Life Support mobile paramedic units</p>
          </div>

          {notice && (
            <div className={`p-4 rounded-xl text-xs font-semibold ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {notice.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Patient Full Name *</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Full name of patient"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number *</label>
              <input
                type="tel"
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pickup Address / Landmark *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Exact house/building, street, and landmark..."
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detecting}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                  title="Detect GPS coordinates"
                >
                  <Navigation className={`w-4 h-4 text-health-600 ${detecting ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">GPS</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Destination Hospital (Optional)</label>
              <select
                value={destinationHospitalId}
                onChange={(e) => setDestinationHospitalId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value="">-- Nearest Emergency Trauma Centre --</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>{h.name} ({h.city})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Condition Details</label>
              <textarea
                rows={2}
                value={emergencyDetails}
                onChange={(e) => setEmergencyDetails(e.target.value)}
                placeholder="Briefly state symptoms: severe bleeding, difficulty breathing, paralysis, unconscious..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <Ambulance className="w-5 h-5" />
              <span>{submitting ? 'Broadcasting Dispatch Request...' : 'Dispatch Nearest Ambulance'}</span>
            </button>
          </form>
        </div>

        {/* Live Requests Status Tracking */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Your Ambulance Activity</h2>
            <button
              onClick={fetchInitialData}
              className="text-xs text-health-700 font-bold hover:underline"
            >
              Refresh Status
            </button>
          </div>

          {!isAuthenticated ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-soft space-y-3">
              <Ambulance className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-600 font-medium">Please sign in to track your live requests.</p>
              <Link to="/login" className="inline-block px-4 py-2 bg-health-700 text-white rounded-xl text-xs font-bold">
                Sign In
              </Link>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-soft space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-800">No active ambulance requests</p>
              <p className="text-[11px] text-slate-500">Submitted dispatch requests will show real-time paramedic status here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((r) => (
                <div key={r.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-extrabold text-xs text-slate-800">{r.requestNo}</span>
                    {getStatusBadge(r.status)}
                  </div>

                  <div className="text-xs space-y-1">
                    <p><strong>Patient:</strong> {r.patientName} ({r.patientPhone})</p>
                    <p><strong>Pickup:</strong> {r.pickupAddress}</p>
                    {r.destinationHospital && (
                      <p><strong>Destination:</strong> {r.destinationHospital.name}</p>
                    )}
                    {r.emergencyDetails && (
                      <p className="text-slate-500 italic">"{r.emergencyDetails}"</p>
                    )}
                  </div>

                  {r.provider && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-1 mt-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Emergency Unit:</span>
                      <p className="font-bold text-slate-900">{r.provider.serviceName}</p>
                      <p className="text-slate-600">Vehicle No: <span className="font-mono font-semibold">{r.provider.vehicleNo}</span> ({r.provider.vehicleType})</p>
                      <a href={`tel:${r.provider.phone}`} className="inline-flex items-center gap-1 font-bold text-health-700 pt-1">
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Driver Contact: {r.provider.phone}</span>
                      </a>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 pt-1">
                    Logged on {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
