const axios = require('axios');

const OW_KEY = process.env.OPENWEATHER_API_KEY;
const isMock = !OW_KEY || OW_KEY === 'your_openweather_api_key_here';

// Islamabad city coordinates
const ISLAMABAD = { lat: 33.6844, lon: 73.0479 };

// Pakistani city coordinates
const CITY_COORDS = {
  'islamabad': { lat: 33.6844, lon: 73.0479 },
  'lahore':    { lat: 31.5497, lon: 74.3436 },
  'karachi':   { lat: 24.8607, lon: 67.0011 },
  'rawalpindi':{ lat: 33.5651, lon: 73.0169 },
};

async function getWeather(location = 'islamabad') {
  if (isMock) {
    return getMockWeather(location);
  }
  try {
    const coords = CITY_COORDS[location.toLowerCase()] || ISLAMABAD;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${OW_KEY}&units=metric`;
    const { data } = await axios.get(url, { timeout: 5000 });
    return {
      temp_celsius: data.main.temp,
      feels_like: data.main.feels_like,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      wind_speed_kmh: Math.round(data.wind.speed * 3.6),
      rainfall_mm: data.rain?.['1h'] || 0,
      visibility_km: data.visibility / 1000,
      pressure_hpa: data.main.pressure,
      condition_code: data.weather[0].id,
      is_rain: data.weather[0].id >= 500 && data.weather[0].id < 600,
      is_storm: data.weather[0].id >= 200 && data.weather[0].id < 300,
      is_extreme_heat: data.main.temp > 40,
      source: 'openweather_live',
    };
  } catch (err) {
    console.warn('[Weather] API failed, using mock:', err.message);
    return getMockWeather(location);
  }
}

function getMockWeather(location = 'islamabad') {
  const scenarios = [
    {
      temp_celsius: 32, feels_like: 38, humidity: 78, description: 'heavy rain',
      wind_speed_kmh: 45, rainfall_mm: 72, visibility_km: 2.1, pressure_hpa: 1002,
      is_rain: true, is_storm: false, is_extreme_heat: false,
      condition_code: 502, source: 'mock',
    },
    {
      temp_celsius: 44, feels_like: 49, humidity: 22, description: 'clear sky',
      wind_speed_kmh: 12, rainfall_mm: 0, visibility_km: 8.0, pressure_hpa: 998,
      is_rain: false, is_storm: false, is_extreme_heat: true,
      condition_code: 800, source: 'mock',
    },
  ];
  // Return heavy rain scenario by default (matches demo)
  return { ...scenarios[0], location };
}

async function getFIRMSData(lat, lon) {
  // NASA FIRMS fire detection (free tier)
  const KEY = process.env.NASA_FIRMS_API_KEY;
  if (!KEY || KEY === 'your_nasa_firms_api_key_here') {
    return { fire_detected: false, confidence: 0, source: 'mock_firms' };
  }
  try {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${KEY}/VIIRS_NOAA20_NRT/${lon-0.1},${lat-0.1},${lon+0.1},${lat+0.1}/1`;
    const { data } = await axios.get(url, { timeout: 5000 });
    const lines = data.trim().split('\n');
    const fireDetected = lines.length > 1;
    return { fire_detected: fireDetected, hotspot_count: lines.length - 1, source: 'nasa_firms' };
  } catch {
    return { fire_detected: false, confidence: 0, source: 'firms_error' };
  }
}

module.exports = { getWeather, getFIRMSData };
