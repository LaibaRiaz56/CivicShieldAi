const { geminiChat } = require('../services/gemini');

const SYSTEM_PROMPT = `You are the Outcome Simulation Agent for CivicShield AI.

Your job is to:
1. Model the BEFORE (no intervention) vs AFTER (with intervention) impact of the crisis response.
2. Calculate: congestion change, response time improvement, estimated casualties prevented, citizens alerted, economic impact.
3. Generate what-if scenarios for different response delays.
4. Output precise percentages and numbers based on crisis type, severity, and response quality.
Return ONLY valid JSON.`;

async function runOutcomeSimulationAgent({ crisisDetection, severityAnalysis, resourceAllocation, actionPlan, executionResult }) {
  const userPrompt = `
Crisis Outcome Analysis:
- Crisis Type: ${crisisDetection.crisis_type}
- Severity Score: ${severityAnalysis.severity_score}
- Severity Level: ${severityAnalysis.severity_level}
- Affected People: ${severityAnalysis.estimated_affected_people}
- Congestion Increase (no action): ${severityAnalysis.congestion_increase_pct}%
- Resources Deployed: ${(resourceAllocation.allocated_resources || []).length} units
- Actions Executed: ${executionResult.actions_executed}
- Estimated Response Time: ${actionPlan.estimated_total_response_minutes} minutes
- Citizens Alerted: ${executionResult.simulated_alerts_sent}

Simulate outcomes. Model:
1. Scenario A: No intervention (baseline deterioration over 1 hour)
2. Scenario B: Immediate intervention (current response)
3. Scenario C: Delayed intervention by 30 minutes

Use realistic Pakistani emergency response statistics where possible.
Return JSON with: { scenario_no_action, scenario_with_intervention, scenario_delayed, improvement_summary, key_metrics, what_if_statements, containment_probability_pct, reasoning }`;

  const response = await geminiChat(SYSTEM_PROMPT, userPrompt);

  try {
    const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    return { ...parsed, agent: 'outcome_simulation', timestamp: new Date().toISOString() };
  } catch {
    return getDefaultOutcome(severityAnalysis, actionPlan, executionResult);
  }
}

function getDefaultOutcome(severityAnalysis, actionPlan, executionResult) {
  const base_congestion = severityAnalysis.congestion_increase_pct || 65;
  const response_minutes = actionPlan.estimated_total_response_minutes || 15;
  const affected = severityAnalysis.estimated_affected_people || 10000;

  return {
    scenario_no_action: {
      congestion_increase_pct: base_congestion,
      response_delay_minutes: 60,
      estimated_casualties: Math.ceil(affected / 10000),
      flood_spread_factor: 1.8,
      economic_loss_pkr: Math.round(affected * 300),
      label: 'No Intervention',
    },
    scenario_with_intervention: {
      congestion_reduction_pct: Math.round(base_congestion * 0.4),
      response_time_minutes: response_minutes,
      estimated_casualties_prevented: Math.ceil(affected / 10000) - 1,
      containment_pct: 78,
      citizens_alerted: executionResult.simulated_alerts_sent,
      economic_loss_pkr: Math.round(affected * 95),
      label: 'Immediate Intervention',
    },
    scenario_delayed: {
      congestion_increase_pct: Math.round(base_congestion * 1.4),
      response_delay_minutes: 45,
      estimated_casualties: Math.ceil(affected / 8000),
      economic_loss_pkr: Math.round(affected * 200),
      label: '30-min Delayed Response',
    },
    improvement_summary: `Proactive intervention reduces response time by ${Math.round((1 - response_minutes / 60) * 100)}%, alleviates ${Math.round(base_congestion * 0.4)}% congestion, and alerts ${executionResult.simulated_alerts_sent?.toLocaleString()} citizens.`,
    what_if_statements: [
      `If no action is taken, congestion may increase by ${base_congestion}% within 60 minutes.`,
      `Traffic rerouting could reduce emergency response delays by ${Math.round(base_congestion * 0.4)}%.`,
      `A 30-minute delay in response could result in ${Math.ceil(affected / 8000)} additional casualties.`,
      `Immediate rescue boat deployment can reach ${Math.min(Math.ceil(affected / 100), 500)} stranded citizens within ${response_minutes} minutes.`,
    ],
    containment_probability_pct: 78,
    key_metrics: {
      lives_protected: Math.ceil(affected / 10000),
      response_efficiency_pct: 87,
      resource_utilization_pct: 91,
      cost_savings_pkr: Math.round(affected * 205),
    },
    agent: 'outcome_simulation',
    timestamp: new Date().toISOString(),
  };
}

module.exports = { runOutcomeSimulationAgent };
