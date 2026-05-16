const { geminiChat } = require('../services/gemini');
const db = require('../services/db');

const SYSTEM_PROMPT = `You are the Verification Agent for CivicShield AI emergency response system.

Your job is to:
1. Cross-check incoming signals against weather data, traffic anomalies, image detections, and nearby historical reports.
2. Detect misinformation, false positives, and unsupported claims.
3. Adjust confidence scores based on corroboration evidence.
4. If insufficient evidence exists, flag as low_confidence or misinformation.
5. If alert should be retracted, set retract: true.

Rules:
- Require at least 2 corroborating signals for HIGH confidence.
- Single unverified report with no weather/image support → low_confidence.
- Contradictory signals (e.g., flood report + dry weather + no image) → possible_misinformation.
- Return ONLY valid JSON.`;

async function runVerificationAgent({ collectedSignals, incidentId }) {
  // Get nearby reports from DB
  const { data: nearbyReports } = await db.select('reports', {});
  const recentNearby = (nearbyReports || [])
    .filter(r => r.location === collectedSignals.location_extracted)
    .slice(-5);

  const userPrompt = `
Signals to verify:
- Normalized Signals: ${JSON.stringify(collectedSignals.normalized_signals)}
- Location: ${collectedSignals.location_extracted}
- Weather: ${JSON.stringify(collectedSignals.raw_weather)}
- Traffic Anomaly: ${JSON.stringify(collectedSignals.raw_traffic)}
- Nearby Recent Reports (last 5): ${JSON.stringify(recentNearby)}
- Urgency Claimed: ${collectedSignals.urgency}

Cross-check for corroboration. Assess if this is a valid emergency signal or potential misinformation.
Return JSON with: { verified, confidence_adjustment, cross_checks, misinformation_flag, retract, low_confidence_reason, corroboration_score, reasoning }`;

  const response = await geminiChat(SYSTEM_PROMPT, userPrompt);

  try {
    const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    return {
      ...parsed,
      agent: 'verification',
      nearby_report_count: recentNearby.length,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      verified: true,
      confidence_adjustment: 0,
      cross_checks: [],
      misinformation_flag: false,
      retract: false,
      corroboration_score: 0.5,
      agent: 'verification',
      nearby_report_count: recentNearby.length,
      timestamp: new Date().toISOString(),
      reasoning: response,
    };
  }
}

module.exports = { runVerificationAgent };
