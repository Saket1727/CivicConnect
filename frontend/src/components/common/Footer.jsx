import React from 'react';
import { HeartPulse, PhoneCall, ShieldCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Purpose */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-health-600 flex items-center justify-center text-white">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="text-base font-extrabold text-white">CivicConnect</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Unified civic healthcare discovery and emergency assistance platform. Bridging citizens, hospitals, doctors, and civic authorities across India.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>B.Tech Major Project Edition</span>
              </span>
            </div>
          </div>

          {/* Emergency Helplines */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">National Emergency Hotlines</h4>
            <ul className="space-y-2">
              <li>
                <a href="tel:108" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                  <span className="font-mono font-bold text-red-400">108</span>
                  <span>National Emergency Ambulance</span>
                </a>
              </li>
              <li>
                <a href="tel:112" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                  <span className="font-mono font-bold text-amber-400">112</span>
                  <span>All-in-One Emergency Response</span>
                </a>
              </li>
              <li>
                <a href="tel:102" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                  <span className="font-mono font-bold text-sky-400">102</span>
                  <span>Maternal & Child Transport</span>
                </a>
              </li>
              <li>
                <a href="tel:1075" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                  <span className="font-mono font-bold text-emerald-400">1075</span>
                  <span>National Health Ministry Helpline</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Access */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Healthcare Modules</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link to="/hospitals" className="hover:text-white transition">Hospital Discovery & Bed Counts</Link></li>
              <li><Link to="/medicines" className="hover:text-white transition">Medicine & Pharmacy Search</Link></li>
              <li><Link to="/blood-banks" className="hover:text-white transition">Live Blood Bank Units</Link></li>
              <li><Link to="/ambulance" className="hover:text-white transition">Ambulance Request Dispatch</Link></li>
              <li><Link to="/schemes" className="hover:text-white transition">Ayushman Bharat & PM-JAY</Link></li>
              <li><Link to="/complaints" className="hover:text-white transition">Municipal Sanitation & Water Complaints</Link></li>
            </ul>
          </div>

          {/* Official Provider Portals */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Institutional Access</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link to="/hospital-register" className="hover:text-white transition">Register Your Hospital</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Hospital Administration Login</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Doctor OPD Portal</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Ambulance Driver Console</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Blood Bank Administrator</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Super Administrator Login</Link></li>
            </ul>
          </div>

        </div>

        {/* Legal & Open Database License Attribution Notice */}
        <div className="mt-8 pt-8 border-t border-slate-800 text-[11px] text-slate-500 space-y-2">
          <p>
            <strong>Open Database License (ODbL) Attribution Notice:</strong> Real-world map data and external healthcare point geometries are sourced from OpenStreetMap contributors under the Open Database License (ODbL). Real-time bed availability, appointment booking, and doctor schedules apply exclusively to officially registered provider organizations or explicit academic simulations, and are never fabricated for external OSM nodes.
          </p>
          <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
            <p>© {new Date().getFullYear()} CivicConnect Platform. Designed for Indian Healthcare & Civic Discovery.</p>
            <div className="flex gap-4">
              <span>Privacy & Medical Ethics</span>
              <span>Terms of Service</span>
              <span>API Documentation</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
