const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { seedDemoIncidents } = require('../utils/seedData');

// GET /api/incidents — list all active incidents
router.get('/', async (req, res, next) => {
  try {
    // Auto-seed if empty (for demo)
    const { data: existing } = await db.getAll('incidents');
    if (!existing || existing.length === 0) await seedDemoIncidents();

    const { data, error } = await db.getAll('incidents');
    if (error) return res.status(500).json({ error });

    const incidents = (data || [])
      .filter(i => i.status !== 'processing')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ incidents, count: incidents.length });
  } catch (err) { next(err); }
});

// GET /api/incidents/:id — get single incident with full details
router.get('/:id', async (req, res, next) => {
  try {
    const { data: incident, error } = await db.selectOne('incidents', req.params.id);
    if (error || !incident) return res.status(404).json({ error: 'Incident not found' });

    // Get associated trace
    const { data: traces } = await db.select('agent_traces', { incident_id: req.params.id });
    const trace = traces?.[0];

    // Get associated alerts
    const { data: alerts } = await db.select('alerts', { incident_id: req.params.id });

    res.json({
      incident,
      agent_trace: trace ? JSON.parse(trace.trace) : [],
      alerts: alerts || [],
      trace_id: trace?.id,
    });
  } catch (err) { next(err); }
});

// PATCH /api/incidents/:id/status — update incident status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['active', 'contained', 'resolved', 'retracted'];
    if (!valid.includes(status)) return res.status(400).json({ error: `Status must be one of: ${valid.join(', ')}` });

    const { data, error } = await db.update('incidents', req.params.id, { status });
    if (error) return res.status(500).json({ error });
    res.json({ success: true, incident: data?.[0] });
  } catch (err) { next(err); }
});

module.exports = router;
