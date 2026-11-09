import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  HeartPulse, 
  PhoneCall, 
  AlertTriangle, 
  ShieldAlert, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  ArrowRight,
  Clock
} from 'lucide-react';
import api from '../../services/api';

export default function EmergencyRegisterPage() {
  const [searchParams] = useSearchParams();
  const preselectedHospitalId = searchParams.get('hospitalId') || '';

  const [hospitals, setHospitals] = useState([]);
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    age: '',
    emergencyType: 'Cardiac / Acute Chest Pain',
    triagePriority: 'CRITICAL',
    description: '',
    hospitalId: preselectedHospitalId,
    emergencyContactName: '',
    emergencyContactPhone: '',
    latitude: 28.5672,
    longitude: 77.2100,
  });

  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    async function loadHospitals() {
      try {
        const res = await api.get('/hospitals');
        if (res.data?.success) {
          // Filter to verified registered facilities that have trauma facilities
          const verified = res.data.data.filter(h => !h.isThirdParty);
          setHospitals(verified);
          if (!preselectedHospitalId && verified.length > 0) {
            setFormData(prev => ({ ...prev, hospitalId: verified[0].id }));
          }
        }
      } catch (err) {
        console.warn('Failed to load hospitals:', err.message);
      }
    }
    loadHospitals();
  }, [preselectedHospitalId]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetecting(false);
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
      },
      () => setDetecting(false),
      { timeout: 6000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/emergency/register', formData);
      if (res.data?.success) {
        setSubmittedData(res.data.data);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit emergency registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Life Safety Critical Alert Box */}
      <div className="bg-red-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-red-700 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-amber-300 animate-pulse flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Emergency OPD Digital Registration
            </h1>
            <p className="text-xs sm:text-sm text-red-100 font-medium">
              Priority triage notification to hospital trauma & casualty desks
            </p>
          </div>
        </div>

        <div className="bg-red-800/60 rounded-2xl p-4 border border-red-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-red-100 space-y-1">
            <p className="font-bold text-white text-sm">LIFE-THREATENING EMERGENCY?</p>
            <p>Do NOT wait for form confirmation. Dial National Emergency Paramedics immediately:</p>
          </div>
          <div className="flex items-center gap-3 font-mono font-extrabold text-base">
            <a href="tel:108" className="bg-white text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl shadow-md transition flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4" />
              <span>108 (Ambulance)</span>
            </a>
            <a href="tel:112" className="bg-amber-400 text-slate-900 hover:bg-amber-300 px-4 py-2 rounded-xl shadow-md transition flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4" />
              <span>112</span>
            </a>
          </div>
        </div>
      </div>

      {submittedData ? (
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-700 border border-red-300">
              TRIAGE STATUS: {submittedData.status}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Emergency Registration Token: <span className="font-mono text-health-700">{submittedData.emergencyNo}</span>
            </h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              This token has been dispatched to the emergency reception at <strong>{submittedData.hospital?.name}</strong>.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left max-w-md mx-auto space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient Name:</span>
              <span className="font-bold text-slate-800">{submittedData.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Triage Priority:</span>
              <span className="font-bold text-red-600 uppercase">{submittedData.triagePriority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Condition:</span>
              <span className="font-semibold text-slate-800">{submittedData.emergencyType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hospital Emergency Desk:</span>
              <span className="font-bold text-health-700">{submittedData.hospital?.emergencyPhone || submittedData.hospital?.phone}</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <a
              href={`tel:${submittedData.hospital?.emergencyPhone || submittedData.hospital?.phone}`}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Hospital Casualty Desk</span>
            </a>
            <Link
              to="/ambulance"
              className="bg-health-700 hover:bg-health-800 text-white font-bold text-xs px-6 py-3 rounded-xl transition flex items-center gap-2"
            >
              <span>Request Ambulance Transit</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-6">
          
          {errorMessage && (
            <div className="p-4 bg-red-50 text-red-800 rounded-xl text-xs font-semibold border border-red-200">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Patient Full Name *</label>
              <input
                type="text"
                required
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="Full name of patient"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Patient Contact Phone *</label>
              <input
                type="tel"
                required
                value={formData.patientPhone}
                onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Patient age"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Category *</label>
              <select
                value={formData.emergencyType}
                onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="Cardiac / Acute Chest Pain">Cardiac / Acute Chest Pain</option>
                <option value="Severe Trauma / Road Accident">Severe Trauma / Road Accident</option>
                <option value="Severe Respiratory Distress / Asthma">Severe Respiratory Distress / Asthma</option>
                <option value="Stroke / Sudden Facial Droop / Weakness">Stroke / Sudden Facial Droop / Weakness</option>
                <option value="Burns / Chemical Exposure">Burns / Chemical Exposure</option>
                <option value="High Uncontrolled Bleeding">High Uncontrolled Bleeding</option>
                <option value="Pediatric Emergency">Pediatric Emergency</option>
                <option value="Other Acute Emergency">Other Acute Emergency</option>
              </select>
            </div>
          </div>

          {/* Hospital Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Destination Trauma Hospital *</label>
            <select
              value={formData.hospitalId}
              required
              onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">-- Select Receiving Hospital --</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.city}) - {h.type}
                </option>
              ))}
            </select>
          </div>

          {/* Triage Priority Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Triage Urgency Level</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { level: 'CRITICAL', label: 'Critical / Red Code', desc: 'Unconscious, heart attack, major trauma' },
                { level: 'HIGH', label: 'High / Yellow Code', desc: 'Severe fracture, persistent bleeding' },
                { level: 'MEDIUM', label: 'Medium / Green Code', desc: 'Moderate pain, laceration' },
              ].map((p) => (
                <button
                  key={p.level}
                  type="button"
                  onClick={() => setFormData({ ...formData, triagePriority: p.level })}
                  className={`p-3 rounded-2xl border text-left transition ${
                    formData.triagePriority === p.level
                      ? 'border-red-600 bg-red-50 ring-2 ring-red-400'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-bold text-xs text-slate-900 block">{p.label}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bystander / Emergency Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact / Bystander Name</label>
              <input
                type="text"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                placeholder="Family member or bystander"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
              <input
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                placeholder="+91 98765 00000"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Brief Description of Condition</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="State any visible symptoms, prior medical history, or current conscious state..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <HeartPulse className="w-5 h-5 animate-pulse" />
            <span>{loading ? 'Dispatching Triage Alert...' : 'Transmit Emergency Registration'}</span>
          </button>

        </form>
      )}

    </div>
  );
}
