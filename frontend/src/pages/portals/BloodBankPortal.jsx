import React, { useState, useEffect } from 'react';
import { Droplet, Plus, Minus, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function BloodBankPortal() {
  const { user } = useAuth();
  const [bloodBank, setBloodBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingGroup, setUpdatingGroup] = useState(null);

  useEffect(() => {
    fetchBloodBank();
  }, []);

  const fetchBloodBank = async () => {
    setLoading(true);
    try {
      const res = await api.get('/blood-banks');
      if (res.data?.success && res.data.data.length > 0) {
        setBloodBank(res.data.data[0]);
      }
    } catch (err) {
      console.warn('Failed to load blood bank:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustUnits = async (group, delta) => {
    if (!bloodBank) return;
    const currentItem = bloodBank.inventory.find(i => i.bloodGroup === group);
    const currentUnits = currentItem ? currentItem.unitsAvailable : 0;
    const newUnits = Math.max(0, currentUnits + delta);

    setUpdatingGroup(group);
    try {
      const res = await api.put(`/blood-banks/${bloodBank.id}/inventory`, {
        bloodGroup: group,
        unitsAvailable: newUnits,
      });

      if (res.data?.success) {
        // Optimistic UI update
        const updatedInventory = bloodBank.inventory.map(i =>
          i.bloodGroup === group ? { ...i, unitsAvailable: newUnits } : i
        );
        setBloodBank({ ...bloodBank, inventory: updatedInventory });
      }
    } catch (err) {
      alert(err.message || 'Failed to update blood inventory');
    } finally {
      setUpdatingGroup(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-red-600 mx-auto" />
        <p className="text-sm text-slate-500">Connecting to Blood Inventory Management System...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-red-800 to-rose-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
            <Droplet className="w-4 h-4 text-red-300" />
            <span>Blood Bank Official Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {bloodBank?.name || 'National Blood Centre'}
          </h1>
          <p className="text-xs text-red-100 font-mono">
            License No: {bloodBank?.licenseNo} • Location: {bloodBank?.address}, {bloodBank?.city}
          </p>
        </div>

        <button
          onClick={fetchBloodBank}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Blood Inventory Adjuster Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Manage Available Blood Units</h2>
            <p className="text-xs text-slate-500">Adjust real-time donor stock units across all 8 blood groups</p>
          </div>
          <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full font-mono">
            Total Units: {bloodBank?.inventory.reduce((sum, i) => sum + i.unitsAvailable, 0)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {bloodBank?.inventory.map((inv) => (
            <div key={inv.bloodGroup} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-center space-y-3">
              <span className="text-base font-extrabold text-slate-800 font-mono block">
                {inv.bloodGroup}
              </span>
              
              <div className="text-3xl font-extrabold text-red-600 font-mono">
                {inv.unitsAvailable}
              </div>
              <span className="text-[11px] text-slate-400 block">units available</span>

              <div className="flex gap-2 pt-2 justify-center">
                <button
                  onClick={() => handleAdjustUnits(inv.bloodGroup, -1)}
                  disabled={inv.unitsAvailable <= 0 || updatingGroup === inv.bloodGroup}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center text-slate-700 font-bold transition shadow-sm"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleAdjustUnits(inv.bloodGroup, 1)}
                  disabled={updatingGroup === inv.bloodGroup}
                  className="w-10 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center font-bold transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
