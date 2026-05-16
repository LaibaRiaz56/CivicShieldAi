const { geminiChat } = require('../services/gemini');

// Pakistan sector population estimates
const SECTOR_DATA = {
  'G-10': { population: 85000, hospitals_nearby: ['PIMS (3.2km)', 'Polyclinic (4.1km)'], drainage: 'poor', schools: 4 },
  'G-9':  { population: 72000, hospitals_nearby: ['PIMS (2.1km)'], drainage: 'moderate', schools: 3 },
  'G-8':  { population: 65000, hospitals_nearby: ['PIMS (1.5km)'], drainage: 'moderate', schools: 2 },
  'F-8':  { population: 55000, hospitals_nearby: ['NIRM (0.5km)', 'Shifa (2km)'], drainage: 'good', schools: 5 },
  'F-6':  { population: 40000, hospitals_nearby: ['Shifa (1.2km)'], drainage: 'good', schools: 2 },
  'I-10': { population: 90000, hospitals_nearby: ['Ibn-e-Sina (3km)'], drainage: 'poor', schools: 6 },
  'H-11': { population: 70000, hospitals_nearby: ['PIMS (4km)'], drainage: 'poor', schools: 3 },
};

const SYSTEM_PROMPT = `You are the Severity Analysis Agent for CivicShield AI.

Your job is to:
1. Estimate the severity and potential impact of a detected crisis.
2. Consider: population density, nearby hospitals, infrastructure vulnerability, weather intensity, time of day, crowd density.
3. Assign a severity level: LOW, MODERATE, HIGH, CRITICAL.
4. Estimate affected radius, population, and key risk factors.
5. Identify compounding factors (e.g., flood + electrical infrastructure = extreme risk).
Return ONLY valid JSON.`;

async function runSeverityAnalysisAgent({ crisisDetection, collectedSignals, imageDetections }) {
  const sector = collectedSignals.location_extracted?.split(',')[0]?.trim();
  const sectorInfo = SECTOR_DATA[sector] || { population: 50000, hospitals_nearby: ['Unknown'], drainage: 'unknown', schools: 0 };
  
  const userPrompt = `
Crisis Assessment:
- Crisis Type: ${crisisDetection.crisis_type}
- Confidence: ${crisisDetection.confidence}
- Location: ${collectedSignals.location_extracted}
- Sector Data: ${JSON.stringify(sectorInfo)}
- Weather: ${JSON.stringify(collectedSignals.raw_weather)}
- Traffic Congestion: ${JSON.stringify(collectedSignals.raw_traffic)}
- Image Crowd Density: ${imageDetections?.crisis_indicators?.crowd_density || 0}
- Crisis Trend: ${crisisDetection.trend}
- Time: ${new Date().toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi' })} (Pakistan time)

Assess severity. Consider time of day (rush hour vs night), weather intensity, population density, drainage, and hospital proximity.
Return JSON with: { severity_level, severity_score, affected_radius_km, estimated_affected_people, nearby_hospitals, congestion_increase_pct, vulnerability_factors, compounding_factors, priority_actions_needed, reasoning }`;

  const response = await geminiChat(SYSTEM_PROMPT, userPrompt);

  try {
    const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    return {
      ...parsed,
      sector_data: sectorInfo,
      agent: 'severity_analysis',
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      severity_level: crisisDetection.confidence > 0.85 ? 'HIGH' : 'MODERATE',
      severity_score: Math.round(crisisDetection.confidence * 10 * 10) / 10,
      affected_radius_km: 2.5,
      estimated_affected_people: sectorInfo.population / 10,
      nearby_hospitals: sectorInfo.hospitals_nearby,
      congestion_increase_pct: 65,
      vulnerability_factors: [],
      sector_data: sectorInfo,
      agent: 'severity_analysis',
      timestamp: new Date().toISOString(),
      reasoning: response,
    };
  }
}

module.exports = { runSeverityAnalysisAgent };
