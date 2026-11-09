import React from 'react';
import { ShieldCheck, Database, MapPin, AlertCircle } from 'lucide-react';

export default function ProvenanceBadge({ provenance, isSimulated, isThirdParty }) {
  if (isSimulated || provenance === 'SIMULATED_DEMO') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm" title="Academic Demonstration Data. Availability numbers are simulated.">
        <Database className="w-3 h-3 text-amber-600" />
        <span>SIMULATED DATA</span>
      </span>
    );
  }

  if (isThirdParty || provenance === 'OPEN_STREET_MAP') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 border border-sky-200" title="Discovered via OpenStreetMap (ODbL). Real-time beds/doctors are not claimed or fabricated.">
        <MapPin className="w-3 h-3 text-sky-600" />
        <span>OpenStreetMap (ODbL)</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300" title="Officially verified healthcare provider organization.">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
      <span>Verified Provider</span>
    </span>
  );
}
