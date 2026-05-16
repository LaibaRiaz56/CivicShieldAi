const { geminiChat } = require('../services/gemini');

const SYSTEM_PROMPT = `You are the Action Planning Agent for CivicShield AI.

Your job is to:
1. Generate a coordinated, prioritized response action plan for an active crisis.
2. Actions include: traffic rerouting, emergency dispatch, citizen alerts, road blockades, advisories, hospital pre-alerts, utility shutoffs.
3. Order actions by life-safety priority (1 = highest).
4. Each action must have: type, detail, priority, estimated_time_minutes, responsible_agency.
5. Generate a complete emergency ticket summary.
Return ONLY valid JSON.`;

async function runActionPlanningAgent({ crisisDetection, severityAnalysis, resourceAllocation, collectedSignals }) {
  const userPrompt = `
Situation Requiring Action Plan:
- Crisis: ${crisisDetection.crisis_type} at ${collectedSignals.location_extracted}
- Severity: ${severityAnalysis.severity_level}
- Allocated Resources: ${JSON.stringify(resourceAllocation.allocated_resources)}
- Roads to Reroute: ${JSON.stringify(resourceAllocation.reroute_roads)}
- Hospitals on Alert: ${JSON.stringify(resourceAllocation.hospitals_on_alert)}
- Affected People: ${severityAnalysis.estimated_affected_people}
- Compounding Factors: ${JSON.stringify(severityAnalysis.compounding_factors || [])}
- Weather: ${JSON.stringify(collectedSignals.raw_weather)}

Generate a complete coordinated action plan. Include:
- Traffic rerouting instructions
- Resource dispatch commands
- Citizen notification messages (in Urdu and English)
- Road blockade locations
- Utility shutoff recommendations (if applicable)
- Hospital pre-alert
- Media/public advisory

Return JSON with: { actions, citizen_alert_message_urdu, citizen_alert_message_english, emergency_ticket_summary, estimated_total_response_minutes, coordinating_agency, reasoning }`;

  const response = await geminiChat(SYSTEM_PROMPT, userPrompt);

  try {
    const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    return { ...parsed, agent: 'action_planning', timestamp: new Date().toISOString() };
  } catch {
    return {
      actions: generateDefaultActions(crisisDetection.crisis_type, collectedSignals.location_extracted, resourceAllocation),
      citizen_alert_message_urdu: `متنبہ: ${collectedSignals.location_extracted} میں ہنگامی صورتحال۔ براہ کرم محفوظ رہیں۔`,
      citizen_alert_message_english: `ALERT: Emergency situation at ${collectedSignals.location_extracted}. Please stay safe and follow instructions.`,
      emergency_ticket_summary: `${crisisDetection.crisis_type.toUpperCase()} at ${collectedSignals.location_extracted}`,
      estimated_total_response_minutes: resourceAllocation.estimated_deployment_time_minutes || 15,
      coordinating_agency: 'NDMA / District Administration',
      agent: 'action_planning',
      timestamp: new Date().toISOString(),
      reasoning: response,
    };
  }
}

function generateDefaultActions(crisisType, location, resources) {
  const actions = [
    { type: 'emergency_dispatch', detail: `Deploy all allocated resources to ${location}`, priority: 1, estimated_time_minutes: 2, responsible_agency: 'Rescue 1122' },
    { type: 'citizen_alert', detail: `Send SMS and push notification to residents in ${location} area`, priority: 1, estimated_time_minutes: 1, responsible_agency: 'PTA / Emergency Cell' },
    { type: 'traffic_reroute', detail: `Activate alternate routes around ${location}`, priority: 2, estimated_time_minutes: 5, responsible_agency: 'Traffic Police' },
    { type: 'road_blockade', detail: `Set up safety perimeter around incident site at ${location}`, priority: 2, estimated_time_minutes: 8, responsible_agency: 'Police' },
    { type: 'hospital_alert', detail: `Pre-alert nearest hospitals for potential casualties`, priority: 2, estimated_time_minutes: 3, responsible_agency: 'Ministry of Health' },
  ];
  if (crisisType === 'transformer_explosion' || crisisType === 'electrical_fire') {
    actions.push({ type: 'utility_shutoff', detail: 'Coordinate with IESCO for grid isolation in affected sector', priority: 1, estimated_time_minutes: 10, responsible_agency: 'IESCO' });
  }
  if (crisisType === 'urban_flooding') {
    actions.push({ type: 'drainage_activation', detail: 'Activate emergency drainage pumps in sector', priority: 2, estimated_time_minutes: 15, responsible_agency: 'CDA Water' });
  }
  return actions;
}

module.exports = { runActionPlanningAgent };
