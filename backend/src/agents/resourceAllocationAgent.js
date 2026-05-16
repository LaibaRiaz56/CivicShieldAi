const { geminiChat } = require('../services/gemini');
const mockResources = require('../utils/mockResources');

const SYSTEM_PROMPT = `You are the Resource Allocation Agent for CivicShield AI emergency response system in Pakistan.

Your job is to:
1. Select the nearest and most suitable emergency resources for the detected crisis.
2. Match resource type to crisis type (e.g., rescue boats for flooding, fire brigades for fires).
3. Provide explainable reasoning for EACH resource selection.
4. Consider: distance, availability, equipment suitability, response time.
5. Also suggest roads to reroute and hospitals to put on alert.
Return ONLY valid JSON.`;

async function runResourceAllocationAgent({ crisisDetection, severityAnalysis, collectedSignals }) {
  const available = mockResources.filter(r => r.status === 'available');
  const location = collectedSignals.location_extracted;

  const userPrompt = `
Crisis requiring resources:
- Type: ${crisisDetection.crisis_type}
- Severity: ${severityAnalysis.severity_level} (score: ${severityAnalysis.severity_score})
- Location: ${location}
- Affected Radius: ${severityAnalysis.affected_radius_km}km
- Estimated Affected People: ${severityAnalysis.estimated_affected_people}
- Nearby Hospitals: ${JSON.stringify(severityAnalysis.nearby_hospitals)}

Available Emergency Resources:
${JSON.stringify(available, null, 2)}

Select the optimal set of resources. For flooding, prioritize rescue boats. For fire/transformer, prioritize fire brigades. Always include ambulances for HIGH/CRITICAL severity. Explain each selection with distance and equipment rationale.
Return JSON with: { allocated_resources, total_resources, reroute_roads, hospitals_on_alert, estimated_deployment_time_minutes, reasoning }`;

  const response = await geminiChat(SYSTEM_PROMPT, userPrompt);

  try {
    const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    // Mark allocated resources as deployed in mock state
    if (parsed.allocated_resources) {
      parsed.allocated_resources.forEach(r => {
        const res = mockResources.find(m => m.id === r.id);
        if (res) res.status = 'deployed';
      });
    }
    return { ...parsed, agent: 'resource_allocation', timestamp: new Date().toISOString() };
  } catch {
    return {
      allocated_resources: getDefaultResources(crisisDetection.crisis_type, available),
      reroute_roads: [],
      hospitals_on_alert: severityAnalysis.nearby_hospitals || [],
      agent: 'resource_allocation',
      timestamp: new Date().toISOString(),
      reasoning: response,
    };
  }
}

function getDefaultResources(crisisType, available) {
  const typeMap = {
    urban_flooding:       ['rescue_boat', 'ambulance', 'police'],
    electrical_fire:      ['fire_brigade', 'ambulance', 'utility_team'],
    transformer_explosion:['fire_brigade', 'ambulance', 'utility_team'],
    smoke_fire:           ['fire_brigade', 'ambulance'],
    road_accident:        ['ambulance', 'police', 'fire_brigade'],
    heatwave:             ['ambulance', 'medical_team'],
    infrastructure_failure:['rescue_team', 'utility_team', 'ambulance'],
  };
  const needed = typeMap[crisisType] || ['ambulance', 'rescue_team'];
  return available
    .filter(r => needed.includes(r.type))
    .slice(0, 3)
    .map(r => ({ ...r, reason: `Selected as nearest available ${r.type}` }));
}

module.exports = { runResourceAllocationAgent };
