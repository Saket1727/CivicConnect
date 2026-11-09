import React from 'react';
import { PhoneCall, AlertCircle, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmergencyBanner() {
  return (
    <aside aria-label="National Emergency Helplines" className="bg-gradient-to-r from-red-700 via-emergency-600 to-rose-700 text-white text-xs py-2 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-300 animate-pulse flex-shrink-0" />
          <span className="font-semibold tracking-wide">CRITICAL EMERGENCY HELPLINE:</span>
          <span className="text-red-100 hidden sm:inline">In life-threatening situations, call immediately:</span>
        </div>

        <div className="flex items-center gap-4 font-mono font-bold text-xs sm:text-sm">
          <a href="tel:108" className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded-full transition">
            <PhoneCall className="w-3.5 h-3.5 text-amber-300" />
            <span>108 (Ambulance)</span>
          </a>
          <a href="tel:112" className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded-full transition">
            <PhoneCall className="w-3.5 h-3.5 text-amber-300" />
            <span>112 (National Emergency)</span>
          </a>
          <Link
            to="/emergency-register"
            className="bg-white text-red-700 hover:bg-red-50 font-sans font-bold px-3 py-1 rounded-md text-xs shadow-sm transition hidden md:inline-block"
          >
            Register Emergency OPD
          </Link>
        </div>
      </div>
    </aside>
  );
}
