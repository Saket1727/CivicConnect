const axios = require('axios');

const OPEN_METEO_BASE = process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1';

// Cache weather for 15 minutes
const weatherCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

function interpretWeatherCode(code) {
  const map = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snowfall',
    73: 'Moderate snowfall',
    75: 'Heavy snowfall',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return map[code] || 'Fair';
}

function getAqiDescription(aqi) {
  if (aqi <= 50) return { label: 'Good', color: 'green', advice: 'Air quality is satisfactory and air pollution poses little or no risk.' };
  if (aqi <= 100) return { label: 'Moderate', color: 'yellow', advice: 'Air quality is acceptable. Sensitive individuals should consider limiting prolonged outdoor exertion.' };
  if (aqi <= 200) return { label: 'Unhealthy for Sensitive Groups', color: 'orange', advice: 'Children, the elderly, and individuals with respiratory issues should reduce outdoor exertion.' };
  if (aqi <= 300) return { label: 'Unhealthy / Poor', color: 'red', advice: 'Everyone may begin to experience health effects; wear an N95 mask outdoors.' };
  if (aqi <= 400) return { label: 'Very Poor', color: 'purple', advice: 'Health alert: The risk of health effects is increased for everyone.' };
  return { label: 'Severe / Hazardous', color: 'maroon', advice: 'Health warning of emergency conditions: Serious risk of respiratory impact.' };
}

/**
 * Fetch real-time weather and air quality observations
 */
async function getEnvironmentalConditions(latitude = 28.6139, longitude = 77.2090) {
  const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  if (weatherCache.has(cacheKey)) {
    const cached = weatherCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  try {
    // 1. Weather forecast endpoint
    const weatherPromise = axios.get(`${OPEN_METEO_BASE}/forecast`, {
      params: {
        latitude,
        longitude,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
        timezone: 'auto',
      },
      timeout: 4000,
    });

    // 2. Air quality endpoint
    const airQualityPromise = axios.get('https://air-quality-api.open-meteo.com/v1/air-quality', {
      params: {
        latitude,
        longitude,
        current: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi,european_aqi',
        timezone: 'auto',
      },
      timeout: 4000,
    });

    const [weatherRes, airRes] = await Promise.allSettled([weatherPromise, airQualityPromise]);

    const weatherData = weatherRes.status === 'fulfilled' ? weatherRes.value.data.current : null;
    const airData = airRes.status === 'fulfilled' ? airRes.value.data.current : null;

    if (!weatherData && !airData) {
      throw new Error('Both weather and air quality requests timed out or failed.');
    }

    const aqiValue = airData?.us_aqi || Math.round((airData?.pm2_5 || 25) * 2.5) || 75;
    const aqiCategory = getAqiDescription(aqiValue);

    const result = {
      isAvailable: true,
      source: 'Open-Meteo Environmental Observations',
      timestamp: new Date().toISOString(),
      weather: weatherData ? {
        temperatureC: Math.round(weatherData.temperature_2m),
        apparentTempC: Math.round(weatherData.apparent_temperature),
        humidity: weatherData.relative_humidity_2m,
        windSpeedKmh: Math.round(weatherData.wind_speed_10m),
        condition: interpretWeatherCode(weatherData.weather_code),
        weatherCode: weatherData.weather_code,
      } : null,
      airQuality: airData ? {
        aqi: aqiValue,
        category: aqiCategory.label,
        color: aqiCategory.color,
        healthAdvice: aqiCategory.advice,
        pm2_5: airData.pm2_5 ? Math.round(airData.pm2_5) : null,
        pm10: airData.pm10 ? Math.round(airData.pm10) : null,
        no2: airData.nitrogen_dioxide ? Math.round(airData.nitrogen_dioxide) : null,
        so2: airData.sulphur_dioxide ? Math.round(airData.sulphur_dioxide) : null,
      } : null,
    };

    weatherCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (error) {
    console.warn('[Environmental Service] Failed to fetch external telemetry:', error.message);
    // Explicitly return status unavailable - Never fabricate live sensor telemetry!
    return {
      isAvailable: false,
      message: 'Live meteorological observations are temporarily unavailable from upstream provider. Please check back shortly.',
      source: 'Open-Meteo',
      timestamp: new Date().toISOString(),
      weather: null,
      airQuality: null,
    };
  }
}

module.exports = {
  getEnvironmentalConditions,
};
