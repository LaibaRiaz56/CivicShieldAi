const express = require('express');
const router = express.Router();
const { geminiChat } = require('../services/gemini');
const db = require('../services/db');
const { getWeather } = require('../services/weather');
const { getTrafficConditions } = require('../services/traffic');

const CITIZEN_SYSTEM_PROMPT = `You are CivicShield AI, a multilingual emergency response assistant for Pakistani citizens.

You help citizens with:
- Real-time crisis information (floods, fires, accidents)
- Safety advice during emergencies
- Nearest hospitals, emergency numbers, safe routes
- Status of active incidents in their area
- Urdu, Roman Urdu, and English communication

You ALWAYS respond in the same language as the user's query.
For Roman Urdu queries, respond in Roman Urdu.
For Urdu script, respond in Urdu.
For English, respond in English.

Emergency numbers in Pakistan:
- Rescue 1122 (Punjab)
- Edhi Foundation: 115
- Police: 15
- Ambulance: 1122 / 115
- Fire Brigade: 16
- NDMA: 051-9205037

Current active system: CivicShield AI — Real-time Crisis Intelligence Platform`;

const OPERATOR_SYSTEM_PROMPT = `You are CivicShield AI Operator Assistant, an advanced emergency management AI for authorized personnel.

You provide:
- Active incident summaries with severity and confidence scores
- Resource availability and deployment status
- AI agent reasoning explanations
- Decision support for resource allocation
- Evidence analysis from image detections and field reports
- System performance metrics

Always be precise and data-driven. Reference specific incident IDs, resource names, and confidence scores when available.`;

// POST /api/chat — chatbot endpoint
router.post('/', async (req, res, next) => {
  try {
    const { message, role = 'citizen', history = [], incidentId } = req.body;

    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    // Gather context
    const [weather, { data: incidents }, trafficData] = await Promise.all([
      getWeather(),
      db.getAll('incidents'),
      Promise.resolve(getTrafficConditions()),
    ]);

    const activeIncidents = (incidents || []).filter(i => i.status === 'active').slice(0, 5);
    const severeCrises = activeIncidents.filter(i => ['HIGH', 'CRITICAL'].includes(i.severity_level));

    // Build context string
    const contextStr = `
Current Weather in Islamabad: ${weather.description}, ${weather.temp_celsius}°C, Rainfall: ${weather.rainfall_mm}mm/h
Active Incidents: ${activeIncidents.length} (${severeCrises.length} high/critical)
Active Incident Summary: ${activeIncidents.map(i => `[${i.ticket_id || i.id.slice(0,8)}] ${i.crisis_type} at ${i.location} — ${i.severity_level}`).join(' | ')}
Traffic: ${trafficData.filter(r => r.status !== 'NORMAL').map(r => `${r.name}: ${r.status}`).join(', ') || 'No major disruptions'}`;

    const systemPrompt = (role === 'operator' ? OPERATOR_SYSTEM_PROMPT : CITIZEN_SYSTEM_PROMPT) + '\n\nLIVE SYSTEM CONTEXT:\n' + contextStr;

    // Build conversation history for Gemini
    const userPrompt = message;
    const reply = await geminiChat(systemPrompt, userPrompt);

    // Detect if location clarification needed
    const needsClarification = /yahan|idhar|here|wahan|there/i.test(message) && !/G-\d+|F-\d+|I-\d+|H-\d+|karachi|lahore|rawalpindi/i.test(message);

    res.json({
      reply,
      clarification_needed: needsClarification,
      clarification_prompt: needsClarification ? 'براہ کرم اپنا سیکٹر یا علاقہ بتائیں (e.g., G-10, F-8)' : null,
      active_incidents_count: activeIncidents.length,
      weather_context: { description: weather.description, temp: weather.temp_celsius, rain: weather.rainfall_mm },
    });
  } catch (err) { next(err); }
});

module.exports = router;
