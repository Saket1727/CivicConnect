import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Bed, 
  Calendar, 
  UserCheck, 
  HeartPulse, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Clock, 
  Phone, 
  RefreshCw,
  BarChart2,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProvenanceBadge from '../../components/common/ProvenanceBadge';

export default function HospitalAdminDashboard() {
  const { user } = useAuth();

  const [hospital, setHospital] = useState(null);
  const [beds, setBeds] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bed Editing Modal
  const [editBedModalOpen, setEditBedModalOpen] = useState(false);
  const [bedFormData, setBedFormData] = useState({ category: 'ICU', totalBeds: 0, occupiedBeds: 0 });
  const [bedSaving, setBedSaving] = useState(false);

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Status Filter for Appointments
  const [apptStatusFilter, setApptStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchHospitalData();
  }, []);

  const fetchHospitalData = async () => {
    setLoading(true);
    try {
      // 1. Get managed hospital
      const profileRes = await api.get('/auth/profile');
      const managedHosp = profileRes.data?.data?.hospital;
      
      let hospId = managedHosp?.id;
      if (!hospId) {
        // Fallback to first verified hospital for demonstration
        const allHosp = await api.get('/hospitals');
        hospId = allHosp.data?.data?.[0]?.id;
      }

      if (hospId) {
        const [hospDetails, appts, emg, rep] = await Promise.all([
          api.get(`/hospitals/${hospId}`),
          api.get('/appointments/hospital'),
          api.get('/emergency/queue'),
          api.get(`/admin/hospital-reports/${hospId}`).catch(() => null),
        ]);

        if (hospDetails.data?.success) {
          setHospital(hospDetails.data.data);
          setBeds(hospDetails.data.data.beds || []);
        }
        if (appts.data?.success) {
          setAppointments(appts.data.data);
        }
        if (emg.data?.success) {
          setEmergencies(emg.data.data);
        }
        if (rep?.data?.success) {
          setReports(rep.data.data);
        }
      }
    } catch (err) {
      console.warn('Hospital dashboard fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBed = async (e) => {
    e.preventDefault();
    if (!hospital) return;

    setBedSaving(true);
    try {
      const res = await api.put(`/hospitals/${hospital.id}/beds`, bedFormData);
      if (res.data?.success) {
        setEditBedModalOpen(false);
        fetchHospitalData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update bed counts');
    } finally {
      setBedSaving(false);
    }
  };

  const handleApptAction = async (apptId, status, reason) => {
    try {
      const res = await api.put(`/appointments/${apptId}/status`, {
        status,
        rejectionReason: reason || undefined,
      });
      if (res.data?.success) {
        setRejectModalOpen(false);
        fetchHospitalData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update appointment');
    }
  };

  const handleEmergencyStatus = async (emgId, status) => {
    try {
      const res = await api.put(`/emergency/${emgId}/status`, { status });
      if (res.data?.success) {
        fetchHospitalData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update emergency status');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-health-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading hospital administration console...</p>
      </div>
    );
  }

  const filteredAppts = apptStatusFilter === 'ALL'
    ? appointments
    : appointments.filter(a => a.status === apptStatusFilter);

  // Bed metrics
  const totalBedsCount = beds.reduce((acc, b) => acc + b.totalBeds, 0);
  const occupiedBedsCount = beds.reduce((acc, b) => acc + b.occupiedBeds, 0);
  const availableBedsCount = beds.reduce((acc, b) => acc + b.availableBeds, 0);

  // Chart data
  const chartData = beds.map(b => ({
    name: b.category,
    Total: b.totalBeds,
    Occupied: b.occupiedBeds,
    Available: b.availableBeds,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ProvenanceBadge provenance={hospital?.provenance} isSimulated={hospital?.isSimulated} />
            <span className="text-xs font-bold text-slate-500 uppercase">{hospital?.type}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {hospital?.name || 'Hospital Administration'}
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Registration: {hospital?.registrationNo} • Emergency Desk: {hospital?.emergencyPhone || hospital?.phone}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setBedFormData({ category: 'ICU', totalBeds: 45, occupiedBeds: 36 });
              setEditBedModalOpen(true);
            }}
            className="px-4 py-2.5 bg-health-700 hover:bg-health-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Bed className="w-4 h-4" />
            <span>Update Bed Inventory</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft space-y-1">
          <span className="text-xs text-slate-500 font-medium">Available Beds</span>
          <div className="text-3xl font-extrabold text-emerald-600 font-mono">{availableBedsCount}</div>
          <span className="text-[11px] text-slate-400">Out of {totalBedsCount} Total Beds</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft space-y-1">
          <span className="text-xs text-slate-500 font-medium">Pending OPD Requests</span>
          <div className="text-3xl font-extrabold text-amber-600 font-mono">
            {appointments.filter(a => a.status === 'PENDING').length}
          </div>
          <span className="text-[11px] text-slate-400">Awaiting Doctor / Staff Review</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft space-y-1">
          <span className="text-xs text-slate-500 font-medium">Active Emergency Triage</span>
          <div className="text-3xl font-extrabold text-red-600 font-mono">
            {emergencies.filter(e => e.status !== 'DISCHARGED').length}
          </div>
          <span className="text-[11px] text-slate-400">Trauma Desk Incoming</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft space-y-1">
          <span className="text-xs text-slate-500 font-medium">Bed Occupancy Rate</span>
          <div className="text-3xl font-extrabold text-health-700 font-mono">
            {totalBedsCount > 0 ? ((occupiedBedsCount / totalBedsCount) * 100).toFixed(0) : 0}%
          </div>
          <span className="text-[11px] text-slate-400">{occupiedBedsCount} Occupied Beds</span>
        </div>
      </div>

      {/* Bed Category Table & Recharts Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Beds Table */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bed className="w-5 h-5 text-health-600" />
                <span>Bed Allocation & Occupancy Controller</span>
              </h2>
              <p className="text-xs text-slate-500">Available Beds = Total Beds - Occupied Beds</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Occupied</th>
                  <th className="p-3">Available</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {beds.map((b) => (
                  <tr key={b.category} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800">{b.category}</td>
                    <td className="p-3 font-mono font-medium">{b.totalBeds}</td>
                    <td className="p-3 font-mono text-red-600 font-medium">{b.occupiedBeds}</td>
                    <td className="p-3 font-mono font-extrabold text-emerald-600 text-sm">{b.availableBeds}</td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setBedFormData({ category: b.category, totalBeds: b.totalBeds, occupiedBeds: b.occupiedBeds });
                          setEditBedModalOpen(true);
                        }}
                        className="text-health-700 hover:underline font-semibold"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recharts Bed Visualization */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-health-600" />
              <span>Real-Time Bed Distribution</span>
            </h3>
            <p className="text-[11px] text-slate-500">Occupied vs Available Capacity</p>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Available" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Occupied" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* OPD Appointment Review Queue */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-health-600" />
              <span>OPD Appointment Review & Confirmation Queue</span>
            </h2>
            <p className="text-xs text-slate-500">Decide ACCEPT or REJECT on incoming patient appointment requests</p>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 text-xs font-semibold">
            {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setApptStatusFilter(st)}
                className={`px-3 py-1 rounded-lg transition ${
                  apptStatusFilter === st
                    ? 'bg-health-700 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filteredAppts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No appointment records found matching filter "{apptStatusFilter}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Appt No</th>
                  <th className="p-3">Patient Name</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Date & Slot</th>
                  <th className="p-3">Symptoms</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-slate-800">{a.appointmentNo}</td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{a.patientUser?.name}</span>
                      <span className="text-[11px] text-slate-400">{a.patientUser?.phone}</span>
                    </td>
                    <td className="p-3 font-medium text-slate-700">{a.doctor?.user?.name}</td>
                    <td className="p-3 font-medium">
                      {new Date(a.appointmentDate).toLocaleDateString()} at {a.timeSlot}
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{a.symptoms || '--'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        a.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                        a.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        a.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      {a.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleApptAction(a.id, 'ACCEPTED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => {
                              setSelectedApptId(a.id);
                              setRejectionReason('');
                              setRejectModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Actioned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Emergency OPD Triage Queue */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-red-600" />
              <span>Incoming Emergency OPD Triage Queue</span>
            </h2>
            <p className="text-xs text-slate-500">Prioritized by clinical triage code (Critical / High / Medium)</p>
          </div>
        </div>

        {emergencies.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No active emergency triage registrations reported.
          </div>
        ) : (
          <div className="space-y-3">
            {emergencies.map((e) => (
              <div key={e.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs">{e.emergencyNo}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      e.triagePriority === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse' :
                      e.triagePriority === 'HIGH' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {e.triagePriority}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase bg-white px-2 py-0.5 rounded border border-slate-200">
                      {e.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{e.patientName} (Age: {e.age || '--'})</h4>
                  <p className="text-xs font-semibold text-red-700">{e.emergencyType}</p>
                  <p className="text-xs text-slate-500">{e.description}</p>
                  <p className="text-[11px] text-slate-400">
                    Contact: {e.patientPhone} {e.emergencyContactName && `• Next of Kin: ${e.emergencyContactName} (${e.emergencyContactPhone})`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {e.status === 'REPORTED' && (
                    <button
                      onClick={() => handleEmergencyStatus(e.id, 'TRIAGED')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      Mark Triaged
                    </button>
                  )}
                  {e.status === 'TRIAGED' && (
                    <button
                      onClick={() => handleEmergencyStatus(e.id, 'ADMITTED')}
                      className="px-3 py-1.5 bg-health-700 hover:bg-health-800 text-white font-bold text-xs rounded-xl transition"
                    >
                      Admit Patient
                    </button>
                  )}
                  {e.status === 'ADMITTED' && (
                    <button
                      onClick={() => handleEmergencyStatus(e.id, 'DISCHARGED')}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                    >
                      Discharge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bed Adjust Modal */}
      {editBedModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Update {bedFormData.category} Bed Allocation</h3>
            
            <form onSubmit={handleUpdateBed} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={bedFormData.category}
                  onChange={(e) => {
                    const found = beds.find(b => b.category === e.target.value);
                    setBedFormData({
                      category: e.target.value,
                      totalBeds: found ? found.totalBeds : 0,
                      occupiedBeds: found ? found.occupiedBeds : 0,
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  {['GENERAL', 'ICU', 'EMERGENCY', 'OXYGEN', 'PEDIATRIC'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Beds</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={bedFormData.totalBeds}
                  onChange={(e) => setBedFormData({ ...bedFormData, totalBeds: parseInt(e.target.value, 10) || 0 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Occupied Beds</label>
                <input
                  type="number"
                  min="0"
                  max={bedFormData.totalBeds}
                  required
                  value={bedFormData.occupiedBeds}
                  onChange={(e) => setBedFormData({ ...bedFormData, occupiedBeds: parseInt(e.target.value, 10) || 0 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex justify-between">
                <span>Calculated Available Beds:</span>
                <span className="font-extrabold font-mono text-sm">
                  {Math.max(0, bedFormData.totalBeds - bedFormData.occupiedBeds)}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditBedModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bedSaving}
                  className="flex-1 py-2 rounded-xl bg-health-700 hover:bg-health-800 text-white text-xs font-bold shadow-sm"
                >
                  {bedSaving ? 'Saving...' : 'Save Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Reject Appointment Request</h3>
            <p className="text-xs text-slate-500">Provide an optional reason explaining doctor absence, slot conflict, or alternate clinic.</p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Doctor called for emergency surgery, please re-book on Thursday morning."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApptAction(selectedApptId, 'REJECTED', rejectionReason)}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
