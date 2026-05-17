const express = require('express');
const router = express.Router();
const db = require('../services/db');

// SSE clients registry
const sseClients = new Set();

// ─── SSE stream — real-time incident updates ─────────────────────────────────
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send initial ping
  res.write('event: ping\ndata: connected\n\n');

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Export broadcast function for other routes to call
function broadcastIncidentUpdate(incident) {
  const payload = JSON.stringify({ type: 'incident_update', incident });
  for (const client of sseClients) {
    try { client.write(`event: incident\ndata: ${payload}\n\n`); } catch { sseClients.delete(client); }
  }
}

// ─── GET /api/incidents — list incidents ─────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await db.getAll('incidents');
    if (error) return res.status(500).json({ error });

    const incidents = (data || [])
      .filter(i => i.status !== 'processing')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ incidents, count: incidents.length });
  } catch (err) { next(err); }
});

// ─── GET /api/incidents/stats — dashboard counters ───────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const { data, error } = await db.getAll('incidents');
    if (error) return res.status(500).json({ error });

    const all = data || [];
    const active   = all.filter(i => i.status === 'active');
    const critical = all.filter(i => i.severity_level === 'CRITICAL' && i.status !== 'retracted');
    const alerted  = all.reduce((s, i) => s + (i.citizens_alerted || 0), 0);

    res.json({
      active:   active.length,
      critical: critical.length,
      alerted,
      total:    all.length,
      contained: all.filter(i => i.status === 'contained').length,
      resolved:  all.filter(i => i.status === 'resolved').length,
    });
  } catch (err) { next(err); }
});

// ─── GET /api/incidents/:id — single incident with trace ────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { data: incident, error } = await db.selectOne('incidents', req.params.id);
    if (error || !incident) return res.status(404).json({ error: 'Incident not found' });

    const { data: traces } = await db.select('agent_traces', { incident_id: req.params.id });
    const trace = traces?.[0];
    const { data: alerts } = await db.select('alerts', { incident_id: req.params.id });

    res.json({
      incident,
      agent_trace: trace ? JSON.parse(trace.trace) : [],
      alerts: alerts || [],
      trace_id: trace?.id,
    });
  } catch (err) { next(err); }
});

// ─── PATCH /api/incidents/:id/status ─────────────────────────────────────────
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['active', 'contained', 'resolved', 'retracted'];
    if (!valid.includes(status)) return res.status(400).json({ error: `Status must be: ${valid.join(', ')}` });

    const { data, error } = await db.update('incidents', req.params.id, { status });
    if (error) return res.status(500).json({ error });

    // Broadcast status change to SSE clients
    if (data?.[0]) broadcastIncidentUpdate(data[0]);

    res.json({ success: true, incident: data?.[0] });
  } catch (err) { next(err); }
});

module.exports = router;
module.exports.broadcastIncidentUpdate = broadcastIncidentUpdate;
