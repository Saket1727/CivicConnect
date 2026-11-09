import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Calendar, 
  FileText, 
  User, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  Trash2, 
  RefreshCw 
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function DoctorDashboard() {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Clinical Encounter Modal State
  const [encounterModalOpen, setEncounterModalOpen] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [medItems, setMedItems] = useState([
    { medicineName: 'Paracetamol 650mg', dosage: '650mg', frequency: '1-0-1', durationDays: 5, instructions: 'After food' },
  ]);
  const [savingRecord, setSavingRecord] = useState(false);

  useEffect(() => {
    fetchDoctorAppointments();
  }, []);

  const fetchDoctorAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments/hospital');
      if (res.data?.success) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load doctor appointments:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApptStatus = async (apptId, status) => {
    try {
      const res = await api.put(`/appointments/${apptId}/status`, { status });
      if (res.data?.success) {
        fetchDoctorAppointments();
      }
    } catch (err) {
      alert(err.message || 'Failed to update appointment');
    }
  };

  const handleAddMedItem = () => {
    setMedItems([...medItems, { medicineName: '', dosage: '500mg', frequency: '1-0-1', durationDays: 5, instructions: 'After food' }]);
  };

  const handleRemoveMedItem = (index) => {
    setMedItems(medItems.filter((_, i) => i !== index));
  };

  const handleMedChange = (index, field, value) => {
    const updated = [...medItems];
    updated[index][field] = value;
    setMedItems(updated);
  };

  const handleSubmitEncounter = async (e) => {
    e.preventDefault();
    if (!activeAppointment) return;

    setSavingRecord(true);
    try {
      const patientId = activeAppointment.patientUserId || activeAppointment.patientUser?.id;
      
      // 1. Create clinical encounter & prescription
      await api.post(`/patients/${patientId}/records`, {
        diagnosis,
        clinicalNotes,
        prescriptionNotes,
        prescriptionItems: medItems,
      });

      // 2. Mark appointment COMPLETED
      await api.put(`/appointments/${activeAppointment.id}/status`, { status: 'COMPLETED' });

      setEncounterModalOpen(false);
      fetchDoctorAppointments();
    } catch (err) {
      alert(err.message || 'Failed to record clinical encounter');
    } finally {
      setSavingRecord(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-health-600 mx-auto" />
        <p className="text-sm text-slate-500">Loading Doctor Clinical Console...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-health-900 via-health-800 to-health-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-200 uppercase tracking-wider">
            <Stethoscope className="w-4 h-4" />
            <span>Doctor Outpatient Clinical Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {user?.name}
          </h1>
          <p className="text-xs text-sky-100">
            Assigned Hospital: <span className="font-semibold">{user?.hospital?.name || 'Medical Centre'}</span> • Specialty: {user?.doctor?.specialization || 'Consultant'}
          </p>
        </div>

        <button
          onClick={fetchDoctorAppointments}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* OPD Appointments Roster */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Today's Assigned OPD Consultations</h2>
            <p className="text-xs text-slate-500">Review patient symptoms, accept/reject, and write electronic prescriptions</p>
          </div>
          <span className="text-xs font-bold text-health-700 bg-health-50 px-3 py-1 rounded-full">
            {appointments.length} Consultations Listed
          </span>
        </div>

        {appointments.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No consultations currently scheduled for your profile.
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((a) => (
              <div
                key={a.id}
                className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-800">{a.appointmentNo}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                      a.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      a.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {a.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900">
                    {a.patientUser?.name}
                    <span className="text-xs font-normal text-slate-500 ml-2">Phone: {a.patientUser?.phone}</span>
                  </h3>

                  <p className="text-xs text-slate-600">
                    Date: <strong>{new Date(a.appointmentDate).toLocaleDateString()}</strong> at <strong>{a.timeSlot}</strong>
                  </p>

                  {a.symptoms && (
                    <p className="text-xs text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-100">
                      <strong>Patient Symptoms:</strong> {a.symptoms}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {a.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApptStatus(a.id, 'ACCEPTED')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                      >
                        Accept OPD Slot
                      </button>
                      <button
                        onClick={() => handleApptStatus(a.id, 'REJECTED')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {a.status === 'ACCEPTED' && (
                    <button
                      onClick={() => {
                        setActiveAppointment(a);
                        setDiagnosis('');
                        setClinicalNotes('');
                        setEncounterModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-health-700 hover:bg-health-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Start Clinical Encounter & Prescribe</span>
                    </button>
                  )}

                  {a.status === 'COMPLETED' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Encounter Completed</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clinical Encounter & Prescription Modal */}
      {encounterModalOpen && activeAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Clinical Encounter Record</h3>
                <p className="text-xs text-slate-500">Patient: <strong>{activeAppointment.patientUser?.name}</strong> • Appt: {activeAppointment.appointmentNo}</p>
              </div>
              <button
                onClick={() => setEncounterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEncounter} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Essential Stage 1 Hypertension with allergic rhinitis"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-health-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Notes & Observations</label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Blood pressure 138/88 mmHg, chest clear on auscultation, advise lifestyle modifications..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              {/* Prescription Items Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Prescription Medicines</label>
                  <button
                    type="button"
                    onClick={handleAddMedItem}
                    className="text-xs font-bold text-health-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                {medItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Medicine Name (e.g. Dolo 650, Telmisartan 40mg)"
                        value={item.medicineName}
                        onChange={(e) => handleMedChange(idx, 'medicineName', e.target.value)}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 500mg)"
                        value={item.dosage}
                        onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                        className="w-24 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      {medItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedItem(idx)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Freq (e.g. 1-0-1)"
                        value={item.frequency}
                        onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Days (e.g. 5)"
                        value={item.durationDays}
                        onChange={(e) => handleMedChange(idx, 'durationDays', parseInt(e.target.value, 10))}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Instructions (e.g. After food)"
                        value={item.instructions}
                        onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">General Prescription Advice / Follow Up</label>
                <input
                  type="text"
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  placeholder="e.g. Review in 15 days with fasting lipid profile report"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEncounterModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRecord}
                  className="flex-1 py-2.5 rounded-xl bg-health-700 hover:bg-health-800 text-white text-xs font-bold shadow-md transition"
                >
                  {savingRecord ? 'Recording Encounter...' : 'Save & Complete Consultation'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
