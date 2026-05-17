const express = require('express');
const router = express.Router();
const { geminiChat } = require('../services/gemini');
const db = require('../services/db');
const { getWeather } = require('../services/weather');
const { getTrafficConditions } = require('../services/traffic');

const CITIZEN_SYSTEM_PROMPT = `You are CivicShield AI, a multilingual emergency response assistant for Pakistani citizens.

You help citizens with:
- Real-time crisis information (floods, fires, accidents, transformer explosions)
- Safety advice during emergencies
- Nearest hospitals, emergency numbers, and safe routes
- Status of active incidents in their specific area
- Urdu, Roman Urdu, and English communication

LANGUAGE RULES:
- ALWAYS respond in the same language as the user's query
- Roman Urdu → respond in Roman Urdu
- Urdu script → respond in Urdu
- English → respond in English

CRITICAL BEHAVIOR:
- ALWAYS check the active incidents list for the EXACT location the user asks about
- If user asks about I-10, check incidents in I-10 ONLY — do NOT answer with G-10 information
- If no incident at the mentioned location, say it's clear
- Be specific with incident details (severity, confidence, actions taken)
- Never make up incidents that are not in the active incidents list

Emergency numbers (Pakistan):
- Rescue 1122 (Punjab) | Edhi Foundation: 115 | Police: 15
- Ambulance: 1122 / 115 | Fire Brigade: 16 | NDMA: 051-9205037`;

const OPERATOR_SYSTEM_PROMPT = `You are CivicShield AI Operator Assistant for authorized emergency management personnel.

Provide:
- Active incident summaries with severity and confidence scores
- Resource availability and deployment status  
- AI agent reasoning explanations
- Decision support for resource allocation
- Evidence analysis from image detections and field reports
- System performance metrics

Always be precise and data-driven. Reference specific incident IDs, resource names, and confidence scores.`;

// POST /api/chat — chatbot endpoint
router.post('/', async (req, res, next) => {
  try {
    const { message, role = 'citizen', history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    // Gather live context in parallel
    const [weather, { data: allIncidents }, trafficData] = await Promise.all([
      getWeather(),
      db.getAll('incidents'),
      Promise.resolve(getTrafficConditions()),
    ]);

    const activeIncidents = (allIncidents || [])
      .filter(i => i.status === 'active' || i.status === 'contained')
      .slice(0, 8);

    const severeCrises = activeIncidents.filter(i => ['HIGH', 'CRITICAL'].includes(i.severity_level));

    // Extract location from user's message for targeted lookup
    const locationMentioned = extractLocationFromQuery(message);
    const incidentsAtLocation = locationMentioned
      ? activeIncidents.filter(i => i.location && i.location.toLowerCase().includes(locationMentioned.toLowerCase()))
      : [];

    // Build rich context string
    const allIncidentSummary = activeIncidents.map(i =>
      `[${i.ticket_id || i.id?.slice(0,8)}] ${i.crisis_type} at ${i.location} — Severity: ${i.severity_level}, Confidence: ${Math.round((i.confidence || 0) * 100)}%, Status: ${i.status}, Citizens alerted: ${(i.citizens_alerted || 0).toLocaleString()}`
    ).join('\n');

    const locationContext = locationMentioned
      ? `\nUser is asking about: ${locationMentioned}\nIncidents at ${locationMentioned}: ${incidentsAtLocation.length === 0 ? 'NONE — area is clear' : incidentsAtLocation.map(i => `${i.crisis_type} (${i.severity_level})`).join(', ')}`
      : '';

    const contextStr = `
Current Weather in Islamabad: ${weather.description}, ${weather.temp_celsius}°C, Rainfall: ${weather.rainfall_mm}mm/h
Active & Contained Incidents (${activeIncidents.length} total, ${severeCrises.length} HIGH/CRITICAL):
${allIncidentSummary || 'No active incidents'}
Traffic: ${trafficData.filter(r => r.status !== 'NORMAL').map(r => `${r.name}: ${r.status}`).join(', ') || 'No disruptions'}${locationContext}`;

    const systemPrompt = (role === 'operator' ? OPERATOR_SYSTEM_PROMPT : CITIZEN_SYSTEM_PROMPT)
      + '\n\n=== LIVE SYSTEM CONTEXT ===\n' + contextStr
      + '\n\nIMPORTANT: Answer based ONLY on the actual incidents listed above. Do not hallucinate incidents.';

    // Convert history format for Groq (role: user/assistant)
    const groqHistory = (history || []).slice(-8).map(h => ({
      role: h.role === 'ai' ? 'assistant' : 'user',
      content: h.text,
    }));

    const reply = await geminiChat(systemPrompt, message, groqHistory);

    // Detect if location clarification needed
    const needsClarification = /yahan|idhar|here|wahan|there/i.test(message)
      && !/G-\d+|F-\d+|I-\d+|H-\d+|karachi|lahore|rawalpindi/i.test(message);

    res.json({
      reply,
      clarification_needed: needsClarification,
      clarification_prompt: needsClarification ? 'براہ کرم اپنا سیکٹر یا علاقہ بتائیں (e.g., G-10, F-8)' : null,
      active_incidents_count: activeIncidents.length,
      location_mentioned: locationMentioned,
      incidents_at_location: incidentsAtLocation.length,
      weather_context: { description: weather.description, temp: weather.temp_celsius, rain: weather.rainfall_mm },
    });
  } catch (err) { next(err); }
});

// ─── Helper: extract location from query ─────────────────────────────────────
function extractLocationFromQuery(text = '') {
  // Pakistani sector patterns: G-10, F-8, I-10, H-11, etc.
  const sectorMatch = text.match(/\b([A-Z]-\d{1,2}|[A-Z]\d{1,2})\b/i);
  if (sectorMatch) return sectorMatch[0].toUpperCase();

  // City names
  const cityMatch = text.match(/\b(islamabad|lahore|karachi|rawalpindi|peshawar|quetta)\b/i);
  if (cityMatch) return cityMatch[0].charAt(0).toUpperCase() + cityMatch[0].slice(1).toLowerCase();

  // Pakistani areas in Roman Urdu
  const areaMatch = text.match(/\b(margalla|saidpur|rawal|tramri|pir wadhai|faizabad|aabpara|kachehri|bara kahu)\b/i);
  if (areaMatch) return areaMatch[0];

  return null;
}

module.exports = router;
