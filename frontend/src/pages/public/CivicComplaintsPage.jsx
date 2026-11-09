import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Send, CheckCircle2, Clock, FileText, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function CivicComplaintsPage() {
  const { user, isAuthenticated } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [category, setCategory] = useState('SANITATION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchComplaints();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints');
      if (res.data?.success) {
        setComplaints(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load complaints:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;

    setSubmitting(true);
    setNotice(null);
    try {
      const res = await api.post('/complaints', {
        category,
        title,
        description,
        locationAddress,
      });

      if (res.data?.success) {
        setNotice({ type: 'success', message: 'Civic complaint submitted successfully to Municipal Health Directorate.' });
        setTitle('');
        setDescription('');
        setLocationAddress('');
        fetchComplaints();
      }
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to submit complaint' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">PENDING REVIEW</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">IN PROGRESS</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">RESOLVED</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Civic Public Health Complaint Redressal</h1>
        <p className="text-xs text-slate-500 mt-1">
          Submit municipal sanitation, water supply, sewage overflow, and environmental health issues for official action
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Lodge Complaint Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Lodge Civic Issue</h2>
            <p className="text-xs text-slate-500">Tracked by local municipal health officers and municipal wards</p>
          </div>

          {!isAuthenticated ? (
            <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200 space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-xs text-slate-600 font-semibold">Please sign in as a citizen to file and track municipal grievances.</p>
              <Link to="/login" className="inline-block px-5 py-2 bg-health-700 text-white rounded-xl text-xs font-bold">
                Sign In to File Complaint
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {notice && (
                <div className={`p-4 rounded-xl text-xs font-semibold ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {notice.message}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issue Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-health-500"
                >
                  <option value="SANITATION">Sanitation & Sewage Overflow</option>
                  <option value="PUBLIC_HEALTH">Public Health Hazard / Mosquito Breeding</option>
                  <option value="WATER_SUPPLY">Contaminated Water Supply / Pipeline Burst</option>
                  <option value="WASTE_MANAGEMENT">Bio-Medical or Solid Waste Dumping</option>
                  <option value="ROAD_HAZARD">Accident-Prone Potholes & Road Obstruction</option>
                  <option value="OTHER">Other Municipal Grievance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title / Brief Subject *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sewage blockage outside Primary Health Clinic"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-health-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location Address / Ward Landmark *</label>
                <input
                  type="text"
                  required
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="e.g. Lane 4, Near Sector 9 Community Park, Rohini"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-health-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe how long the issue has persisted, health hazards created, and nearest landmark..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-health-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-health-700 hover:bg-health-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Submit to Municipal Authority'}</span>
              </button>
            </form>
          )}

        </div>

        {/* Complaints List & Redressal Tracking */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Complaints Redressal Queue</h2>
            {isAuthenticated && (
              <button onClick={fetchComplaints} className="text-xs text-health-700 font-bold hover:underline">
                Refresh Queue
              </button>
            )}
          </div>

          {!isAuthenticated ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-soft">
              <p className="text-xs text-slate-500">Sign in to review complaints filed by your account.</p>
            </div>
          ) : loading ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-soft space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-health-600 mx-auto" />
              <p className="text-xs text-slate-500">Retrieving complaint history...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-soft space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="font-bold text-sm text-slate-800">No active grievances logged</p>
              <p className="text-xs text-slate-500">Any civic health issues you lodge will be tracked here in real-time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((c) => (
                <div key={c.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                      {c.category.replace('_', ' ')}
                    </span>
                    {getStatusBadge(c.status)}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-health-600" />
                    <span>{c.locationAddress}</span>
                  </div>

                  {c.resolutionNotes && (
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <span className="font-bold block">Authority Action Note:</span>
                      <p>{c.resolutionNotes}</p>
                      {c.assignedAuthority && (
                        <span className="text-[10px] text-emerald-700 block">Officer: {c.assignedAuthority.name}</span>
                      )}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 pt-1">
                    Filed on {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
