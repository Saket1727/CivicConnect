import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  Bed, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Lock, 
  RefreshCw,
  Search,
  Eye
} from 'lucide-react';
import api from '../../services/api';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'verifications', 'users', 'logs'

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, verifRes, usersRes, logsRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/verifications'),
        api.get('/admin/users'),
        api.get('/admin/logs'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data?.success) {
        setStats(statsRes.value.data.data);
      }
      if (verifRes.status === 'fulfilled' && verifRes.value.data?.success) {
        setPendingVerifications(verifRes.value.data.data);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.data?.success) {
        setUsersList(usersRes.value.data.data);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value.data?.success) {
        setAuditLogs(logsRes.value.data.data);
      }
    } catch (err) {
      console.warn('Admin data load failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (hospId, status) => {
    try {
      const res = await api.put(`/admin/verifications/${hospId}`, { status });
      if (res.data?.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update hospital status');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-health-600 mx-auto" />
        <p className="text-sm text-slate-500">Connecting to National Healthcare Platform Command Center...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* SuperAdmin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>National Platform Command Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Super Administrator</h1>
          <p className="text-xs text-slate-400">
            Platform-wide governance, hospital verification queue, and regulatory audit compliance
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-1 bg-slate-800 p-1.5 rounded-2xl border border-slate-700 text-xs font-semibold">
          {[
            { id: 'overview', label: 'Platform Stats' },
            { id: 'verifications', label: `Pending Reviews (${pendingVerifications.length})` },
            { id: 'users', label: 'User Directory' },
            { id: 'logs', label: 'Security Audit Logs' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 rounded-xl transition ${
                activeTab === t.id ? 'bg-health-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Overview Platform Stats */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft">
              <span className="text-xs text-slate-500 font-medium">Total Registered Users</span>
              <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">{stats.users.total}</div>
              <span className="text-[11px] text-slate-400">Citizens, Doctors, Admins</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft">
              <span className="text-xs text-slate-500 font-medium">Verified Hospitals</span>
              <div className="text-3xl font-extrabold text-emerald-600 font-mono mt-1">{stats.hospitals.verified}</div>
              <span className="text-[11px] text-slate-400">{stats.hospitals.pending} Pending Reviews</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft">
              <span className="text-xs text-slate-500 font-medium">Beds Monitored</span>
              <div className="text-3xl font-extrabold text-health-700 font-mono mt-1">{stats.beds.total}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">{stats.beds.available} Available Now</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft">
              <span className="text-xs text-slate-500 font-medium">Blood Units Verified</span>
              <div className="text-3xl font-extrabold text-red-600 font-mono mt-1">{stats.bloodBanks.totalUnits}</div>
              <span className="text-[11px] text-slate-400">In {stats.bloodBanks.total} Blood Banks</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-3">
              <h3 className="font-bold text-sm text-slate-900">OPD Appointments Volume</h3>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">TOTAL</span>
                  <span className="font-mono font-extrabold text-lg">{stats.appointments.total}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-900">
                  <span className="text-amber-600 block text-[10px]">PENDING</span>
                  <span className="font-mono font-extrabold text-lg">{stats.appointments.breakdown?.PENDING || 0}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                  <span className="text-emerald-600 block text-[10px]">ACCEPTED</span>
                  <span className="font-mono font-extrabold text-lg">{stats.appointments.breakdown?.ACCEPTED || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Emergency & Ambulance Telemetry</h3>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-red-900">
                  <span className="text-red-600 block text-[10px]">EMERGENCIES</span>
                  <span className="font-mono font-extrabold text-lg">{stats.emergency.total}</span>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-purple-900">
                  <span className="text-purple-600 block text-[10px]">AMBULANCE DISPATCH</span>
                  <span className="font-mono font-extrabold text-lg">{stats.ambulances.totalRequests}</span>
                </div>
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-teal-900">
                  <span className="text-teal-600 block text-[10px]">CIVIC COMPLAINTS</span>
                  <span className="font-mono font-extrabold text-lg">{stats.civicComplaints.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Hospital Verification Queue */}
      {activeTab === 'verifications' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pending Healthcare Organization Verifications</h2>
              <p className="text-xs text-slate-500">Unverified institutions cannot publish live availability or OPD bookings to citizens</p>
            </div>
          </div>

          {pendingVerifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No hospital registrations currently pending review. All submissions verified.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingVerifications.map((h) => (
                <div key={h.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {h.status}
                      </span>
                      <span className="font-mono text-xs text-slate-500">Reg: {h.registrationNo}</span>
                      <span className="text-[10px] font-bold uppercase text-slate-400">{h.type}</span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900">{h.name}</h3>
                    <p className="text-xs text-slate-600">{h.address}, {h.city}, {h.state} {h.pincode}</p>
                    <p className="text-[11px] text-slate-500">
                      Applicant: {h.adminUser?.name} ({h.adminUser?.email} • {h.adminUser?.phone})
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerification(h.id, 'VERIFIED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    >
                      Approve & Verify
                    </button>
                    <button
                      onClick={() => handleVerification(h.id, 'REJECTED')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    >
                      Reject Application
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: User Directory */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-xl font-bold text-slate-900">User Accounts Directory</h2>
            <p className="text-xs text-slate-500">RBAC role assignments across national healthcare network</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Registered Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3 text-slate-600">{u.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{u.phone || '--'}</td>
                    <td className="p-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Security Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-xl font-bold text-slate-900">Platform Security Audit Trail</h2>
            <p className="text-xs text-slate-500">Immutable audit logs recording sensitive clinical and administrative operations</p>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target Entity</th>
                  <th className="p-3">Actor Email</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-3 font-bold text-health-700">{log.action}</td>
                    <td className="p-3 text-slate-800">{log.entity}</td>
                    <td className="p-3 text-slate-600">{log.user?.email || 'System / Anonymous'}</td>
                    <td className="p-3 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
