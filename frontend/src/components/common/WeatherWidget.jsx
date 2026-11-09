import React, { useState, useEffect } from 'react';
import { CloudSun, Wind, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export default function WeatherWidget({ compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchWeather() {
      try {
        const res = await api.get('/environment?lat=28.6139&lon=77.2090');
        if (isMounted && res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchWeather();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 animate-pulse bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-health-600" />
        <span>Loading live weather & AQI...</span>
      </div>
    );
  }

  if (error || !data || !data.isAvailable) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
        <CloudSun className="w-4 h-4 text-slate-400" />
        <span>Environmental feed temporarily offline</span>
      </div>
    );
  }

  const { weather, airQuality } = data;

  const getAqiBadgeColor = (color) => {
    switch (color) {
      case 'green': return 'bg-emerald-500 text-white';
      case 'yellow': return 'bg-amber-400 text-slate-900';
      case 'orange': return 'bg-orange-500 text-white';
      case 'red': return 'bg-red-500 text-white';
      case 'purple': return 'bg-purple-600 text-white';
      case 'maroon': return 'bg-rose-900 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-medium">
        <span className="flex items-center gap-1 text-slate-700">
          <CloudSun className="w-4 h-4 text-amber-500" />
          <span>{weather ? `${weather.temperatureC}°C, ${weather.condition}` : 'New Delhi'}</span>
        </span>
        {airQuality && (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${getAqiBadgeColor(airQuality.color)}`}>
            AQI {airQuality.aqi} • {airQuality.category}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-soft">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CloudSun className="w-5 h-5 text-amber-500" />
          <h4 className="text-sm font-semibold text-slate-900">Local Environment (NCR)</h4>
        </div>
        <span className="text-[11px] text-slate-400">Open-Meteo Telemetry</span>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-3">
        <div>
          <span className="text-xs text-slate-500 block">Temperature & Condition</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold text-slate-800">{weather?.temperatureC ?? '--'}°C</span>
            <span className="text-xs font-medium text-slate-600">{weather?.condition}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Humidity: {weather?.humidity}% • Wind: {weather?.windSpeedKmh} km/h</span>
        </div>

        <div>
          <span className="text-xs text-slate-500 block">Air Quality Index (AQI)</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${getAqiBadgeColor(airQuality?.color)}`}>
              AQI {airQuality?.aqi ?? '--'}
            </span>
            <span className="text-xs font-medium text-slate-700">{airQuality?.category}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-snug line-clamp-2">
            {airQuality?.healthAdvice}
          </p>
        </div>
      </div>
    </div>
  );
}
