const { geminiChat } = require('../services/gemini');
const db = require('../services/db');

const SYSTEM_PROMPT = `
You are the Verification Agent for CivicShield AI.

Your task:
- Verify if emergency reports are likely real
- Reduce false positives
- BUT do not aggressively reject valid citizen emergency reports

Rules:
- Emergency keywords increase confidence
- Nearby reports increase confidence
- Image evidence increases confidence
- Weather anomalies increase confidence
- Never retract obvious emergency reports unless clearly fake

Return ONLY valid JSON.
`;

async function runVerificationAgent({ collectedSignals, incidentId }) {

  // ─── Get nearby reports ───────────────────────────────────────────────
  const { data: nearbyReports } = await db.select('reports', {});

  const recentNearby = (nearbyReports || [])
    .filter(r =>
      r.location === collectedSignals.location_extracted
    )
    .slice(-5);

  // ─── Extract report text ──────────────────────────────────────────────
  const reportText =
    (
      collectedSignals?.normalized_signals?.[0]?.content ||
      ''
    ).toLowerCase();

  // ─── Emergency keyword detection ──────────────────────────────────────
  const emergencyKeywords = [
    'aag',
    'fire',
    'blast',
    'smoke',
    'dhuaan',
    'flood',
    'pani',
    'accident',
    'crash',
    'explosion',
    'gas',
    'emergency',
    'heatwave',
    'transformer',
  ];

  const hasEmergencyKeyword =
    emergencyKeywords.some(word =>
      reportText.includes(word)
    );

  // ─── Confidence calculation ───────────────────────────────────────────
  let corroborationScore = 0.65;

  if (hasEmergencyKeyword) {
    corroborationScore += 0.2;
  }

  if (recentNearby.length > 0) {
    corroborationScore += 0.1;
  }

  if (collectedSignals?.imageDetections) {
    corroborationScore += 0.1;
  }

  if (collectedSignals?.raw_weather) {
    corroborationScore += 0.05;
  }

  corroborationScore = Math.min(corroborationScore, 0.98);

  // ─── Final verification result ───────────────────────────────────────
  const result = {
    verified: true,

    confidence_adjustment: 0.12,

    cross_checks: [
      hasEmergencyKeyword
        ? 'emergency_keywords_detected'
        : 'basic_report_validation',

      recentNearby.length > 0
        ? 'nearby_reports_found'
        : 'single_report',

      collectedSignals?.raw_weather
        ? 'weather_checked'
        : 'weather_unavailable',
    ],

    misinformation_flag: false,

    retract: false,

    low_confidence_reason: null,

    corroboration_score: corroborationScore,

    reasoning:
      hasEmergencyKeyword
        ? 'Emergency keywords detected and report appears credible.'
        : 'Citizen report accepted with moderate confidence.',
  };

  // ─── Optional AI verification enhancement ─────────────────────────────
  try {

    const userPrompt = `
Report:
${reportText}

Location:
${collectedSignals.location_extracted}

Nearby Reports:
${recentNearby.length}

Weather:
${JSON.stringify(collectedSignals.raw_weather || {})}

Return JSON:
{
  "verified": true,
  "confidence_adjustment": number,
  "reasoning": "short reasoning"
}
`;

    const aiResponse = await geminiChat(
      SYSTEM_PROMPT,
      userPrompt
    );

    const parsed = JSON.parse(
      aiResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
    );

    if (parsed?.confidence_adjustment) {
      result.confidence_adjustment =
        parsed.confidence_adjustment;
    }

    if (parsed?.reasoning) {
      result.reasoning = parsed.reasoning;
    }

  } catch (err) {
    console.log(
      '[Verification Agent] AI enhancement skipped:',
      err.message
    );
  }

  return {
    ...result,
    agent: 'verification',
    nearby_report_count: recentNearby.length,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  runVerificationAgent,
};