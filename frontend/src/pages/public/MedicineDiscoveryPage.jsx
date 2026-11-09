import React, { useState, useEffect } from 'react';
import { Pill, Search, MapPin, CheckCircle2, XCircle, Phone, RefreshCw, AlertCircle, ShoppingBag } from 'lucide-react';
import api from '../../services/api';

export default function MedicineDiscoveryPage() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, [category, inStockOnly]);

  const fetchMedicines = async (overrideSearch) => {
    setLoading(true);
    try {
      const params = {
        search: overrideSearch !== undefined ? overrideSearch : search || undefined,
        category: category || undefined,
        city: city || undefined,
        inStockOnly: inStockOnly ? 'true' : undefined,
      };

      const res = await api.get('/pharmacies/medicines', { params });
      if (res.data?.success) {
        setMedicines(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load medicines:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Analgesics / Fever',
    'Antibiotics',
    'Antidiabetic',
    'Cardiovascular',
    'Antihistamines',
    'Gastrointestinal',
    'Electrolytes',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Essential Medicine & Pharmacy Discovery</h1>
        <p className="text-xs text-slate-500 mt-1">
          Search real-time inventory and pricing across verified hospital pharmacies and licensed Jan Aushadhi Kendras
        </p>
      </div>

      {/* Search & Filter Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchMedicines(search);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by brand name or salt (e.g. Paracetamol, Metformin, Augmentin)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-health-500"
            />
          </div>

          <div className="w-full sm:w-48 relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City (e.g. New Delhi)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-health-500"
            />
          </div>

          <button
            type="submit"
            className="bg-health-700 hover:bg-health-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition"
          >
            Search Stock
          </button>
        </form>

        {/* Category Pills & Stock Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCategory('')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                category === '' ? 'bg-health-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c === category ? '' : c)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  category === c ? 'bg-health-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded text-health-600 focus:ring-health-500 w-4 h-4"
            />
            <span>In-Stock Only</span>
          </label>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-soft space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-health-600 mx-auto" />
          <p className="text-sm text-slate-500">Checking verified pharmacy inventories...</p>
        </div>
      ) : medicines.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-soft space-y-2">
          <Pill className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No medicines found matching your criteria</h3>
          <p className="text-xs text-slate-500">Try modifying search keywords or clearing active filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medicines.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft flex flex-col justify-between hover:border-health-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    {m.category}
                  </span>
                  {m.inStock ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{m.stockQuantity} in stock</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Out of stock</span>
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                  {m.medicineName}
                </h3>

                <div className="text-xl font-extrabold text-slate-900 font-mono">
                  ₹{m.unitPrice.toFixed(2)}
                  <span className="text-xs text-slate-400 font-normal font-sans ml-1">per strip / unit</span>
                </div>

                {m.batchNo && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    Batch: {m.batchNo} {m.expiryDate && `• Exp: ${new Date(m.expiryDate).toLocaleDateString()}`}
                  </p>
                )}
              </div>

              {/* Pharmacy info */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Available At:</span>
                  <p className="font-bold text-slate-800">{m.pharmacy.name}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{m.pharmacy.address}, {m.pharmacy.city}</p>
                </div>

                <a
                  href={`tel:${m.pharmacy.phone}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold transition"
                >
                  <Phone className="w-3.5 h-3.5 text-health-600" />
                  <span>Call Pharmacy: {m.pharmacy.phone}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
