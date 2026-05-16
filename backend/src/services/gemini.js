const Groq = require('groq-sdk');

const apiKey = process.env.GROQ_API_KEY || '';
// Only use mock when key is missing or is one of the placeholder values
const isMock = !apiKey
  || apiKey === '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'
  || apiKey.length < 20;

let groq;
if (!isMock) {
  groq = new Groq({ apiKey });
}

const MODEL = 'llama-3.3-70b-versatile';

/**
 * Send a prompt to Groq (llama-3.3-70b-versatile) and return the text response.
 * Falls back to structured mock responses when no API key is configured.
 * Exported as geminiChat to keep all agent imports unchanged.
 */
async function geminiChat(systemPrompt, userPrompt) {
  if (isMock) {
    return mockGroqResponse(systemPrompt, userPrompt);
  }
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    return completion.choices[0]?.message?.content || '';
  } catch (err) {
    console.error('[Groq Error]', err.message);
    return mockGroqResponse(systemPrompt, userPrompt);
  }
}

// ── Structured mock responses per agent ───────────────────────────────────────
function mockGroqResponse(systemPrompt, userPrompt) {
  const sp = systemPrompt.toLowerCase();

  if (sp.includes('signal collection')) {
    return JSON.stringify({
      normalized_signals: [{ type: 'citizen_report', content: userPrompt, confidence: 0.85 }],
      location_extracted: extractLocation(userPrompt) || 'G-10, Islamabad',
      language_detected: detectLanguage(userPrompt),
      crisis_hints: inferCrisisHints(userPrompt),
      urgency: 'high',
      weather_relevance: 'high — active rainfall matches report',
      traffic_relevance: 'moderate — congestion spike on Kashmir Highway',
      signal_count: 1,
      reasoning: 'Detected Roman Urdu text report with location reference. Weather API confirms heavy rainfall. Traffic anomaly corroborates.',
    });
  }

  if (sp.includes('verification')) {
    return JSON.stringify({
      verified: true,
      confidence_adjustment: +0.1,
      cross_checks: ['weather_api_matches', 'traffic_slowdown_detected', 'multiple_nearby_reports'],
      misinformation_flag: false,
      retract: false,
      corroboration_score: 0.88,
      low_confidence_reason: null,
      reasoning: 'Report is corroborated by current weather data showing heavy rainfall (72mm/h) and 2 nearby citizen reports within 500m. Traffic slowdown of 78% on Kashmir Highway further confirms.',
    });
  }

  if (sp.includes('crisis detection')) {
    const crisis = inferCrisisFromText(userPrompt);
    return JSON.stringify({
      crisis_type: crisis,
      confidence: 0.91,
      secondary_types: crisis === 'urban_flooding' ? ['road_obstruction'] : ['road_accident'],
      evidence: ['heavy_rainfall_72mm/h', 'citizen_reports_x3', 'traffic_anomaly_78%', 'yolo_detection_confirmed'],
      trend: 'worsening',
      is_active: true,
      crisis_id_suggestion: crisis.toUpperCase().replace('_', '-') + '-' + Math.floor(Math.random() * 1000),
      reasoning: `High-confidence ${crisis} detected: signal fusion from weather API, traffic data, and image analysis all corroborate. Confidence: 91%.`,
    });
  }

  if (sp.includes('severity')) {
    return JSON.stringify({
      severity_level: 'HIGH',
      severity_score: 8.2,
      affected_radius_km: 2.5,
      estimated_affected_people: 12000,
      nearby_hospitals: ['PIMS Hospital (3.2km)', 'Polyclinic Hospital (4.1km)'],
      congestion_increase_pct: 65,
      vulnerability_factors: ['dense_residential_area', 'poor_drainage_infrastructure', 'school_within_400m'],
      compounding_factors: ['heavy_rainfall_persisting', 'rush_hour_traffic'],
      priority_actions_needed: ['rescue_boat_deployment', 'traffic_rerouting', 'citizen_evacuation_alert'],
      reasoning: 'G-10 is a densely populated residential sector (85,000 residents) with documented poor drainage capacity. A school is within 400m. PIMS is nearest hospital at 3.2km. Rush hour compounds severity.',
    });
  }

  if (sp.includes('resource allocation')) {
    return JSON.stringify({
      allocated_resources: [
        { id: 'RB-003', type: 'rescue_boat', name: 'Rescue Boat Charlie', eta_minutes: 6, reason: 'Nearest rescue boat stationed at G-11 depot, 2.1km from incident' },
        { id: 'AMB-001', type: 'ambulance', name: 'Ambulance Unit 1', eta_minutes: 5, reason: 'Closest ambulance at G-9 base, currently idle' },
        { id: 'FB-001', type: 'fire_brigade', name: 'Fire Brigade Alpha', eta_minutes: 10, reason: 'Equipped with water pumps suitable for flood drainage assistance' },
      ],
      total_resources: 3,
      reroute_roads: ['Kashmir Highway (alternate via Srinagar Hwy)', 'IJP Road (divert to Peshawar Road)'],
      hospitals_on_alert: ['PIMS Hospital', 'Polyclinic Hospital'],
      estimated_deployment_time_minutes: 6,
      reasoning: 'Selected 3 resources based on proximity, equipment suitability, and current availability. Rescue Boat Charlie has fastest ETA. PIMS and Polyclinic put on standby for potential flood casualties.',
    });
  }

  if (sp.includes('action planning')) {
    return JSON.stringify({
      actions: [
        { type: 'emergency_dispatch', detail: 'Deploy Rescue Boat Charlie + Ambulance Unit 1 to G-10/3 Street 15', priority: 1, estimated_time_minutes: 2, responsible_agency: 'Rescue 1122' },
        { type: 'citizen_alert', detail: 'Send SMS + push notification to 12,000 residents in G-10 sector', priority: 1, estimated_time_minutes: 1, responsible_agency: 'PTA / Emergency Cell' },
        { type: 'traffic_reroute', detail: 'Redirect G-10 traffic to Kashmir Highway via Srinagar Highway interchange', priority: 2, estimated_time_minutes: 5, responsible_agency: 'Islamabad Traffic Police' },
        { type: 'road_blockade', detail: 'Close G-10/2 main road at Nazimuddin Road junction — set safety barriers', priority: 2, estimated_time_minutes: 8, responsible_agency: 'Islamabad Police' },
        { type: 'hospital_alert', detail: 'Pre-alert PIMS and Polyclinic for potential flood victims — prepare trauma bays', priority: 2, estimated_time_minutes: 3, responsible_agency: 'Ministry of Health' },
        { type: 'drainage_activation', detail: 'Activate emergency drainage pumps at G-10 stormwater stations via CDA Water', priority: 3, estimated_time_minutes: 15, responsible_agency: 'CDA Water Directorate' },
      ],
      citizen_alert_message_urdu: '🚨 ہنگامی اطلاع: G-10 میں شدید سیلاب۔ گھروں میں رہیں، پانی میں نہ چلیں۔ ریسکیو ٹیم راستے میں ہے۔',
      citizen_alert_message_english: '🚨 EMERGENCY: Severe flooding in G-10. Stay indoors, avoid walking in water. Rescue teams are en route. Call 1122 if trapped.',
      emergency_ticket_summary: 'URBAN FLOODING — G-10, Islamabad | Severity: HIGH | Confidence: 91% | Resources: 3 units deployed',
      estimated_total_response_minutes: 14,
      coordinating_agency: 'NDMA / CDA Emergency Cell',
      reasoning: 'Actions ordered by life-safety priority. Dispatch and alert are simultaneous first actions. Traffic rerouting follows to clear path for rescue teams.',
    });
  }

  if (sp.includes('execution')) {
    return JSON.stringify({
      execution_status: 'completed',
      ticket_id: 'CS-' + Math.floor(Math.random() * 90000 + 10000),
      actions_executed: 6,
      systems_updated: ['incident_dashboard', 'dispatch_system', 'traffic_management', 'alert_system', 'hospital_system', 'drainage_control'],
      simulated_alerts_sent: 12000,
      execution_log: [
        { time: '0s', action: 'Rescue Boat Charlie — dispatched to G-10/3', status: 'done' },
        { time: '1s', action: 'SMS alert — 12,000 citizens notified', status: 'done' },
        { time: '2s', action: 'Kashmir Highway reroute — activated', status: 'done' },
        { time: '4s', action: 'G-10/2 road blockade — barriers deployed', status: 'done' },
        { time: '5s', action: 'PIMS Hospital — flood victim alert sent', status: 'done' },
        { time: '8s', action: 'CDA drainage pumps — activation requested', status: 'done' },
      ],
      reasoning: 'All 6 planned actions executed successfully in simulation environment. All systems updated.',
    });
  }

  if (sp.includes('outcome') || sp.includes('what-if')) {
    return JSON.stringify({
      scenario_no_action: {
        congestion_increase_pct: 65,
        response_delay_minutes: 60,
        estimated_casualties: 8,
        flood_spread_km2: 4.2,
        economic_loss_pkr: 25000000,
        label: 'No Intervention',
      },
      scenario_with_intervention: {
        congestion_reduction_pct: 40,
        response_time_minutes: 14,
        estimated_casualties_prevented: 7,
        containment_pct: 78,
        citizens_alerted: 12000,
        economic_loss_pkr: 8000000,
        label: 'Immediate Intervention (Current)',
      },
      scenario_delayed: {
        congestion_increase_pct: 91,
        response_delay_minutes: 45,
        estimated_casualties: 5,
        flood_spread_km2: 6.8,
        economic_loss_pkr: 17000000,
        label: '30-min Delayed Response',
      },
      improvement_summary: 'Proactive intervention reduces estimated casualties by 87.5%, cuts response time by 76.7%, saves PKR 1.7 crore, and alerts 12,000 citizens in time.',
      what_if_statements: [
        'If no action is taken, congestion may increase by 65% within 60 minutes.',
        'Traffic rerouting could reduce emergency response delays by 40%.',
        'A 30-minute delay in response could result in 5 additional casualties.',
        'Immediate rescue boat deployment can reach stranded citizens within 14 minutes.',
        'Proactive intervention reduces economic loss from PKR 2.5 crore to PKR 0.8 crore.',
      ],
      containment_probability_pct: 78,
      key_metrics: {
        lives_protected: 7,
        response_efficiency_pct: 87,
        resource_utilization_pct: 91,
        cost_savings_pkr: 17000000,
      },
      reasoning: 'Based on historical Islamabad flood data (2022-2024), G-10 sector infrastructure vulnerability index, and NDMA response time benchmarks.',
    });
  }

  if (sp.includes('chatbot') || sp.includes('assistant') || sp.includes('operator')) {
    return buildChatbotResponse(userPrompt);
  }

  return JSON.stringify({ status: 'ok', reasoning: 'Agent processed successfully via mock Groq.' });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractLocation(text = '') {
  const match = text.match(/\b([A-Z]-\d+|G-\d+|F-\d+|I-\d+|H-\d+|Islamabad|Lahore|Karachi|Rawalpindi|Motorway|motorway)\b/i);
  return match ? match[0] + ', Islamabad' : null;
}

function detectLanguage(text = '') {
  if (/[\u0600-\u06FF]/.test(text)) return 'urdu';
  if (/\b(mein|hai|hua|bohat|pani|aag|dhuaan|ke|pe|ka|ki|gaya|raha)\b/i.test(text)) return 'roman_urdu';
  return 'english';
}

function inferCrisisHints(text = '') {
  const hints = [];
  const t = text.toLowerCase();
  if (/pani|flood|baarish|barah/.test(t)) hints.push('urban_flooding');
  if (/aag|fire|blast|dhamaka/.test(t)) hints.push('fire');
  if (/dhuaan|smoke/.test(t)) hints.push('smoke_fire');
  if (/transformer|bijli|electricity/.test(t)) hints.push('transformer_explosion');
  if (/garmi|heat|garam/.test(t)) hints.push('heatwave');
  if (/accident|crash|takkar/.test(t)) hints.push('road_accident');
  return hints;
}

function inferCrisisFromText(text = '') {
  const hints = inferCrisisHints(text);
  return hints[0] || 'urban_flooding';
}

function buildChatbotResponse(query = '') {
  const q = query.toLowerCase();
  if (/g-10|g10/.test(q) && /safe|travel|jana/.test(q)) {
    return 'G-10 mein abhi urban flooding ki emergency hai (Severity: HIGH). Is waqt G-10 safar karna SAFE NAHI hai. Kashmir Highway ya Srinagar Highway use karein. Rescue teams kaam kar rahi hain.';
  }
  if (/block|band|rasta|road/.test(q)) {
    return '🚧 Currently blocked roads:\n• G-10/2 at Nazimuddin Road junction\n• G-10 Markaz access roads\n\nAlternate routes: Kashmir Highway → Srinagar Hwy interchange';
  }
  if (/hospital|clinic|doctor/.test(q)) {
    return '🏥 Nearest hospitals:\n1. PIMS Hospital — G-8 (3.2km)\n2. Polyclinic Hospital — G-6 (4.1km)\n3. Shifa International — H-8 (5km)\n\nEmergency: 051-9261170 (PIMS)';
  }
  if (/transformer|bijli|fire|kya karun|kya karana/.test(q)) {
    return '⚡ Transformer fire safety:\n1. Area se duur rahein (minimum 50 meters)\n2. Bijli ka koi bhi cheez mat chhuein\n3. IESCO call karein: 051-9252238\n4. Fire Brigade: 16\n5. Rescue 1122 call karein\n\nKisi bhi zakhmi shakhsh ke paas mat jayein — pehle professionals ka wait karein.';
  }
  return 'CivicShield AI yahan hai aapki madad ke liye. Abhi Islamabad mein:\n• G-10: Urban Flooding (HIGH severity) — 3 rescue units deployed\n• F-8: Transformer explosion (CRITICAL) — contained\n\nKoi emergency ho toh 1122 call karein. Aur koi information chahiye?';
}

module.exports = { geminiChat };
