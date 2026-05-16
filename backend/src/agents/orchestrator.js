/**
 * CivicShield AI — Main Agent Orchestrator
 * Runs all 8 agents in sequence, building a traceable pipeline.
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../services/db');
const { runSignalCollectionAgent }   = require('./signalCollectionAgent');
const { runVerificationAgent }        = require('./verificationAgent');
const { runCrisisDetectionAgent }     = require('./crisisDetectionAgent');
const { runSeverityAnalysisAgent }    = require('./severityAnalysisAgent');
const { runResourceAllocationAgent }  = require('./resourceAllocationAgent');
const { runActionPlanningAgent }      = require('./actionPlanningAgent');
const { runActionExecutionAgent }     = require('./actionExecutionAgent');
const { runOutcomeSimulationAgent }   = require('./outcomeSimulationAgent');

async function orchestrate({ report, audioTranscript, imageDetections, location, userId }) {
  const incidentId = uuidv4();
  const trace = [];
  const startTime = Date.now();

  const log = (step, agentName, result) => {
    console.log(`[${step}/8] ${agentName} ✓`);
    trace.push({ step, agent: agentName, result, timestamp: new Date().toISOString() });
  };

  try {
    // ── Create preliminary incident record ─────────────────────────────────
    await db.insert('incidents', {
      id: incidentId,
      status: 'processing',
      location: location || 'Unknown',
      report_text: report || audioTranscript || '',
      created_by: userId || 'anonymous',
    });

    // ── Step 1: Signal Collection ──────────────────────────────────────────
    const collectedSignals = await runSignalCollectionAgent({ report, imageDetections, audioTranscript, location });
    log(1, 'Signal Collection Agent', collectedSignals);

    // ── Step 2: Verification ──────────────────────────────────────────────
    const verificationResult = await runVerificationAgent({ collectedSignals, incidentId });
    log(2, 'Verification Agent', verificationResult);

    // Handle misinformation / retraction
    if (verificationResult.retract || verificationResult.misinformation_flag) {
      await db.update('incidents', incidentId, {
        status: 'retracted',
        retraction_reason: verificationResult.low_confidence_reason || 'Insufficient evidence',
      });
      await db.insert('agent_traces', { id: uuidv4(), incident_id: incidentId, trace: JSON.stringify(trace) });
      return { incident_id: incidentId, status: 'retracted', trace, reason: verificationResult.low_confidence_reason };
    }

    // ── Step 3: Crisis Detection ───────────────────────────────────────────
    const crisisDetection = await runCrisisDetectionAgent({ collectedSignals, verificationResult, imageDetections });
    log(3, 'Crisis Detection Agent', crisisDetection);

    // ── Step 4: Severity Analysis ──────────────────────────────────────────
    const severityAnalysis = await runSeverityAnalysisAgent({ crisisDetection, collectedSignals, imageDetections });
    log(4, 'Severity Analysis Agent', severityAnalysis);

    // ── Step 5: Resource Allocation ────────────────────────────────────────
    const resourceAllocation = await runResourceAllocationAgent({ crisisDetection, severityAnalysis, collectedSignals });
    log(5, 'Resource Allocation Agent', resourceAllocation);

    // ── Step 6: Action Planning ────────────────────────────────────────────
    const actionPlan = await runActionPlanningAgent({ crisisDetection, severityAnalysis, resourceAllocation, collectedSignals });
    log(6, 'Action Planning Agent', actionPlan);

    // ── Step 7: Action Execution ───────────────────────────────────────────
    const executionResult = await runActionExecutionAgent({ actionPlan, crisisDetection, severityAnalysis, resourceAllocation, incidentId });
    log(7, 'Action Execution Agent', executionResult);

    // ── Step 8: Outcome Simulation ─────────────────────────────────────────
    const outcomeSimulation = await runOutcomeSimulationAgent({ crisisDetection, severityAnalysis, resourceAllocation, actionPlan, executionResult });
    log(8, 'Outcome Simulation Agent', outcomeSimulation);

    // ── Save full trace ────────────────────────────────────────────────────
    await db.insert('agent_traces', {
      id: uuidv4(),
      incident_id: incidentId,
      trace: JSON.stringify(trace),
      total_time_ms: Date.now() - startTime,
    });

    // ── Final incident update ──────────────────────────────────────────────
    await db.update('incidents', incidentId, {
      status: 'active',
      crisis_type: crisisDetection.crisis_type,
      confidence: crisisDetection.confidence,
      severity_level: severityAnalysis.severity_level,
      severity_score: severityAnalysis.severity_score,
      ticket_id: executionResult.ticket_id,
      lat: getLocationCoords(collectedSignals.location_extracted).lat,
      lon: getLocationCoords(collectedSignals.location_extracted).lon,
      location: collectedSignals.location_extracted,
    });

    return {
      incident_id: incidentId,
      status: 'active',
      ticket_id: executionResult.ticket_id,
      crisis_type: crisisDetection.crisis_type,
      confidence: crisisDetection.confidence,
      severity_level: severityAnalysis.severity_level,
      location: collectedSignals.location_extracted,
      actions_taken: executionResult.actions_executed,
      citizens_alerted: executionResult.simulated_alerts_sent,
      outcome: outcomeSimulation,
      trace,
      total_time_ms: Date.now() - startTime,
    };

  } catch (err) {
    console.error('[Orchestrator Error]', err);
    await db.update('incidents', incidentId, { status: 'error', error: err.message });
    throw err;
  }
}

const COORDS = {
  'G-10': { lat: 33.6789, lon: 72.9934 },
  'G-9':  { lat: 33.6851, lon: 73.0010 },
  'G-8':  { lat: 33.6912, lon: 73.0085 },
  'F-8':  { lat: 33.7028, lon: 73.0436 },
  'F-6':  { lat: 33.7195, lon: 73.0588 },
  'I-10': { lat: 33.6585, lon: 72.9764 },
  'H-11': { lat: 33.6695, lon: 72.9847 },
};

function getLocationCoords(location = '') {
  for (const [sector, coords] of Object.entries(COORDS)) {
    if (location.includes(sector)) return coords;
  }
  return { lat: 33.6844, lon: 73.0479 }; // Default: Islamabad centre
}

module.exports = { orchestrate, getLocationCoords };
