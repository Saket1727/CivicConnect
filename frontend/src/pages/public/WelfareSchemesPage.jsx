import React, { useState, useEffect } from 'react';
import { FileText, ExternalLink, ShieldCheck, CheckCircle2, ArrowRight, Search, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export default function WelfareSchemesPage() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchSchemes();
  }, [category]);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const params = {
        category: category || undefined,
        search: search || undefined,
      };
      const res = await api.get('/schemes', { params });
      if (res.data?.success) {
        setSchemes(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load schemes:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Government Healthcare Welfare Schemes</h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore official Central and State financial protection schemes, eligibility guidelines, and application links
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by scheme name or keywords (e.g. PM-JAY, CGHS, Motherhood)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-health-500"
          />
        </div>

        <button
          onClick={() => fetchSchemes()}
          className="bg-health-700 hover:bg-health-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition"
        >
          Search Schemes
        </button>
      </div>

      {/* Schemes Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-soft space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-health-600 mx-auto" />
          <p className="text-sm text-slate-500">Retrieving welfare schemes...</p>
        </div>
      ) : schemes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-soft">
          <p className="font-bold text-slate-800 text-sm">No welfare schemes found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schemes.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft flex flex-col justify-between hover:border-health-300 transition space-y-4"
            >
              <div className="space-y-3">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                  {s.category}
                </span>

                <h3 className="font-extrabold text-slate-900 text-lg leading-snug">
                  {s.name}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {s.description}
                </p>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block">Eligibility:</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{s.eligibility}</p>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-700 block">Benefits:</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{s.benefits}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Required Documents:</span>
                    <p className="text-slate-600 text-[11px] font-mono">{s.documentsRequired}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <a
                  href={s.officialPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-health-700 hover:bg-health-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  <span>Apply on Official Government Portal</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
