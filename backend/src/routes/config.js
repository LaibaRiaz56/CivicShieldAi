const express = require('express');
const router = express.Router();
const os = require('os');

// Detect LAN IP
function getLanIP() {
  const nets = os.networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const i of iface) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return 'localhost';
}

// GET /api/config — service status & connectivity info
router.get('/', (req, res) => {
  const groqKey = process.env.GROQ_API_KEY || '';
  const hasGroq = groqKey.length >= 20 && groqKey !== 'your_groq_api_key_here';
  const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'your_supabase_url_here');
  const hasWeather = !!(process.env.OPENWEATHER_API_KEY);

  const lanIP = getLanIP();

  res.json({
    status: 'ok',
    service: 'CivicShield AI',
    version: '2.0.0',
    lan_ip: lanIP,
    port: process.env.PORT || 4000,
    mode: hasGroq ? 'live_ai' : 'demo',
    timestamp: new Date().toISOString(),
    services: {
      groq_ai:    { active: hasGroq,     label: hasGroq ? 'Live — llama-3.3-70b' : 'Demo mode' },
      supabase:   { active: hasSupabase, label: hasSupabase ? 'Connected' : 'Mock DB (in-memory)' },
      weather:    { active: hasWeather,  label: hasWeather ? 'OpenWeather connected' : 'Simulated' },
      ml_service: { active: false,       label: 'YOLOv8 — startup pending' },
      agents:     { active: true,        label: '8 agents active' },
    },
    endpoints: {
      health:    '/health',
      incidents: '/api/incidents',
      reports:   '/api/reports',
      chat:      '/api/chat',
      stream:    '/api/incidents/stream',
      config:    '/api/config',
    },
  });
});

module.exports = router;
