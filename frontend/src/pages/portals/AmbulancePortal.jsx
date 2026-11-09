import React, { useState, useEffect } from 'react';
import { Ambulance, PhoneCall, MapPin, CheckCircle2, Clock, Navigation, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AmbulancePortal() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ambulances/requests');
      if (res.data?.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load ambulance requests:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.put(`/ambulances/requests/${id}/status`, { status });
      if (res.data?.success) {
        fetchRequests();
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-red-600 mx-auto" />
        <p className="text-sm text-slate-500">Connecting to Mobile Ambulance Dispatch Network...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-rose-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
            <Ambulance className="w-4 h-4" />
            <span>Emergency Paramedic Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Mobile Ambulance Dispatch Unit
          </h1>
          <p className="text-xs text-red-100">
            Pilot: {user?.name} • Service: {user?.ambulanceProvider?.serviceName || 'CATS Mobile EMS Unit'} • Vehicle No: <span className="font-mono font-bold">{user?.ambulanceProvider?.vehicleNo || 'DL-1T-AA-1022'}</span>
          </p>
        </div>

        <button
          onClick={fetchRequests}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Broadcast Queue</span>
        </button>
      </div>

      {/* Requests Dispatch List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Urgent Dispatch Broadcasts</h2>
            <p className="text-xs text-slate-500">Incoming patient transport requests requiring paramedic pickup</p>
          </div>
          <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
            {requests.length} Requests Active
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No active ambulance requests in queue.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => (
              <div key={r.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-800">{r.requestNo}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === 'REQUESTED' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                      r.status === 'ACCEPTED' ? 'bg-sky-100 text-sky-800' :
                      r.status === 'DISPATCHED' ? 'bg-purple-100 text-purple-800' :
                      r.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{r.patientName}</h3>
                  <p className="text-xs text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                    <span><strong>Pickup Location:</strong> {r.pickupAddress}</span>
                  </p>
                  
                  {r.destinationHospital && (
                    <p className="text-xs text-slate-500">
                      Destination Hospital: <strong>{r.destinationHospital.name}</strong>
                    </p>
                  )}

                  {r.emergencyDetails && (
                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 italic">
                      "{r.emergencyDetails}"
                    </p>
                  )}

                  {/* Patient Phone (Revealed once accepted or if provider is assigned) */}
                  <div className="pt-1 text-xs">
                    <span className="text-slate-500">Patient Phone: </span>
                    <span className="font-mono font-bold text-health-700">{r.patientPhone}</span>
                  </div>
                </div>

                {/* State Machine Action Controls */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-2 min-w-[180px]">
                  {r.status === 'REQUESTED' && (
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'ACCEPTED')}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    >
                      Accept & Assign Unit
                    </button>
                  )}

                  {r.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'DISPATCHED')}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    >
                      Mark Dispatched (En Route)
                    </button>
                  )}

                  {r.status === 'DISPATCHED' && (
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'COMPLETED')}
                      className="px-4 py-2.5 bg-health-700 hover:bg-health-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    >
                      Arrived & Completed
                    </button>
                  )}

                  {r.pickupLat && r.pickupLng && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${r.pickupLat},${r.pickupLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition text-center flex items-center justify-center gap-1.5"
                    >
                      <Navigation className="w-3.5 h-3.5 text-health-600" />
                      <span>GPS Navigation</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
