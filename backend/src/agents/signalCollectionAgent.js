const { geminiChat } = require('../services/gemini');
const { getWeather } = require('../services/weather');
const { getTrafficAnomaly } = require('../services/traffic');

const SYSTEM_PROMPT = `You are the Signal Collection Agent for CivicShield AI, a smart-city emergency response system for Pakistani metropolitan environments.

Your job is to:
1. Normalize and structure incoming signals (text reports, voice transcripts, image detections, weather data, traffic data).
2. Extract: location (Pakistani sector/area), crisis type hints, urgency level, language used.
3. Handle Roman Urdu, Urdu, and English reports.
4. Return structured JSON only.

Common Pakistani locations: G-10, F-8, I-10, H-11, Rawalpindi, Lahore, Karachi.
Crisis types: urban_flooding, fire, transformer_explosion, smoke, road_accident, infrastructure_failure, heatwave.
Return ONLY valid JSON.`;

async function runSignalCollectionAgent({ report, imageDetections, audioTranscript, location }) {
  const weather = await getWeather(location || 'islamabad');
  const traffic = location ? getTrafficAnomaly(location) : { anomaly_detected: false };

  const userPrompt = `
Incoming signals to normalize:
- Text/Voice Report: "${report || audioTranscript || 'No text report'}"
- Image Analysis (YOLO): ${JSON.stringify(imageDetections || {})}
- Current Weather: ${JSON.stringify(weather)}
- Traffic Anomaly: ${JSON.stringify(traffic)}
- Location Hint: ${location || 'Unknown'}

Extract and normalize all signals. Identify the location precisely, detect language, infer crisis type hints, and assess urgency (low/medium/high/critical).
Return JSON with: { normalized_signals, location_extracted, language_detected, crisis_hints, urgency, weather_relevance, traffic_relevance, signal_count, reasoning }`;

  const response = await geminiChat(SYSTEM_PROMPT, userPrompt);
  
  try {
    const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    return {
      ...parsed,
      raw_weather: weather,
      raw_traffic: traffic,
      agent: 'signal_collection',
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      normalized_signals: [{ type: 'raw_report', content: report || audioTranscript }],
      location_extracted: location || 'Unknown',
      language_detected: detectLanguage(report || audioTranscript || ''),
      crisis_hints: [],
      urgency: 'medium',
      raw_weather: weather,
      raw_traffic: traffic,
      agent: 'signal_collection',
      timestamp: new Date().toISOString(),
      reasoning: response,
    };
  }
}

function detectLanguage(text) {
  if (/[\u0600-\u06FF]/.test(text)) return 'urdu';
  if (/\b(mein|hai|hua|bohat|pani|aag|dhuaan|ke|pe|ka|ki)\b/i.test(text)) return 'roman_urdu';
  return 'english';
}

module.exports = { runSignalCollectionAgent };
