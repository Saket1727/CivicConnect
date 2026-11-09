import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Phone, ExternalLink, Bed, ShieldCheck, Database, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

// Fix Leaflet default icon issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom styled div icons
function createCustomPin(color, iconHtml) {
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      ">
        <div style="transform: rotate(45deg); color: white; display: flex; align-items: center; justify-content: center;">
          ${iconHtml}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

const verifiedGovIcon = createCustomPin('#0284c7', '🏥');
const verifiedPvtIcon = createCustomPin('#0d9488', '🏥');
const simulatedIcon = createCustomPin('#d97706', '🧪');
const osmIcon = createCustomPin('#64748b', '📍');
const userLocationIcon = L.divIcon({
  className: 'user-pin',
  html: `
    <div style="position: relative;">
      <div style="width: 20px; height: 20px; background: #dc2626; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(220,38,38,0.8);"></div>
      <div style="position: absolute; top: -5px; left: -5px; width: 30px; height: 30px; border-radius: 50%; background: rgba(220,38,38,0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Helper component to center map dynamically when coordinates change
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function HospitalMap({
  hospitals = [],
  userLocation = null,
  center = [28.6139, 77.2090], // Default New Delhi
  zoom = 12,
  selectedHospitalId = null,
  onHospitalSelect = () => {},
}) {
  const defaultCenter = userLocation ? [userLocation.lat, userLocation.lng] : center;

  const getMarkerIcon = (hospital) => {
    if (hospital.isSimulated) return simulatedIcon;
    if (hospital.isThirdParty) return osmIcon;
    if (hospital.type === 'GOVERNMENT') return verifiedGovIcon;
    return verifiedPvtIcon;
  };

  return (
    <div className="relative w-full h-full min-h-[450px] rounded-2xl overflow-hidden shadow-soft border border-slate-200">
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <ChangeView center={defaultCenter} zoom={zoom} />
        
        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Current Location Pin */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
            <Popup>
              <div className="p-1 font-sans">
                <span className="font-bold text-red-600 block text-xs">Your Detected Location</span>
                <span className="text-[10px] text-slate-500">Searching nearby facilities around here</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Hospital Markers */}
        {hospitals.map((hospital) => {
          if (!hospital.latitude || !hospital.longitude) return null;

          return (
            <Marker
              key={hospital.id}
              position={[hospital.latitude, hospital.longitude]}
              icon={getMarkerIcon(hospital)}
              eventHandlers={{
                click: () => onHospitalSelect(hospital),
              }}
            >
              <Popup>
                <div className="p-1 max-w-[260px] font-sans text-xs space-y-2">
                  <div>
                    {hospital.isSimulated && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded mr-1">
                        SIMULATED
                      </span>
                    )}
                    {hospital.isThirdParty && (
                      <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded mr-1">
                        OSM Node
                      </span>
                    )}
                    <h4 className="font-bold text-slate-900 text-sm leading-tight mt-0.5">
                      {hospital.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {hospital.address}
                    </p>
                  </div>

                  {hospital.bedSummary && (
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex justify-between items-center text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Available Beds</span>
                        <span className="font-bold text-emerald-600 text-xs">
                          {hospital.bedSummary.availableBeds} / {hospital.bedSummary.totalBeds}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">ICU Beds</span>
                        <span className="font-bold text-health-700 text-xs">
                          {hospital.bedSummary.icuAvailable}
                        </span>
                      </div>
                      {hospital.distanceKm !== null && (
                        <div>
                          <span className="text-slate-400 block text-[10px]">Distance</span>
                          <span className="font-semibold text-slate-700 text-xs">
                            {hospital.distanceKm} km
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1 border-t border-slate-100">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-md text-[11px] font-medium transition"
                    >
                      <Navigation className="w-3 h-3 text-health-600" />
                      <span>Directions</span>
                    </a>

                    {!hospital.isThirdParty && (
                      <Link
                        to={`/hospitals/${hospital.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1 bg-health-700 hover:bg-health-800 text-white py-1.5 rounded-md text-[11px] font-semibold transition"
                      >
                        <span>Details & OPD</span>
                      </Link>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur rounded-xl p-2.5 shadow-md border border-slate-200 z-[1000] text-[11px] space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" />
          <span className="text-slate-700">Govt Hospital (Verified)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
          <span className="text-slate-700">Private Hospital (Verified)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          <span className="text-slate-700">Simulated Academic Demo</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
          <span className="text-slate-700">OpenStreetMap (ODbL)</span>
        </div>
      </div>
    </div>
  );
}
