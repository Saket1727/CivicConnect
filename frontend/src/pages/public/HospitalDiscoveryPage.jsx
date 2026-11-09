import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Filter, 
  Star, 
  Bed, 
  Phone, 
  ExternalLink, 
  ArrowUpDown, 
  Layers,
  Map as MapIcon,
  List as ListIcon,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import HospitalMap from '../../components/maps/HospitalMap';
import ProvenanceBadge from '../../components/common/ProvenanceBadge';

export default function HospitalDiscoveryPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [hospitals, setHospitals] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [provenance, setProvenance] = useState(searchParams.get('provenance') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'distance');
  const [radiusKm, setRadiusKm] = useState(parseInt(searchParams.get('radiusKm') || '25', 10));

  // Geolocation
  const [userCoords, setUserCoords] = useState(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    return lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : { lat: 28.6139, lng: 77.2090 }; // Default Delhi
  });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'list', 'map'

  useEffect(() => {
    fetchHospitals();
  }, [userCoords, radiusKm, type, provenance, sortBy]);

  const fetchHospitals = async (explicitSearch) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        lat: userCoords.lat,
        lng: userCoords.lng,
        radiusKm,
        type: type || undefined,
        provenance,
        sortBy,
        search: (explicitSearch !== undefined ? explicitSearch : search) || undefined,
        city: city || undefined,
      };

      const res = await api.get('/hospitals', { params });
      if (res.data?.success) {
        setHospitals(res.data.data);
        setMeta(res.data.meta);
      }
    } catch (err) {
      setError(err.message || 'Failed to discover hospitals');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHospitals(search);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectingLocation(false);
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        setDetectingLocation(false);
        alert('Could not detect location. Please search manually by city or PIN code.');
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Geospatial Hospital Discovery</h1>
          <p className="text-xs text-slate-500 mt-1">
            Search verified government & private hospitals, and discover third-party facilities via OpenStreetMap
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              viewMode === 'split' ? 'bg-health-700 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Split View</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              viewMode === 'list' ? 'bg-health-700 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListIcon className="w-4 h-4" />
            <span>List Only</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              viewMode === 'map' ? 'bg-health-700 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>Map Only</span>
          </button>
        </div>
      </div>

      {/* Search & Control Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by hospital name, specialty, or landmark..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-health-500"
            />
          </div>

          <div className="w-full md:w-48 relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City (e.g. Delhi)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-health-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detectingLocation}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <Navigation className={`w-4 h-4 text-health-600 ${detectingLocation ? 'animate-spin' : ''}`} />
              <span>{detectingLocation ? 'Locating...' : 'Near Me'}</span>
            </button>

            <button
              type="submit"
              className="bg-health-700 hover:bg-health-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm transition"
            >
              Search
            </button>
          </div>
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filters:</span>
            </span>

            {/* Ownership */}
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-health-500"
            >
              <option value="">All Ownership Types</option>
              <option value="GOVERNMENT">Government Only</option>
              <option value="PRIVATE">Private Only</option>
            </select>

            {/* Provenance */}
            <select
              value={provenance}
              onChange={(e) => setProvenance(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-health-500"
            >
              <option value="all">All Sources (Verified + OSM)</option>
              <option value="verified">Verified Providers Only</option>
              <option value="simulated">Academic Demo Only</option>
              <option value="osm">OpenStreetMap Only</option>
            </select>

            {/* Radius */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-medium">Radius:</span>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
                className="bg-transparent font-bold text-slate-800 focus:outline-none"
              >
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
              </select>
            </div>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none"
            >
              <option value="distance">Nearest Distance</option>
              <option value="rating">Patient Rating</option>
              <option value="name">Hospital Name</option>
            </select>
          </div>

        </div>

      </div>

      {/* Meta Summary & ODbL Attribution Notice */}
      {meta && (
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-100/70 px-4 py-2 rounded-xl border border-slate-200">
          <div>
            Showing <strong className="text-slate-800">{hospitals.length}</strong> facilities 
            {meta.userCoordinates && ` around (${meta.userCoordinates.latitude.toFixed(2)}, ${meta.userCoordinates.longitude.toFixed(2)})`}
            {' • '}<span className="text-emerald-700 font-medium">{meta.verifiedCount} Verified</span>
            {meta.simulatedCount > 0 && ` • ${meta.simulatedCount} Simulated`}
            {meta.osmCount > 0 && ` • ${meta.osmCount} via OpenStreetMap`}
          </div>
          <div className="text-[11px] text-slate-400">
            Open Database License (ODbL) Attribution
          </div>
        </div>
      )}

      {/* Discovery Main Content */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-soft space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-health-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Discovering Healthcare Facilities...</h3>
          <p className="text-xs text-slate-500">Querying verified database and executing spatial proximity calculations</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-800 rounded-2xl p-8 text-center border border-red-200 space-y-2">
          <AlertCircle className="w-6 h-6 text-red-600 mx-auto" />
          <h3 className="text-sm font-bold">Failed to load facilities</h3>
          <p className="text-xs">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Hospital Cards Column */}
          {(viewMode === 'split' || viewMode === 'list') && (
            <div className={`space-y-4 ${viewMode === 'split' ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
              {hospitals.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-soft space-y-2">
                  <p className="font-bold text-slate-700 text-sm">No healthcare facilities found within this radius.</p>
                  <p className="text-xs text-slate-500">Try expanding the search radius or clearing query filters.</p>
                </div>
              ) : (
                hospitals.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHospital(h)}
                    className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer ${
                      selectedHospital?.id === h.id
                        ? 'border-health-600 shadow-lg ring-1 ring-health-500'
                        : 'border-slate-200 shadow-soft hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <ProvenanceBadge provenance={h.provenance} isSimulated={h.isSimulated} isThirdParty={h.isThirdParty} />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{h.type}</span>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug hover:text-health-700 transition">
                          {h.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {h.address}, {h.city} {h.pincode && `- ${h.pincode}`}
                        </p>
                      </div>

                      {/* Distance & Rating Badges */}
                      <div className="flex items-center gap-3 text-xs">
                        {h.distanceKm !== null && (
                          <span className="inline-flex items-center gap-1 font-bold text-health-800 bg-health-50 px-2 py-0.5 rounded-md">
                            <Navigation className="w-3 h-3 text-health-600" />
                            <span>{h.distanceKm} km away</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{h.rating} ({h.reviewCount} reviews)</span>
                        </span>
                      </div>

                      {/* Bed Summary if Verified */}
                      {h.bedSummary && (
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Available Beds</span>
                            <span className="font-extrabold text-emerald-600 text-sm">{h.bedSummary.availableBeds}</span>
                            <span className="text-slate-400 text-[10px]"> / {h.bedSummary.totalBeds}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">ICU Beds</span>
                            <span className="font-extrabold text-health-700 text-sm">{h.bedSummary.icuAvailable}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Doctors</span>
                            <span className="font-extrabold text-slate-800 text-sm">{h.doctorCount || 4}</span>
                          </div>
                        </div>
                      )}

                      {/* Notice for OSM */}
                      {h.isThirdParty && (
                        <p className="text-[10px] text-slate-400 italic bg-slate-50 p-2 rounded-lg">
                          Third-party node via OpenStreetMap. Real-time bed availability is not claimed for external records.
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition flex items-center justify-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Navigation className="w-3.5 h-3.5 text-health-600" />
                          <span>Directions</span>
                        </a>

                        {!h.isThirdParty && (
                          <Link
                            to={`/hospitals/${h.id}`}
                            className="flex-1 text-center py-2 rounded-xl bg-health-700 hover:bg-health-800 text-white font-bold transition"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Details & OPD
                          </Link>
                        )}
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Map Column */}
          {(viewMode === 'split' || viewMode === 'map') && (
            <div className={`sticky top-20 h-[650px] ${viewMode === 'split' ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
              <HospitalMap
                hospitals={hospitals}
                userLocation={userCoords}
                zoom={12}
                selectedHospitalId={selectedHospital?.id}
                onHospitalSelect={(h) => setSelectedHospital(h)}
              />
            </div>
          )}

        </div>
      )}

    </div>
  );
}
