const express = require('express');
const router = express.Router();
const db = require('../services/db');

// GET /api/agents/trace/:incidentId
router.get('/trace/:incidentId', async (req, res, next) => {
  try {
    const { data: traces } = await db.select('agent_traces', { incident_id: req.params.incidentId });
    if (!traces || traces.length === 0) return res.status(404).json({ error: 'No trace found for this incident' });
    const trace = traces[0];
    res.json({
      incident_id: req.params.incidentId,
      trace_id: trace.id,
      total_time_ms: trace.total_time_ms,
      steps: JSON.parse(trace.trace || '[]'),
    });
  } catch (err) { next(err); }
});

// GET /api/agents/traces — list all traces (for dashboard)
router.get('/traces', async (req, res, next) => {
  try {
    const { data } = await db.getAll('agent_traces');
    res.json({ traces: (data || []).slice(0, 20) });
  } catch (err) { next(err); }
});

module.exports = router;
