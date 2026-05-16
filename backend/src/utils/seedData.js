const { v4: uuidv4 } = require('uuid');
const db = require('../services/db');

const DEMO_INCIDENTS = [
  {
    id: uuidv4(),
    status: 'active',
    crisis_type: 'urban_flooding',
    confidence: 0.91,
    severity_level: 'HIGH',
    severity_score: 8.2,
    location: 'G-10, Islamabad',
    lat: 33.6789,
    lon: 72.9934,
    report_text: 'G-10 mein pani bhar gaya hai, gadiyan phans gayi hain',
    ticket_id: 'CS-18472',
    actions_count: 5,
    citizens_alerted: 12000,
    allocated_resources: JSON.stringify([
      { id: 'RB-001', name: 'Rescue Boat Alpha', type: 'rescue_boat' },
      { id: 'AMB-001', name: 'Ambulance Unit 1', type: 'ambulance' },
      { id: 'FB-002', name: 'Fire Brigade Bravo', type: 'fire_brigade' },
    ]),
    created_by: 'citizen_demo',
  },
  {
    id: uuidv4(),
    status: 'active',
    crisis_type: 'transformer_explosion',
    confidence: 0.87,
    severity_level: 'CRITICAL',
    severity_score: 9.1,
    location: 'F-8, Islamabad',
    lat: 33.7028,
    lon: 73.0436,
    report_text: 'F-8 mein transformer blast hua hai, aag lag gayi aur bijli gayi hai',
    ticket_id: 'CS-29381',
    actions_count: 6,
    citizens_alerted: 8500,
    allocated_resources: JSON.stringify([
      { id: 'FB-001', name: 'Fire Brigade Alpha', type: 'fire_brigade' },
      { id: 'UTIL-001', name: 'IESCO Emergency Team', type: 'utility_team' },
      { id: 'AMB-002', name: 'Ambulance Unit 2', type: 'ambulance' },
    ]),
    created_by: 'citizen_demo',
  },
  {
    id: uuidv4(),
    status: 'contained',
    crisis_type: 'road_accident',
    confidence: 0.95,
    severity_level: 'MODERATE',
    severity_score: 5.8,
    location: 'Motorway M-2, Near Lahore',
    lat: 31.6340,
    lon: 74.1950,
    report_text: 'Motorway pe bohat dhuaan hai, ek truck aur do gadiyan takra gayi hain',
    ticket_id: 'CS-37194',
    actions_count: 4,
    citizens_alerted: 3200,
    allocated_resources: JSON.stringify([
      { id: 'AMB-003', name: 'Ambulance Unit 3', type: 'ambulance' },
      { id: 'POL-001', name: 'Traffic Police Unit', type: 'police' },
    ]),
    created_by: 'citizen_demo',
  },
  {
    id: uuidv4(),
    status: 'active',
    crisis_type: 'heatwave',
    confidence: 0.83,
    severity_level: 'HIGH',
    severity_score: 7.5,
    location: 'Karachi, Sindh',
    lat: 24.8607,
    lon: 67.0011,
    report_text: 'Karachi mein garmi bohat zyada hai, log behosh ho rahe hain',
    ticket_id: 'CS-41827',
    actions_count: 3,
    citizens_alerted: 25000,
    allocated_resources: JSON.stringify([
      { id: 'MED-002', name: 'Heatwave Medical Unit', type: 'medical_team' },
      { id: 'AMB-004', name: 'PIMS Response Unit', type: 'ambulance' },
    ]),
    created_by: 'citizen_demo',
  },
  {
    id: uuidv4(),
    status: 'retracted',
    crisis_type: 'urban_flooding',
    confidence: 0.21,
    severity_level: 'LOW',
    severity_score: 1.2,
    location: 'I-10, Islamabad',
    lat: 33.6585,
    lon: 72.9764,
    report_text: 'Yahan bohot pani aa raha hai',
    ticket_id: null,
    actions_count: 0,
    citizens_alerted: 0,
    allocated_resources: '[]',
    created_by: 'citizen_demo',
    retraction_reason: 'Single unverified report with no weather corroboration. Rainfall at I-10 measured at 2mm/h — below flood threshold. Classified as false positive.',
  },
];

async function seedDemoIncidents() {
  console.log('[Seed] Seeding demo incidents...');
  for (const incident of DEMO_INCIDENTS) {
    await db.insert('incidents', incident);
  }

  // Seed demo agent traces
  for (const incident of DEMO_INCIDENTS.filter(i => i.status !== 'retracted')) {
    const trace = buildDemoTrace(incident);
    await db.insert('agent_traces', {
      id: uuidv4(),
      incident_id: incident.id,
      trace: JSON.stringify(trace),
      total_time_ms: Math.round(2800 + Math.random() * 1200),
    });
  }
  console.log('[Seed] Done ✓');
}

function buildDemoTrace(incident) {
  return [
    { step: 1, agent: 'Signal Collection Agent', timestamp: new Date().toISOString(), result: { location_extracted: incident.location, language_detected: 'roman_urdu', urgency: incident.severity_level === 'CRITICAL' ? 'critical' : 'high', reasoning: `Extracted location ${incident.location}. Detected Roman Urdu report. Weather corroborates signal.` } },
    { step: 2, agent: 'Verification Agent', timestamp: new Date().toISOString(), result: { verified: true, corroboration_score: incident.confidence, cross_checks: ['weather_api', 'traffic_anomaly', 'image_detection'], reasoning: 'Multiple corroborating signals found. Report validated.' } },
    { step: 3, agent: 'Crisis Detection Agent', timestamp: new Date().toISOString(), result: { crisis_type: incident.crisis_type, confidence: incident.confidence, reasoning: `${incident.crisis_type} detected with ${Math.round(incident.confidence * 100)}% confidence based on signal fusion.` } },
    { step: 4, agent: 'Severity Analysis Agent', timestamp: new Date().toISOString(), result: { severity_level: incident.severity_level, severity_score: incident.severity_score, reasoning: `Severity ${incident.severity_level} based on population density, weather intensity, and infrastructure vulnerability.` } },
    { step: 5, agent: 'Resource Allocation Agent', timestamp: new Date().toISOString(), result: { allocated_resources: JSON.parse(incident.allocated_resources), reasoning: 'Resources selected based on proximity, equipment suitability, and availability.' } },
    { step: 6, agent: 'Action Planning Agent', timestamp: new Date().toISOString(), result: { actions_count: incident.actions_count, reasoning: 'Coordinated action plan generated with traffic rerouting, emergency dispatch, and citizen alerts.' } },
    { step: 7, agent: 'Action Execution Agent', timestamp: new Date().toISOString(), result: { ticket_id: incident.ticket_id, actions_executed: incident.actions_count, simulated_alerts_sent: incident.citizens_alerted, reasoning: 'All actions executed in simulation. Systems updated.' } },
    { step: 8, agent: 'Outcome Simulation Agent', timestamp: new Date().toISOString(), result: { containment_probability_pct: 78, improvement_summary: `Intervention reduced response time by 68%, ${incident.citizens_alerted?.toLocaleString()} citizens alerted.`, reasoning: 'Before/after comparison shows significant improvement with intervention.' } },
  ];
}

module.exports = { seedDemoIncidents };
