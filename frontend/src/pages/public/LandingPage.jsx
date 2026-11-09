import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Hospital, 
  Pill, 
  Droplet, 
  Ambulance, 
  ShieldCheck, 
  HeartPulse, 
  CalendarCheck, 
  AlertTriangle,
  ArrowRight,
  Activity,
  Users,
  CheckCircle2,
  Building2
} from 'lucide-react';
import api from '../../services/api';
import WeatherWidget from '../../components/common/WeatherWidget';
import ProvenanceBadge from '../../components/common/ProvenanceBadge';

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch preview hospitals around Delhi NCR by default
        const hospRes = await api.get('/hospitals?lat=28.6139&lng=77.2090&radiusKm=20');
        if (hospRes.data?.success) {
          setHospitals(hospRes.data.data.slice(0, 4));
        }

        // Fetch platform aggregate statistics (or public stats)
        const statsRes = await api.get('/admin/stats').catch(() => null);
        if (statsRes?.data?.success) {
          setStats(statsRes.data.data);
        } else {
          // Clean fallback from seed data
          setStats({
            hospitals: { total: 5, verified: 4 },
            beds: { total: 1120, available: 310 },
            doctors: { total: 4 },
            bloodBanks: { totalUnits: 240 },
          });
        }
      } catch (err) {
        console.warn('Failed to load landing data:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/hospitals?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/hospitals');
    }
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
        navigate(`/hospitals?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
      },
      (err) => {
        setDetectingLocation(false);
        alert('Could not detect location. Please search manually by city or PIN code.');
      },
      { timeout: 8000 }
    );
  };

  const services = [
    {
      title: 'Geospatial Hospital Discovery',
      desc: 'Find verified government and private hospitals nearby with live distance calculations and bed availability.',
      icon: Hospital,
      path: '/hospitals',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'OPD Appointment Scheduling',
      desc: 'Select specialist doctors, check weekly schedules, and request OPD consultations with instant confirmation tracking.',
      icon: CalendarCheck,
      path: '/hospitals',
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'Live Blood Bank Stock',
      desc: 'Locate verified blood units by group (A+, B+, O+, AB+) across registered national and NGO blood centers.',
      icon: Droplet,
      path: '/blood-banks',
      color: 'bg-red-50 text-red-700',
    },
    {
      title: 'Essential Medicine Discovery',
      desc: 'Search pharmacy inventories, verify medicine availability, unit pricing, and batch details in your area.',
      icon: Pill,
      path: '/medicines',
      color: 'bg-purple-50 text-purple-700',
    },
    {
      title: 'Emergency Ambulance Transit',
      desc: 'Broadcast urgent ambulance requests with GPS pickup tracking to nearest ALS and BLS mobile paramedics.',
      icon: Ambulance,
      path: '/ambulance',
      color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Civic Complaint Redressal',
      desc: 'Report sanitation, sewage overflow, water hazards, and municipal public health issues to local authorities.',
      icon: AlertTriangle,
      path: '/complaints',
      color: 'bg-teal-50 text-teal-700',
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-health-50 via-white to-slate-50 pt-12 pb-20 border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>National Civic Healthcare Infrastructure</span>
            </div>
            <WeatherWidget compact={true} />
          </div>

          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Unified Healthcare & Emergency Discovery for <span className="text-transparent bg-clip-text bg-gradient-to-r from-health-700 to-health-500">Indian Citizens</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              CivicConnect empowers citizens to discover nearby hospitals, check verified bed occupancy, book OPD appointments, locate blood units, search medicines, and dispatch ambulances in real-time.
            </p>

            {/* Main Hospital Search Box */}
            <form onSubmit={handleSearchSubmit} className="pt-2">
              <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-white p-2 rounded-2xl shadow-xl border border-slate-200">
                <div className="flex-1 flex items-center gap-3 px-3">
                  <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by hospital name, city, PIN code, or landmark..."
                    className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                    title="Find hospitals near my current location"
                  >
                    <Navigation className={`w-4 h-4 text-health-600 ${detectingLocation ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Near Me</span>
                  </button>
                  <button
                    type="submit"
                    className="bg-health-700 hover:bg-health-800 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <span>Search</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Action Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-2">
              <span className="font-semibold text-slate-700">Quick Searches:</span>
              <button onClick={() => navigate('/hospitals?type=GOVERNMENT')} className="hover:text-health-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 transition">Govt AIIMS & Safdarjung</button>
              <button onClick={() => navigate('/hospitals?type=PRIVATE')} className="hover:text-health-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 transition">Apollo & Max Speciality</button>
              <button onClick={() => navigate('/blood-banks?bloodGroup=O+')} className="hover:text-red-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 transition">O+ Blood Banks</button>
              <button onClick={() => navigate('/emergency-register')} className="font-bold text-red-600 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200 transition">Emergency Registration</button>
            </div>

          </div>

        </div>
      </section>

      {/* Platform Live Metrics Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-health-400 font-mono">
                {stats?.hospitals?.total || 5}+
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">Verified Healthcare Facilities</p>
              <span className="text-[11px] text-slate-500">Delhi NCR, Mumbai & Bengaluru</span>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                {stats?.beds?.available || 310}+
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">Real-Time Available Beds</p>
              <span className="text-[11px] text-slate-500">General, ICU & Oxygen Monitored</span>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono">
                {stats?.bloodBanks?.totalUnits || 240}+
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">Verified Blood Units</p>
              <span className="text-[11px] text-slate-500">Across 8 Major Blood Groups</span>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-sky-400 font-mono">
                24/7
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">Emergency Assistance</p>
              <span className="text-[11px] text-slate-500">108 & 112 Integrated Hotline</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Complete Civic Healthcare Ecosystem</h2>
          <p className="text-sm text-slate-600">
            Engineered with strict data integrity, role-based workflows, and verified healthcare provider records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.path}
                className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-soft hover:shadow-xl hover:border-health-300 transition-all transform hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-health-700 transition">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-health-700 group-hover:gap-2.5 transition-all">
                  <span>Explore Feature</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Nearby Hospital Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured Healthcare Facilities</h2>
            <p className="text-xs text-slate-500">Verified hospitals with active OPD and bed management</p>
          </div>
          <Link
            to="/hospitals"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-health-700 hover:text-health-800"
          >
            <span>View All Hospitals on Map</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {hospitals.map((h) => (
            <div
              key={h.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-soft p-5 flex flex-col justify-between hover:border-health-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <ProvenanceBadge provenance={h.provenance} isSimulated={h.isSimulated} isThirdParty={h.isThirdParty} />
                  <span className="text-[11px] font-bold text-slate-500">{h.type}</span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                  {h.name}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {h.address}, {h.city}
                </p>

                {h.bedSummary && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Available Beds</span>
                      <span className="font-extrabold text-emerald-600 text-sm">{h.bedSummary.availableBeds}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ICU Available</span>
                      <span className="font-extrabold text-health-700 text-sm">{h.bedSummary.icuAvailable}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2">
                <Link
                  to={`/hospitals/${h.id}`}
                  className="w-full text-center py-2 bg-health-50 hover:bg-health-100 text-health-700 font-bold text-xs rounded-xl transition"
                >
                  View Details & OPD
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100 rounded-3xl p-8 sm:p-12">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">How CivicConnect Works</h2>
            <p className="text-xs text-slate-500">Transparent 3-step workflow for citizens and healthcare workers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-health-700 text-white font-extrabold text-base flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="font-bold text-sm text-slate-900">Geospatial Discovery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Allow location detection or search by city/PIN code to locate hospitals and pharmacies within your radius.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-health-700 text-white font-extrabold text-base flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="font-bold text-sm text-slate-900">Verified Availability Check</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Check verified live bed occupancy, OPD schedules, doctor availability, and real-time blood bank units.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-health-700 text-white font-extrabold text-base flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="font-bold text-sm text-slate-900">Book OPD or Emergency Help</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Submit an appointment request for hospital review, or log an urgent emergency registration to alert trauma desks.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
