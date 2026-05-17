require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const fileUpload = require('express-fileupload');
const os = require('os');

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── CORS — open to all origins for Expo/Android dev ────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PATCH','PUT','DELETE','OPTIONS'], allowedHeaders: '*' }));
app.options('*', cors());

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  useTempFiles: true,
  tempFileDir: '/tmp/',
  abortOnLimit: false,
}));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/reports',   require('./routes/reports'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/chat',      require('./routes/chat'));
app.use('/api/agents',    require('./routes/agents'));
app.use('/api/whatif',    require('./routes/whatif'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/alerts',    require('./routes/alerts'));  
app.use('/api/config',    require('./routes/config'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CivicShield AI',
    ts: new Date().toISOString(),
    ai_mode: (process.env.GROQ_API_KEY?.length >= 20) ? 'live' : 'demo',
  });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ─── Detect LAN IP ───────────────────────────────────────────────────────────
function getLanIP() {
  const nets = os.networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const i of iface) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return 'localhost';
}

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', async () => {
  const lanIP = getLanIP();

  console.log('\n🛡️  CivicShield AI Backend v2.0');
  console.log('─────────────────────────────────────────');
  console.log(`   Local:         http://localhost:${PORT}/health`);
  console.log(`   LAN (Android): http://${lanIP}:${PORT}/health`);
  console.log(`   AI Mode:       ${process.env.GROQ_API_KEY?.length >= 20 ? '🟢 LIVE (Groq llama-3.3-70b)' : '🟡 DEMO (mock responses)'}`);
  console.log('─────────────────────────────────────────\n');

  // Write LAN IP to a file so mobile app can discover it
  try {
    const fs = require('fs');
    fs.writeFileSync(
      require('path').join(__dirname, '../../.lanip'),
      JSON.stringify({ ip: lanIP, port: PORT, ts: new Date().toISOString() })
    );
  } catch { /* not critical */ }

  // Auto-seed demo incidents ONCE on startup if DB is empty
  try {
    const db = require('./services/db');
    const { seedDemoIncidents } = require('./utils/seedData');
    const { data: existing } = await db.getAll('incidents');
    if (!existing || existing.length === 0) {
      await seedDemoIncidents();
      console.log('[Seed] Demo incidents seeded ✓');
    } else {
      console.log(`[DB] ${existing.length} incidents already in database ✓`);
    }
  } catch (e) {
    console.error('[Seed] Error:', e.message);
  }
});

module.exports = app;
