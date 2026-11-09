const axios = require('axios');

const NOMINATIM_BASE = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';
const OVERPASS_BASE = process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';

// Simple in-memory cache to respect OSM rate limits
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Geocode an address/city/pincode to coordinates using OpenStreetMap Nominatim
 */
async function geocodeLocation(query) {
  const cacheKey = `geo:${query.toLowerCase().trim()}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  try {
    const response = await axios.get(`${NOMINATIM_BASE}/search`, {
      params: {
        q: query,
        format: 'json',
        countrycodes: 'in', // Priority to India
        limit: 5,
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'CivicConnect-Healthcare-Platform/1.0 (academic.project@civicconnect.in)',
      },
      timeout: 5000,
    });

    const results = (response.data || []).map(item => ({
      displayName: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type,
      importance: item.importance,
      address: item.address,
    }));

    cache.set(cacheKey, { timestamp: Date.now(), data: results });
    return results;
  } catch (error) {
    console.warn(`[Nominatim] Geocoding lookup failed for query "${query}":`, error.message);
    return [];
  }
}

/**
 * Reverse geocode coordinates to location description
 */
async function reverseGeocode(lat, lon) {
  const cacheKey = `rev:${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  try {
    const response = await axios.get(`${NOMINATIM_BASE}/reverse`, {
      params: {
        lat,
        lon,
        format: 'json',
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'CivicConnect-Healthcare-Platform/1.0 (academic.project@civicconnect.in)',
      },
      timeout: 5000,
    });

    const result = {
      displayName: response.data.display_name,
      address: response.data.address,
    };

    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (error) {
    console.warn(`[Nominatim] Reverse geocoding failed:`, error.message);
    return null;
  }
}

/**
 * Query real-world hospitals using Overpass API
 * CRITICAL DATA RULE: Never fabricate bed availability or doctor rosters for OSM records.
 */
async function fetchOSMHospitals(latitude, longitude, radiusKm = 10) {
  const radiusMeters = Math.min(radiusKm * 1000, 25000); // Max 25km
  const cacheKey = `osm_hosp:${latitude.toFixed(3)},${longitude.toFixed(3)},${radiusMeters}`;

  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // Overpass QL query searching for hospitals and clinics around the coordinates
  const overpassQuery = `
    [out:json][timeout:10];
    (
      node["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="clinic"](around:${radiusMeters},${latitude},${longitude});
    );
    out center 25;
  `;

  try {
    const response = await axios.post(
      OVERPASS_BASE,
      `data=${encodeURIComponent(overpassQuery)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 8000,
      }
    );

    const elements = response.data?.elements || [];
    const formatted = elements
      .filter(el => el.tags && el.tags.name)
      .map(el => {
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;
        const tags = el.tags || {};

        return {
          id: `osm-${el.type}-${el.id}`,
          osmId: el.id,
          name: tags.name,
          registrationNo: null,
          type: tags['operator:type'] === 'public' || tags['healthcare'] === 'public' ? 'GOVERNMENT' : 'PRIVATE',
          status: 'VERIFIED',
          address: tags['addr:full'] || tags['addr:street'] || tags['operator'] || 'OpenStreetMap Verified Healthcare Node',
          city: tags['addr:city'] || 'Discovered Region',
          state: tags['addr:state'] || 'India',
          pincode: tags['addr:postcode'] || '',
          latitude: lat,
          longitude: lon,
          phone: tags.phone || tags['contact:phone'] || 'Check on arrival',
          emergencyPhone: tags['emergency:phone'] || null,
          website: tags.website || tags['contact:website'] || null,
          // CRITICAL ETHICAL SEPARATION FLAGS:
          provenance: 'OPEN_STREET_MAP',
          isSimulated: false,
          isThirdParty: true,
          dataSourceNotice: 'Discovered via OpenStreetMap (ODbL). Real-time bed availability and appointments are not claimed or fabricated for external OSM records.',
          attribution: '© OpenStreetMap contributors (ODbL)',
          retrievedAt: new Date().toISOString(),
          // Explicit nulls for unverified external nodes
          beds: null,
          doctors: [],
          departments: [],
          canBookAppointment: false,
        };
      });

    cache.set(cacheKey, { timestamp: Date.now(), data: formatted });
    return formatted;
  } catch (error) {
    console.warn(`[Overpass] Failed to retrieve external OSM hospitals:`, error.message);
    // Graceful fallback to empty array so platform remains 100% operational using local MySQL data
    return [];
  }
}

module.exports = {
  geocodeLocation,
  reverseGeocode,
  fetchOSMHospitals,
};
