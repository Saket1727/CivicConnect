import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Droplet, Search, MapPin, Phone, Navigation, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import ProvenanceBadge from '../../components/common/ProvenanceBadge';

export default function BloodBankDiscoveryPage() {
  const [searchParams] = useSearchParams();

  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(searchParams.get('bloodGroup') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [search, setSearch] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchBloodBanks();
  }, [selectedGroup, city]);

  const fetchBloodBanks = async () => {
    setLoading(true);
    try {
      const params = {
        bloodGroup: selectedGroup || undefined,
        city: city || undefined,
        search: search || undefined,
      };

      const res = await api.get('/blood-banks', { params });
      if (res.data?.success) {
        setBloodBanks(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load blood banks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Blood Bank & Verified Stock Discovery</h1>
        <p className="text-xs text-slate-500 mt-1">
          Locate registered blood centers across India with live unit counts across all 8 blood groups
        </p>
      </div>

      {/* Filter & Group Selector */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft space-y-4">
        
        {/* Blood Group Chips */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Filter by Blood Group Requirement:</label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {bloodGroups.map((bg) => (
              <button
                key={bg}
                onClick={() => setSelectedGroup(bg === selectedGroup ? '' : bg)}
                className={`py-3 rounded-2xl text-xs font-mono font-extrabold transition shadow-sm border ${
                  selectedGroup === bg
                    ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-400'
                    : 'bg-slate-50 hover:bg-red-50 text-slate-800 border-slate-200 hover:text-red-700'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Droplet className={`w-4 h-4 ${selectedGroup === bg ? 'text-white' : 'text-red-500'}`} />
                  <span>{bg}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* City and Name Search */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by blood bank name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="w-full sm:w-48 relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City (e.g. New Delhi)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            onClick={() => fetchBloodBanks()}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition"
          >
            Search Centers
          </button>
        </div>

      </div>

      {/* Results */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-soft space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-red-600 mx-auto" />
          <p className="text-sm text-slate-500">Checking verified blood bank stock...</p>
        </div>
      ) : bloodBanks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-soft space-y-2">
          <Droplet className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No blood centers matching criteria</h3>
          <p className="text-xs text-slate-500">Try selecting a different blood group or resetting city filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bloodBanks.map((bb) => (
            <div
              key={bb.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft flex flex-col justify-between hover:border-red-300 transition"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <ProvenanceBadge provenance={bb.provenance} isSimulated={bb.isSimulated} />
                  <span className="text-[11px] font-mono text-slate-400">Lic: {bb.licenseNo}</span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{bb.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{bb.address}, {bb.city}</p>
                </div>

                {/* Stock Units Grid */}
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-2">Available Blood Inventory:</span>
                  <div className="grid grid-cols-4 gap-2">
                    {bb.inventory.map((inv) => (
                      <div
                        key={inv.bloodGroup}
                        className={`p-2 rounded-xl text-center border ${
                          selectedGroup === inv.bloodGroup
                            ? 'bg-red-50 border-red-400'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-600 block">{inv.bloodGroup}</span>
                        <span className="text-base font-extrabold text-red-600 font-mono">
                          {inv.unitsAvailable}
                        </span>
                        <span className="text-[10px] text-slate-400 block">units</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Contact */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                <a
                  href={`tel:${bb.phone}`}
                  className="flex-1 text-center py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Blood Center: {bb.phone}</span>
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${bb.latitude},${bb.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition flex items-center justify-center"
                  title="Navigate via GPS"
                >
                  <Navigation className="w-4 h-4 text-health-600" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
