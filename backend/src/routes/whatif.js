const express = require('express');
const router = express.Router();
const { runOutcomeSimulationAgent } = require('../agents/outcomeSimulationAgent');
const db = require('../services/db');

// GET /api/whatif/:incidentId
router.get('/:incidentId', async (req, res, next) => {
  try {
    const { data: incident } = await db.selectOne('incidents', req.params.incidentId);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    // Build minimal contexts for outcome simulation
    const crisisDetection  = { crisis_type: incident.crisis_type, confidence: incident.confidence };
    const severityAnalysis = { severity_level: incident.severity_level, severity_score: incident.severity_score, estimated_affected_people: 10000, congestion_increase_pct: 65 };
    const resourceAllocation = { allocated_resources: JSON.parse(incident.allocated_resources || '[]') };
    const actionPlan       = { estimated_total_response_minutes: 15, actions: [] };
    const executionResult  = { actions_executed: incident.actions_count || 5, simulated_alerts_sent: incident.citizens_alerted || 10000 };

    const outcome = await runOutcomeSimulationAgent({ crisisDetection, severityAnalysis, resourceAllocation, actionPlan, executionResult });

    res.json({ incident_id: req.params.incidentId, crisis_type: incident.crisis_type, outcome });
  } catch (err) { next(err); }
});

module.exports = router;
