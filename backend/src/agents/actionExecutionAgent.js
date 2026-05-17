  const { v4: uuidv4 } = require('uuid');
const db = require('../services/db');

async function runActionExecutionAgent({ actionPlan, crisisDetection, severityAnalysis, resourceAllocation, incidentId }) {
  const ticketId = 'CS-' + Math.floor(Math.random() * 90000 + 10000);
  const executionLog = [];
  const startTime = Date.now();

  // Simulate executing each action with timestamps
  for (let i = 0; i < (actionPlan.actions || []).length; i++) {
    const action = actionPlan.actions[i];
    const delay = i * 2; // seconds apart in simulation
    executionLog.push({
      seq: i + 1,
      time_offset_seconds: delay,
      action_type: action.type,
      detail: action.detail,
      responsible_agency: action.responsible_agency,
      status: 'executed',
      simulated: true,
    });
  }

  // Update incident state in DB
  const incidentUpdate = {
    status: 'active',
    ticket_id: ticketId,
    severity_level: severityAnalysis.severity_level,
    severity_score: severityAnalysis.severity_score,
    crisis_type: crisisDetection.crisis_type,
    confidence: crisisDetection.confidence,
    allocated_resources: JSON.stringify(resourceAllocation.allocated_resources || []),
    actions_count: (actionPlan.actions || []).length,
    citizens_alerted: severityAnalysis.estimated_affected_people || 0,
    execution_completed_at: new Date().toISOString(),
  };

  if (incidentId) {
    const { data: updated } = await db.update('incidents', incidentId, incidentUpdate);
    // Broadcast real-time update to all connected SSE clients
    try {
      const { broadcastIncidentUpdate } = require('../routes/incidents');
      if (updated?.[0]) broadcastIncidentUpdate(updated[0]);
    } catch { /* SSE broadcast optional */ }
  }

  // Store alerts in DB
  const alertsToStore = [
    {
      id: uuidv4(),
      incident_id: incidentId,
      type: 'citizen_sms',
      message_urdu: actionPlan.citizen_alert_message_urdu,
      message_english: actionPlan.citizen_alert_message_english,
      recipients_count: severityAnalysis.estimated_affected_people || 0,
      delivered: true,
      simulated: true,
    },
  ];

  for (const alert of alertsToStore) {
    await db.insert('alerts', alert);
  }

  const executionTime = Date.now() - startTime;

  return {
    ticket_id: ticketId,
    execution_status: 'completed',
    actions_executed: executionLog.length,
    systems_updated: ['incident_dashboard', 'dispatch_system', 'traffic_management', 'alert_system', 'hospital_system'],
    simulated_alerts_sent: severityAnalysis.estimated_affected_people || 0,
    execution_log: executionLog,
    execution_time_ms: executionTime,
    incident_id: incidentId,
    agent: 'action_execution',
    timestamp: new Date().toISOString(),
  };
}

module.exports = { runActionExecutionAgent };
