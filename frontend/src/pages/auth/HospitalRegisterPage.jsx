import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hospital, Building2, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function HospitalRegisterPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    registrationNo: '',
    type: 'GOVERNMENT',
    address: '',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110029',
    latitude: 28.5672,
    longitude: 77.2100,
    phone: '',
    emergencyPhone: '',
    email: '',
    website: '',
  });

  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=/hospital-register');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/hospitals/register', formData);
      if (res.data?.success) {
        setSuccessResult(res.data.data);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Hospital onboarding submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-health-700 flex items-center justify-center text-white mx-auto shadow-md">
          <Building2 className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hospital Provider Onboarding</h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Register your hospital organization on the CivicConnect National Health Discovery Network
        </p>
      </div>

      {successResult ? (
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-soft text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
            STATUS: PENDING_VERIFICATION
          </span>
          <h2 className="text-xl font-extrabold text-slate-900">
            Registration Application Submitted!
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Your hospital registration for <strong>{successResult.name}</strong> has been logged with Registration No: <span className="font-mono font-bold">{successResult.registrationNo}</span>.
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 text-left max-w-md mx-auto space-y-1">
            <p><strong>Integrity Rule:</strong> Availability numbers and public booking will activate once a Super Administrator reviews the institutional credentials.</p>
          </div>
          <div className="pt-2">
            <Link to="/hospitals" className="inline-block px-5 py-2.5 bg-health-700 text-white rounded-xl text-xs font-bold">
              Return to Hospital Discovery
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-soft space-y-5">
          
          {errorMessage && (
            <div className="p-4 bg-red-50 text-red-800 rounded-xl text-xs font-semibold border border-red-200">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hospital Official Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. City Superspeciality Hospital"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-health-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Registration Number *</label>
              <input
                type="text"
                required
                value={formData.registrationNo}
                onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                placeholder="e.g. DL-MED-REG-4421"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-health-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ownership Category *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              >
                <option value="GOVERNMENT">Government / Autonomous Institute</option>
                <option value="PRIVATE">Private Healthcare Organization</option>
                <option value="TRUST">Charitable Trust Hospital</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">General Inquiries Telephone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="011-26588500"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Trauma Hotline</label>
              <input
                type="tel"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                placeholder="Emergency casualty phone"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://hospital.org"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Physical Street Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Building, Road, Sector, Landmark"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-health-700 hover:bg-health-800 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            {loading ? 'Submitting Registration...' : 'Submit Hospital for Verification'}
          </button>
        </form>
      )}

    </div>
  );
}
