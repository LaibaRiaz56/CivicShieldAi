require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── CORS — open to all origins for Expo/Android dev ─────────────────────────
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: '*' }));
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

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/reports',   require('./routes/reports'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/chat',      require('./routes/chat'));
app.use('/api/agents',    require('./routes/agents'));
app.use('/api/whatif',    require('./routes/whatif'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/alerts',    require('./routes/alerts'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'CivicShield AI', ts: new Date().toISOString() });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ─── Start — bind 0.0.0.0 so Android on LAN can reach it ─────────────────────
app.listen(PORT, '0.0.0.0', async () => {
  const os = require('os');
  const nets = os.networkInterfaces();
  let lanIP = 'localhost';
  for (const iface of Object.values(nets)) {
    for (const i of iface) {
      if (i.family === 'IPv4' && !i.internal) { lanIP = i.address; break; }
    }
  }

  console.log(`\n🛡️  CivicShield AI Backend — port ${PORT}`);
  console.log(`   LAN (Android):  http://${lanIP}:${PORT}/health`);
  console.log(`   Local:          http://localhost:${PORT}/health\n`);

  // Auto-seed demo data on startup
  try {
    const db = require('./services/db');
    const { seedDemoIncidents } = require('./utils/seedData');
    const { data: existing } = await db.getAll('incidents');
    if (!existing || existing.length === 0) {
      await seedDemoIncidents();
      console.log('[Seed] Demo incidents seeded ✓\n');
    }
  } catch (e) {
    console.error('[Seed] Error:', e.message);
  }
});

module.exports = app;
