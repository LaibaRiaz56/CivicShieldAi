const { geminiChat } = require('../services/gemini');

const CRISIS_TYPES = [
  'urban_flooding', 'electrical_fire', 'transformer_explosion',
  'smoke_fire', 'road_accident', 'infrastructure_failure', 'heatwave',
  'crowd_emergency', 'gas_leak', 'building_collapse'
];

const SYSTEM_PROMPT = `You are the Crisis Detection Agent for CivicShield AI, specialized in Pakistani urban emergency scenarios.

Your job is to:
1. Classify the exact crisis type from all available signals.
2. Calculate a confidence score (0.0 to 1.0).
3. List secondary possible crisis types.
4. Explain the evidence chain that led to your classification.
5. Flag if the crisis is worsening, stable, or contained.

Crisis types: ${CRISIS_TYPES.join(', ')}
Return ONLY valid JSON.`;

async function runCrisisDetectionAgent({ collectedSignals, verificationResult, imageDetections }) {
  const userPrompt = `
Analyze all signals to classify the crisis:

Signal Summary:
- Location: ${collectedSignals.location_extracted}
- Crisis Hints: ${JSON.stringify(collectedSignals.crisis_hints || [])}
- Weather: ${JSON.stringify(collectedSignals.raw_weather)}
- Traffic Anomaly: ${JSON.stringify(collectedSignals.raw_traffic)}

Verification Results:
- Verified: ${verificationResult.verified}
- Corroboration Score: ${verificationResult.corroboration_score}
- Cross Checks Passed: ${JSON.stringify(verificationResult.cross_checks || [])}

Image Detection (YOLOv8):
${JSON.stringify(imageDetections || { source: 'no_image' })}

Original Report Language: ${collectedSignals.language_detected}

Classify the crisis. Calculate confidence based on signal strength and corroboration.
Return JSON with: { crisis_type, confidence, secondary_types, evidence, trend, is_active, crisis_id_suggestion, reasoning }`;

  const response = await geminiChat(SYSTEM_PROMPT, userPrompt);

  try {
    const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    return {
      ...parsed,
      agent: 'crisis_detection',
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      crisis_type: inferCrisisFromSignals(collectedSignals, imageDetections),
      confidence: verificationResult.corroboration_score || 0.7,
      secondary_types: [],
      evidence: [],
      trend: 'worsening',
      is_active: true,
      agent: 'crisis_detection',
      timestamp: new Date().toISOString(),
      reasoning: response,
    };
  }
}

function inferCrisisFromSignals(signals, imageDetections) {
  const text = JSON.stringify(signals).toLowerCase();
  if (imageDetections?.primary_detection === 'smoke' || text.includes('smoke') || text.includes('dhuaan')) return 'smoke_fire';
  if (imageDetections?.primary_detection === 'flood_water' || text.includes('pani') || text.includes('flood')) return 'urban_flooding';
  if (text.includes('transformer') || text.includes('bijli') || text.includes('blast')) return 'transformer_explosion';
  if (text.includes('accident') || text.includes('crash')) return 'road_accident';
  if (text.includes('garmi') || text.includes('heat')) return 'heatwave';
  return 'urban_flooding';
}

module.exports = { runCrisisDetectionAgent };
